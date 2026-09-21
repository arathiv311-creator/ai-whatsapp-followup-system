from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True,
    )

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "direction",
            "message_type",
            "tone",
            "language",
            "status",
            "external_message_id",
            "error_message",
        ]


class GenerateMessageSerializer(serializers.Serializer):
    customer = serializers.IntegerField()
    followup = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    tone = serializers.ChoiceField(
        choices=["professional", "friendly", "casual"],
        default="professional",
    )
    length = serializers.ChoiceField(
        choices=["short", "medium", "detailed"],
        default="medium",
    )
    purpose = serializers.ChoiceField(
        choices=[
            "followup",
            "sales",
            "reminder",
            "check_in",
            "re_engagement",
        ],
        default="followup",
    )
    language = serializers.ChoiceField(
        choices=["english", "malayalam", "manglish"],
        default="english",
    )


class SendMessageSerializer(serializers.Serializer):
    customer = serializers.IntegerField()
    followup = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    message_text = serializers.CharField()
    message_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )