from django.db import models
from customers.models import Customer


class FollowUp(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("stopped", "Stopped"),
        ("completed", "Completed"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="followups"
    )

    first_message_at = models.DateTimeField()
    interval_minutes = models.PositiveIntegerField(default=1440)
    max_followups = models.PositiveIntegerField(default=3)
    followups_sent = models.PositiveIntegerField(default=0)
    next_followup_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    paused = models.BooleanField(default=False)
    customer_replied = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.name} - FollowUp {self.id}"