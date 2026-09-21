import os
import re

import requests


def normalize_phone(phone):
    phone = re.sub(r"[\s\-()\.]", "", str(phone or "")).strip()

    if phone.startswith("+"):
        if _valid_e164(phone):
            return phone, None
        return None, "Invalid international phone number."

    if phone.isdigit():
        default_country_code = os.getenv(
            "DEFAULT_COUNTRY_CODE", ""
        ).strip()

        if default_country_code:
            if not default_country_code.startswith("+"):
                default_country_code = "+" + default_country_code

            normalized = default_country_code + phone

            if _valid_e164(normalized):
                return normalized, None

        return None, (
            "Phone number must include a country code, or set the "
            "DEFAULT_COUNTRY_CODE environment variable."
        )

    return None, "Invalid phone number."


def _valid_e164(phone):
    body = phone.lstrip("+")
    return body.isdigit() and 7 <= len(body) <= 15


def send_whatsapp_message(phone, message):
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()

    if not access_token or not phone_number_id:
        return {
            "success": False,
            "message_id": None,
            "code": "WHATSAPP_CREDENTIALS_NOT_CONFIGURED",
            "error": (
                "WhatsApp credentials (WHATSAPP_ACCESS_TOKEN and "
                "WHATSAPP_PHONE_NUMBER_ID) are not configured on the server."
            ),
        }

    normalized_phone, phone_error = normalize_phone(phone)

    if phone_error:
        return {
            "success": False,
            "message_id": None,
            "code": "INVALID_PHONE_NUMBER",
            "error": phone_error,
        }

    url = (
        f"https://graph.facebook.com/v21.0/"
        f"{phone_number_id}/messages"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": normalized_phone,
        "type": "text",
        "text": {"body": message},
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30,
        )

        content_type = response.headers.get("content-type", "")

        try:
            data = response.json()
        except ValueError:
            data = {}

        if response.ok:
            messages = data.get("messages") or []
            message_id = (
                messages[0].get("id", "") if messages else ""
            )

            return {
                "success": True,
                "message_id": message_id,
                "code": "SENT",
                "error": None,
            }

        error = data.get("error") or {}
        error_message = error.get("message", "WhatsApp API error.")
        error_code = error.get("code")

        return {
            "success": False,
            "message_id": None,
            "code": f"WHATSAPP_API_ERROR_{error_code}"
            if error_code else "WHATSAPP_API_ERROR",
            "error": f"WhatsApp API error: {error_message}",
        }

    except requests.Timeout:
        return {
            "success": False,
            "message_id": None,
            "code": "WHATSAPP_TIMEOUT",
            "error": "Timed out contacting the WhatsApp API.",
        }
    except requests.RequestException as exc:
        return {
            "success": False,
            "message_id": None,
            "code": "WHATSAPP_NETWORK_ERROR",
            "error": f"Network error contacting WhatsApp: {exc}",
        }