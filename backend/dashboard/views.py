from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from followups.models import FollowUp
from messaging.models import Message


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customers = Customer.objects.filter(
            user=request.user
        )

        followups = FollowUp.objects.filter(
            customer__user=request.user
        )

        messages = Message.objects.filter(
            customer__user=request.user
        )

        return Response({
            "total_customers": customers.count(),

            "active_customers": customers.filter(
                status="active"
            ).count(),

            "replied_customers": customers.filter(
                status="replied"
            ).count(),

            "total_followups": followups.count(),

            "active_followups": followups.filter(
                status="active"
            ).count(),

            "completed_followups": followups.filter(
                status="completed"
            ).count(),

            "messages_sent": messages.filter(
                direction="outgoing"
            ).count(),

            "messages_received": messages.filter(
                direction="incoming"
            ).count(),
        })