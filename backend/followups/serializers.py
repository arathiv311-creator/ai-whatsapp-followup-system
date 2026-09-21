from rest_framework import serializers
from .models import FollowUp


class FollowUpSerializer(serializers.ModelSerializer):

    class Meta:
        model = FollowUp
        fields = "__all__"
        read_only_fields = [
            "id",
            "followups_sent",
            "next_followup_at",
            "created_at",
            "updated_at",
        ]

    def validate_interval_minutes(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Interval must be at least 1 minute."
            )
        return value

    def validate_max_followups(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Maximum follow-ups must be at least 1."
            )
        return value