from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied

from .models import FollowUp
from .serializers import FollowUpSerializer
from messaging.models import Message
from messaging.services import generate_followup_message, send_whatsapp_message


class FollowUpListCreateView(generics.ListCreateAPIView):
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FollowUp.objects.filter(
            customer__user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        customer = serializer.validated_data["customer"]

        if customer.user != self.request.user:
           raise PermissionDenied(
              "You cannot create a follow-up for this customer."
            )

        followup = serializer.save()

        message = generate_followup_message(customer)

        result = send_whatsapp_message(
            customer.phone,
            message
        )
        Message.objects.create(
            customer=customer,
            followup=followup,
            direction="outgoing",
            message_text=message,
            status="sent",
            external_message_id=result["message_id"]
        )

        return followup


class FollowUpDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FollowUp.objects.filter(
            customer__user=self.request.user
        )


class PauseFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            followup = FollowUp.objects.get(
                pk=pk,
                customer__user=request.user
            )
        except FollowUp.DoesNotExist:
            return Response(
                {"detail": "Follow-up not found."},
                status=404
            )

        followup.paused = True
        followup.status = "paused"
        followup.save()

        return Response({"message": "Follow-up paused"})


class ResumeFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            followup = FollowUp.objects.get(
                pk=pk,
                customer__user=request.user
            )
        except FollowUp.DoesNotExist:
            return Response(
                {"detail": "Follow-up not found."},
                status=404
            )

        followup.paused = False
        followup.status = "active"
        followup.save()

        return Response({"message": "Follow-up resumed"})


class StopFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            followup = FollowUp.objects.get(
                pk=pk,
                customer__user=request.user
            )
        except FollowUp.DoesNotExist:
            return Response(
                {"detail": "Follow-up not found."},
                status=404
            )

        followup.paused = False
        followup.status = "stopped"
        followup.save()

        return Response({"message": "Follow-up stopped"})