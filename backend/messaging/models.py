from django.db import models
from customers.models import Customer
from followups.models import FollowUp


class Message(models.Model):
    DIRECTION_CHOICES = [
        ("outgoing", "Outgoing"),
        ("incoming", "Incoming"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("failed", "Failed"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    followup = models.ForeignKey(
        FollowUp,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages"
    )

    direction = models.CharField(
        max_length=20,
        choices=DIRECTION_CHOICES
    )

    message_text = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    external_message_id = models.CharField(
        max_length=255,
        blank=True
    )

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.direction}"