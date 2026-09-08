def generate_followup_message(customer):
    name = customer.name

    return (
        f"Hi {name}, just following up on our previous conversation. "
        "Please let me know if you have any questions."
    )