from django.urls import path

from .views import (
    MessageListView,
    CustomerMessageListView,
)


urlpatterns = [
    path(
        "",
        MessageListView.as_view(),
        name="message-list"
    ),

    path(
        "customer/<int:customer_id>/",
        CustomerMessageListView.as_view(),
        name="customer-messages"
    ),
]