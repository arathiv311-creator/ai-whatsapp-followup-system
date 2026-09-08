from django.urls import path

from .views import (
    FollowUpListCreateView,
    FollowUpDetailView,
    PauseFollowUpView,
    ResumeFollowUpView,
    StopFollowUpView,
)

urlpatterns = [
    path("", FollowUpListCreateView.as_view(), name="followup-list-create"),
    path("<int:pk>/", FollowUpDetailView.as_view(), name="followup-detail"),
    path("<int:pk>/pause/", PauseFollowUpView.as_view(), name="followup-pause"),
    path("<int:pk>/resume/", ResumeFollowUpView.as_view(), name="followup-resume"),
    path("<int:pk>/stop/", StopFollowUpView.as_view(), name="followup-stop"),
]