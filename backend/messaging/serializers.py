from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    message_text = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "direction",
            "status",
            "external_message_id",
            "error_message",
        ]