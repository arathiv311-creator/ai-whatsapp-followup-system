import uuid


def send_whatsapp_message(phone, message):
    print(f"Sending WhatsApp message to {phone}: {message}")

    return {
        "success": True,
        "message_id": str(uuid.uuid4())
    }