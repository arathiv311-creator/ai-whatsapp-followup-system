from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from messaging.models import Message
from followups.models import FollowUp


class WhatsAppWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        message_text = request.data.get("message")

        if not phone or not message_text:
            return Response(
                {"error": "phone and message are required"},
                status=400
            )

        try:
            customer = Customer.objects.get(phone=phone)
        except Customer.DoesNotExist:
            return Response(
                {"error": "Customer not found"},
                status=404
            )

        Message.objects.create(
            customer=customer,
            direction="incoming",
            message_text=message_text,
            status="sent"
        )

        customer.status = "replied"
        customer.save()

        FollowUp.objects.filter(
            customer=customer,
            status="active"
        ).update(
            customer_replied=True,
            status="stopped",
            paused=False
        )

        return Response({
            "message": "Reply received and follow-ups stopped"
        })