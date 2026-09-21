from django.urls import path

from .views import (
    MessageListView,
    CustomerMessageListView,
    SendMessageView,
)


urlpatterns = [
    path(
        "send/",
        SendMessageView.as_view(),
        name="send-message"
    ),

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