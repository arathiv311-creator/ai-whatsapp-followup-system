from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from followups.models import FollowUp
from messaging.models import Message


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "total_customers": Customer.objects.count(),
            "active_customers": Customer.objects.filter(
                status="active"
            ).count(),
            "replied_customers": Customer.objects.filter(
                status="replied"
            ).count(),

            "total_followups": FollowUp.objects.count(),
            "active_followups": FollowUp.objects.filter(
                status="active"
            ).count(),
            "completed_followups": FollowUp.objects.filter(
                status="completed"
            ).count(),

            "messages_sent": Message.objects.filter(
                direction="outgoing"
            ).count(),
            "messages_received": Message.objects.filter(
                direction="incoming"
            ).count(),
        })