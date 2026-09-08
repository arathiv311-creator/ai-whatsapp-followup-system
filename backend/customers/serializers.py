from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must contain at least 2 characters."
            )
        return value

    def validate_phone(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Phone number must be between 10 and 15 digits."
            )

        return value

    class Meta:
        model = Customer
        fields = "__all__"