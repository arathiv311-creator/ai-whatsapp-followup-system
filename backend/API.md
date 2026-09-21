# WhatsApp AI Follow-up System — Backend API

Base URL: `http://127.0.0.1:8000/api`

All endpoints (except the ones noted) require a `Authorization: Bearer <access_token>` header. Obtain a token from `POST /api/auth/login/`.

## Authentication

### `POST /api/auth/login/`
Body (JSON):

```json
{
  "username": "arathi",
  "password": "..."
}
```

Response: `{ "access": "...", "refresh": "..." }`

Use `POST /api/auth/refresh/` with `{ "refresh": "..." }` to get a new access token.

---

## AI Message Generation

### `POST /api/messages/generate/`
Generates a follow-up message with OpenAI for a given customer. The message is **not** sent — it is saved with status `generated` so the user can review and edit it first.

Body (JSON):

```json
{
  "customer": 3,
  "followup": 4,
  "tone": "friendly",
  "length": "medium",
  "purpose": "followup",
  "language": "manglish"
}
```

Fields:

| Field      | Required | Options                                                                 |
|------------|----------|-------------------------------------------------------------------------|
| `customer` | Yes      | ID of a customer owned by the current user                              |
| `followup` | Optional | ID of a follow-up schedule belonging to that customer                   |
| `tone`     | No       | `professional`, `friendly` (default), `casual`                          |
| `length`   | No       | `short`, `medium` (default), `detailed`                                 |
| `purpose`  | No       | `followup` (default), `sales`, `reminder`, `check_in`, `re_engagement`  |
| `language` | No       | `english` (default), `malayalam`, `manglish`                            |

Response `200`:

```json
{
  "message_id": 8,
  "message": "Hi Anu, ...",
  "language": "manglish",
  "tone": "friendly",
  "purpose": "followup",
  "length": "medium"
}
```

Error responses:

| Status | Code                          | Meaning                                        |
|--------|-------------------------------|------------------------------------------------|
| 400    | (validation)                  | Invalid body                                   |
| 404    | —                             | Customer/follow-up not found or not accessible |
| 503    | `AI_API_KEY_NOT_CONFIGURED`   | `OPENAI_API_KEY` missing on the server         |
| 502    | `AI_AUTH_FAILED`              | Invalid/expired OpenAI key                     |
| 429    | `AI_RATE_LIMITED`             | OpenAI rate limit                              |
| 504    | `AI_TIMEOUT` / `AI_CONNECTION_ERROR` | OpenAI unreachable                     |

---

## Send Message

### `POST /api/messages/send/`
Sends a message through the WhatsApp Cloud API. Requires `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` to be configured on the server.

Body (JSON):

```json
{
  "customer": 3,
  "followup": 4,
  "message_text": "Hi Anu, just following up...",
  "message_id": 8
}
```

Fields:

| Field         | Required | Meaning                                                    |
|---------------|----------|------------------------------------------------------------|
| `customer`    | Yes      | ID of a customer owned by the current user                 |
| `followup`    | Optional | Follow-up schedule to associate the message with           |
| `message_text`| Yes      | The final message text (after user review/edit)            |
| `message_id`  | Optional | ID of a previously generated message to update with result |

The customer's phone number is normalized before sending:

- Spaces, dashes, dots and parentheses are stripped.
- Numbers starting with `+` are used as-is.
- Numbers without a country code are prefixed with `DEFAULT_COUNTRY_CODE` (e.g. `+91`) if set; otherwise sending fails with `INVALID_PHONE_NUMBER`.

Response `201` (sent successfully) — the serialized message with `status: "sent"` and `external_message_id`:

```json
{
  "id": 8,
  "customer_name": "Anu Rahman",
  "direction": "outgoing",
  "message_type": "followup",
  "message_text": "Hi Anu, ...",
  "tone": "friendly",
  "language": "manglish",
  "status": "sent",
  "external_message_id": "wamid.HBg...",
  "error_message": "",
  "created_at": "2026-09-21T12:40:00.000000Z",
  "user": 1,
  "customer": 3,
  "followup": 4
}
```

Error responses:

| Status | Code                                       | Meaning                                                   |
|--------|--------------------------------------------|-----------------------------------------------------------|
| 400    | (validation)                               | Invalid body or empty `message_text`                      |
| 404    | —                                          | Customer/follow-up/generated message not accessible       |
| 502    | `WHATSAPP_CREDENTIALS_NOT_CONFIGURED`      | WhatsApp token / phone-number-id not set on the server    |
| 502    | `INVALID_PHONE_NUMBER`                     | Phone lacks a country code and `DEFAULT_COUNTRY_CODE` is unset |
| 502    | `WHATSAPP_API_ERROR_*`                     | WhatsApp Graph API rejected the request                   |
| 502    | `WHATSAPP_TIMEOUT` / `WHATSAPP_NETWORK_ERROR` | WhatsApp API unreachable                               |

On failure the message is still recorded with `status: "failed"` and the error message, so it appears in the message history.

---

## Messages

### `GET /api/messages/`
List all messages belonging to the current user (newest first).

### `GET /api/messages/customer/<customer_id>/`
List messages for one customer.

Each message includes `customer_name`, `message_type`, `tone`, `language`, `status`, `direction`, `message_text`, `external_message_id`, `error_message`, `created_at`.

Status values: `draft`, `generated`, `pending`, `sent`, `delivered`, `failed`.

---

## Environment Variables (server)

| Variable | Required for | Example |
|----------|--------------|---------|
| `OPENAI_API_KEY` | message generation | `sk-...` |
| `OPENAI_MODEL` | message generation (optional) | `gpt-4o-mini` (default) |
| `WHATSAPP_ACCESS_TOKEN` | sending | `EAAG...` |
| `WHATSAPP_PHONE_NUMBER_ID` | sending | `123456789012345` |
| `WHATSAPP_VERIFY_TOKEN` | webhooks | `whatsapp_verify_token` |
| `USE_MOCK_WHATSAPP` | dev/testing | `True`/`False` |
| `DEFAULT_COUNTRY_CODE` | sending (optional) | `+91` |
| `DATABASE_URL` | Render (PostgreSQL) | `postgres://...?sslmode=require` |

Keys are read server-side only and are never exposed to the frontend.