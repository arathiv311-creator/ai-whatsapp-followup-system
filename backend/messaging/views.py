from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from customers.models import Customer
from followups.models import FollowUp

from .models import Message
from .serializers import (
    MessageSerializer,
    GenerateMessageSerializer,
    SendMessageSerializer,
)
from .ai import build_message_context, generate_message_with_fallback
from .services import send_whatsapp_message


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            customer__user=self.request.user
        )


class CustomerMessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs["customer_id"]

        return Message.objects.filter(
            customer_id=customer_id,
            customer__user=self.request.user
        )


def _get_customer(request, customer_id):
    try:
        return Customer.objects.get(
            pk=customer_id,
            user=request.user,
        )
    except Customer.DoesNotExist:
        return None


def _get_followup(request, customer, followup_id):
    if not followup_id:
        return None

    try:
        return FollowUp.objects.get(
            pk=followup_id,
            customer=customer,
            customer__user=request.user,
        )
    except FollowUp.DoesNotExist:
        return None


class GenerateMessageView(generics.GenericAPIView):
    serializer_class = GenerateMessageSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        customer = _get_customer(request, data["customer"])

        if not customer:
            return Response(
                {"detail": "Customer not found or not accessible."},
                status=404,
            )

        followup = _get_followup(
            request,
            customer,
            data.get("followup"),
        )

        if data.get("followup") and not followup:
            return Response(
                {
                    "detail": (
                        "Follow-up not found for this customer."
                    )
                },
                status=404,
            )

        options = {
            "tone": data["tone"],
            "length": data["length"],
            "purpose": data["purpose"],
            "language": data["language"],
        }

        context = build_message_context(customer, followup)

        message_text, ai_fallback_code = generate_message_with_fallback(
            context,
            options,
        )

        message = Message.objects.create(
            user=request.user,
            customer=customer,
            followup=followup,
            direction="outgoing",
            message_type=data["purpose"],
            message_text=message_text,
            tone=data["tone"],
            language=data["language"],
            status="generated",
        )

        response_data = {
            "message_id": message.id,
            "message": message_text,
            "language": data["language"],
            "tone": data["tone"],
            "purpose": data["purpose"],
            "length": data["length"],
        }

        if ai_fallback_code:
            response_data["ai_fallback"] = True
            response_data["ai_fallback_reason"] = ai_fallback_code

        return Response(response_data, status=200)


class SendMessageView(generics.GenericAPIView):
    serializer_class = SendMessageSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        customer = _get_customer(request, data["customer"])

        if not customer:
            return Response(
                {"detail": "Customer not found or not accessible."},
                status=404,
            )

        followup = _get_followup(
            request,
            customer,
            data.get("followup"),
        )

        if data.get("followup") and not followup:
            return Response(
                {
                    "detail": (
                        "Follow-up not found for this customer."
                    )
                },
                status=404,
            )

        message_text = (data.get("message_text") or "").strip()

        if not message_text:
            return Response(
                {"detail": "message_text is required."},
                status=400,
            )

        existing_message = None
        message_id = data.get("message_id")

        if message_id:
            try:
                existing_message = Message.objects.get(
                    pk=message_id,
                    user=request.user,
                    customer=customer,
                    direction="outgoing",
                )
            except Message.DoesNotExist:
                return Response(
                    {
                        "detail": (
                            "Generated message not found or not "
                            "accessible."
                        )
                    },
                    status=404,
                )

        result = send_whatsapp_message(
            customer.phone,
            message_text,
        )

        message = existing_message or Message(
            user=request.user,
            customer=customer,
            followup=followup,
            direction="outgoing",
            message_text=message_text,
        )

        message.followup = followup or message.followup
        message.message_text = message_text

        if result["success"]:
            message.status = "sent"
            message.external_message_id = result["message_id"]
            message.error_message = ""
            message.save()

            return Response(
                MessageSerializer(message).data,
                status=201,
            )

        message.status = "failed"
        message.error_message = result["error"]
        message.save()

        return Response(
            {
                "detail": result["error"],
                "code": result["code"],
                "message": MessageSerializer(message).data,
            },
            status=502,
        )