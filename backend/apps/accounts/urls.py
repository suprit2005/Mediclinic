from django.urls import path
from .views import MeView, PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]