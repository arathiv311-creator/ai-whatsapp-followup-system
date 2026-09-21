import uuid


def generate_followup_message(customer):
    name = customer.name

    return (
        f"Hi {name}, "
        "just following up regarding our service. "
        "Please let me know if you have any questions. "
        "We would be happy to help you."
    )


def send_whatsapp_message(phone, message):
    print(f"Sending WhatsApp message to {phone}: {message}")

    return {
        "success": True,
        "message_id": str(uuid.uuid4())
    }