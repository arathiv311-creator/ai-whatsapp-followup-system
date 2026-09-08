from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FollowUp
from .serializers import FollowUpSerializer


class FollowUpListCreateView(generics.ListCreateAPIView):
    queryset = FollowUp.objects.all().order_by("-created_at")
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]


class FollowUpDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]


class PauseFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        followup = FollowUp.objects.get(pk=pk)
        followup.paused = True
        followup.status = "paused"
        followup.save()

        return Response({"message": "Follow-up paused"})


class ResumeFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        followup = FollowUp.objects.get(pk=pk)
        followup.paused = False
        followup.status = "active"
        followup.save()

        return Response({"message": "Follow-up resumed"})


class StopFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        followup = FollowUp.objects.get(pk=pk)
        followup.paused = False
        followup.status = "stopped"
        followup.save()

        return Response({"message": "Follow-up stopped"})