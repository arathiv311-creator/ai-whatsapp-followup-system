from django.db import models
from django.contrib.auth.models import User
from customers.models import Customer
from followups.models import FollowUp


class Message(models.Model):
    DIRECTION_CHOICES = [
        ("outgoing", "Outgoing"),
        ("incoming", "Incoming"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("generated", "Generated"),
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("failed", "Failed"),
    ]

    MESSAGE_TYPE_CHOICES = [
        ("general", "General"),
        ("followup", "Follow-up"),
        ("sales", "Sales"),
        ("reminder", "Reminder"),
        ("check_in", "Check-in"),
        ("re_engagement", "Re-engagement"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages"
    )

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

    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default="general"
    )

    message_text = models.TextField()

    tone = models.CharField(max_length=20, blank=True)
    language = models.CharField(max_length=20, blank=True)

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

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer.name} - {self.direction}"