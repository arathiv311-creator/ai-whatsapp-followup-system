from django.urls import path

from .views import (
    MessageListView,
    CustomerMessageListView,
    SendMessageView,
    GenerateMessageView,
)


urlpatterns = [
    path(
        "generate/",
        GenerateMessageView.as_view(),
        name="generate-message"
    ),

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