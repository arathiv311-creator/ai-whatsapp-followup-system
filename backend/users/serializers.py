from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    password2 = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate(self, data):

        if data["password"] != data["password2"]:
            raise serializers.ValidationError(
                {
                    "password": "Passwords do not match."
                }
            )

        if User.objects.filter(
            username=data["username"]
        ).exists():
            raise serializers.ValidationError(
                {
                    "username": "Username already exists."
                }
            )

        if User.objects.filter(
            email=data["email"]
        ).exists():
            raise serializers.ValidationError(
                {
                    "email": "Email already exists."
                }
            )

        return data

    def create(self, validated_data):

        validated_data.pop("password2")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        ]