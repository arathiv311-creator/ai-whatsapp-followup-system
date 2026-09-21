import logging
import os

import openai

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    def __init__(self, message, code="AI_GENERATION_FAILED", status_code=500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


PURPOSE_LABELS = {
    "followup": "Follow-up",
    "sales": "Sales pitch",
    "reminder": "Reminder",
    "check_in": "Check-in",
    "re_engagement": "Re-engagement",
}


def generate_followup_message(customer):
    name = customer.name

    return (
        f"Hi {name}, just following up on our previous conversation. "
        "Please let me know if you have any questions."
    )


def default_fallback_message(context, options):
    name = context.get("customer_name") or "there"

    return (
        f"Hi {name}, just following up on our previous conversation. "
        "I wanted to check in on our earlier discussion and see if you "
        "have any questions. Please let me know if there is anything I "
        "can help you with."
    )


def generate_message_with_fallback(context, options):
    try:
        return generate_with_ai(context, options), None
    except AIProviderError as exc:
        logger.warning(
            "AI message generation failed (code=%s, error=%s); "
            "returning default fallback message.",
            exc.code,
            exc.message,
        )
        return default_fallback_message(context, options), exc.code


def _safe(value, limit):
    value = (value or "").strip()
    if len(value) > limit:
        return value[:limit] + "..."
    return value


def build_message_context(customer, followup=None):
    context = {
        "customer_name": _safe(customer.name, 100),
        "customer_company": _safe(customer.company, 100),
        "customer_status": customer.get_status_display(),
        "customer_notes": _safe(customer.notes, 500),
        "first_contact_date": followup.first_message_at.strftime(
            "%Y-%m-%d"
        ) if followup else None,
        "followup_count": (
            f"{followup.followups_sent} of {followup.max_followups}"
            if followup else None
        ),
        "last_message": None,
        "previous_messages": [],
    }

    messages = (
        customer.messages.order_by("-created_at")[:6]
        if customer.pk
        else customer.messages.all()[:6]
    )

    history = []
    for message in reversed(list(messages)):
        history.append(
            f"[{message.direction} {message.created_at:%Y-%m-%d}] "
            f"{_safe(message.message_text, 160)}"
        )

    context["previous_messages"] = history

    return context


def _language_instruction(language):
    if language == "malayalam":
        return (
            "Write the WhatsApp message in MALAYALAM, using Malayalam "
            "script. Natural, polite, conversational Malayalam."
        )
    if language == "manglish":
        return (
            "Write the WhatsApp message in MALAYALAM, but rendered in "
            "Manglish (Malayalam written using English/Latin characters, "
            "e.g. 'ningal', 'sukham ano?'). Keep it natural and friendly."
        )
    return "Write the WhatsApp message in English."


def _length_instruction(length):
    return {
        "short": "Keep it SHORT: one to two sentences.",
        "medium": "Keep it MEDIUM: around three sentences.",
        "detailed": "Write a DETAILED message: four to six sentences.",
    }.get(length, "Keep it MEDIUM: around three sentences.")


def generate_with_ai(context, options):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise AIProviderError(
            "AI API key (OPENAI_API_KEY) is not configured on the server.",
            code="AI_API_KEY_NOT_CONFIGURED",
            status_code=503,
        )

    tone = options.get("tone", "professional")
    length = options.get("length", "medium")
    purpose = options.get("purpose", "followup")
    language = options.get("language", "english")

    data = {
        "Customer name": context["customer_name"],
        "Customer company": context["customer_company"],
        "Customer status": context["customer_status"],
        "Customer notes": context["customer_notes"],
    }

    if context["first_contact_date"]:
        data["First contact date"] = context["first_contact_date"]
    if context["followup_count"]:
        data["Follow-ups already sent"] = context["followup_count"]
    if context["previous_messages"]:
        data["Previous messages"] = "; ".join(
            context["previous_messages"]
        )

    facts = "\n".join(f"- {k}: {v}" for k, v in data.items() if v)

    system_prompt = (
        "You write personalized WhatsApp follow-up messages for a small "
        "business owner who follows up with their customers. "
        "Messages must sound natural and human, never robotic, and must "
        "not contain placeholders like [name]. "
        "Do not mention internal customer status labels, follow-up "
        "configurations, or expose sensitive data beyond what is given "
        "to you. "
        f"Tone: {tone}. "
        f"Purpose: {PURPOSE_LABELS.get(purpose, 'Follow-up')}. "
        f"{_length_instruction(length)} "
        f"{_language_instruction(language)} "
        "Return ONLY the final message text with no extra commentary."
    )

    user_prompt = (
        "Write the message using only these facts about the customer:\n\n"
        f"{facts or '- No additional facts provided.'}\n\n"
        f"Purpose: {PURPOSE_LABELS.get(purpose, 'Follow-up')}.\n"
        f"Tone: {tone}.\n"
        f"Length: {length}."
    )

    try:
        client = openai.OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=260,
        )
    except openai.AuthenticationError:
        raise AIProviderError(
            "AI API authentication failed. Check OPENAI_API_KEY.",
            code="AI_AUTH_FAILED",
            status_code=502,
        )
    except openai.RateLimitError:
        raise AIProviderError(
            "AI API rate limit reached. Try again shortly.",
            code="AI_RATE_LIMITED",
            status_code=429,
        )
    except openai.APITimeoutError:
        raise AIProviderError(
            "AI API request timed out. Try again shortly.",
            code="AI_TIMEOUT",
            status_code=504,
        )
    except openai.APIConnectionError:
        raise AIProviderError(
            "Could not reach the AI API. Check network/server connectivity.",
            code="AI_CONNECTION_ERROR",
            status_code=502,
        )
    except openai.APIStatusError as exc:
        raise AIProviderError(
            f"AI API returned an error (status {exc.status_code}).",
            code="AI_API_ERROR",
            status_code=502,
        )
    except Exception:
        raise AIProviderError(
            "Unexpected error while generating the AI message.",
            code="AI_GENERATION_FAILED",
            status_code=500,
        )

    try:
        message = response.choices[0].message.content.strip()
    except Exception:
        raise AIProviderError(
            "AI API returned an empty/unexpected response.",
            code="AI_EMPTY_RESPONSE",
            status_code=502,
        )

    if not message:
        raise AIProviderError(
            "AI API returned an empty message.",
            code="AI_EMPTY_RESPONSE",
            status_code=502,
        )

    return message