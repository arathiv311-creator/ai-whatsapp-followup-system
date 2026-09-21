import logging
import uuid

logger = logging.getLogger(__name__)


def send_whatsapp_message(phone, message):
    message_id = f"SIMULATED-{uuid.uuid4()}"

    logger.info(
        "MOCK WhatsApp send to %s (simulated, id=%s).\nMessage:\n%s",
        phone,
        message_id,
        message,
    )

    return {
        "success": True,
        "message_id": message_id,
        "code": "SIMULATED",
        "error": None,
    }