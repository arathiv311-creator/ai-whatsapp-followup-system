from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Message
from .serializers import MessageSerializer
from .services import send_whatsapp_message,generate_followup_message


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            customer__user=self.request.user
        ).order_by("-created_at")


class CustomerMessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs["customer_id"]

        return Message.objects.filter(
            customer_id=customer_id,
            customer__user=self.request.user
        ).order_by("-created_at")


class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
       customer = serializer.validated_data["customer"]
       message_text = serializer.validated_data.get("message_text")

       if not message_text:
        message_text = generate_followup_message(customer)
        serializer.validated_data["message_text"] = message_text

        if customer.user != self.request.user:
            raise PermissionDenied(
                "You cannot send a message to this customer."
            )

        result = send_whatsapp_message(
            customer.phone,
            message_text
        )

        if result["success"]:
            serializer.save(
                direction="outgoing",
                status="sent",
                external_message_id=result["message_id"]
            )
        else:
            serializer.save(
                direction="outgoing",
                status="failed",
                error_message="Failed to send WhatsApp message"
            )