from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import models, transaction
from django.utils import timezone

from followups.models import FollowUp
from messaging.models import Message
from messaging.ai import generate_followup_message
from messaging.services import send_whatsapp_message


class Command(BaseCommand):
    help = "Process scheduled follow-ups"

    def handle(self, *args, **options):
        now = timezone.now()

        followups = FollowUp.objects.filter(
            status="active",
            paused=False,
            customer_replied=False,
            next_followup_at__lte=now,
            followups_sent__lt=models.F("max_followups"),
        )

        for followup in followups:
            with transaction.atomic():
                customer = followup.customer

                message_text = generate_followup_message(customer)

                result = send_whatsapp_message(
                    customer.phone,
                    message_text
                )

                if result["success"]:
                    Message.objects.create(
                        customer=customer,
                        followup=followup,
                        direction="outgoing",
                        message_text=message_text,
                        status="sent",
                        external_message_id=result["message_id"],
                    )

                    followup.followups_sent += 1

                    if followup.followups_sent >= followup.max_followups:
                        followup.status = "completed"
                        followup.next_followup_at = None
                    else:
                        followup.next_followup_at = (
                            timezone.now()
                            + timedelta(
                                minutes=followup.interval_minutes
                            )
                        )

                    followup.save()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Follow-up sent to {customer.name}"
                        )
                    )