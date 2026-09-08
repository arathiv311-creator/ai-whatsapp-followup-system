from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerSerializer


class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all().order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]