import logging
import os

from . import mock_whatsapp
from . import whatsapp
from .whatsapp import normalize_phone

logger = logging.getLogger(__name__)


def _use_mock():
    flag = os.getenv("USE_MOCK_WHATSAPP", "").strip().lower()

    if flag in ("1", "true", "yes", "on"):
        return True

    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()

    if not access_token or not phone_number_id:
        return True

    return False


def send_whatsapp_message(phone, message):
    if _use_mock():
        logger.info(
            "Routing WhatsApp send to mock (USE_MOCK_WHATSAPP enabled "
            "or real credentials missing)."
        )
        return mock_whatsapp.send_whatsapp_message(phone, message)

    return whatsapp.send_whatsapp_message(phone, message)


def generate_followup_message(customer):
    name = customer.name

    return (
        f"Hi {name}, "
        "just following up regarding our service. "
        "Please let me know if you have any questions. "
        "We would be happy to help you."
    )