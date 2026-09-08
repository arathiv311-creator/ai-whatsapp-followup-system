from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Message
from .serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    queryset = Message.objects.all().order_by("-created_at")
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]


class CustomerMessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs["customer_id"]

        return Message.objects.filter(
            customer_id=customer_id
        ).order_by("-created_at")