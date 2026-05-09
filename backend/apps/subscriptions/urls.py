from django.urls import path
from .views import (
    SubscriptionStatusView,
    CreateCheckoutSessionView,
    CancelSubscriptionView,
    SubscriptionWebhookView,
)

urlpatterns = [
    path('current/',           SubscriptionStatusView.as_view(),      name='subscription-status'),
    path('create-checkout/',   CreateCheckoutSessionView.as_view(),    name='create-checkout'),
    path('cancel/',            CancelSubscriptionView.as_view(),       name='cancel-subscription'),
    path('webhook/',           SubscriptionWebhookView.as_view(),      name='subscription-webhook'),
]
