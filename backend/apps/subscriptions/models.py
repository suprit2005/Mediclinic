from django.db import models
from django.utils import timezone


PLAN_FEATURES = {
    'STARTER': {
        'max_doctors': 1,
        'analytics': False,
        'billing': False,
        'inventory': False,
        'multi_clinic': False,
        'label': 'Starter',
        'price': 0,
    },
    'PROFESSIONAL': {
        'max_doctors': 10,
        'analytics': True,
        'billing': True,
        'inventory': True,
        'multi_clinic': False,
        'label': 'Professional',
        'price': 49,
    },
    'ENTERPRISE': {
        'max_doctors': None,
        'analytics': True,
        'billing': True,
        'inventory': True,
        'multi_clinic': True,
        'label': 'Enterprise',
        'price': 199,
    },
}

PLAN_STRIPE_DATA = {
    'PROFESSIONAL': {
        'amount': 4900,
        'name': 'MediClinic Professional',
        'description': 'Up to 10 doctors, unlimited appointments, billing & analytics',
    },
    'ENTERPRISE': {
        'amount': 19900,
        'name': 'MediClinic Enterprise',
        'description': 'Unlimited doctors, multi-clinic, white-label, dedicated support',
    },
}


class Subscription(models.Model):

    class PlanChoices(models.TextChoices):
        STARTER      = 'STARTER',      'Starter'
        PROFESSIONAL = 'PROFESSIONAL', 'Professional'
        ENTERPRISE   = 'ENTERPRISE',   'Enterprise'

    class StatusChoices(models.TextChoices):
        ACTIVE   = 'ACTIVE',    'Active'
        TRIALING = 'TRIALING',  'Trialing'
        PAST_DUE = 'PAST_DUE',  'Past Due'
        CANCELED = 'CANCELED',  'Canceled'
        INACTIVE = 'INACTIVE',  'Inactive'

    clinic = models.OneToOneField(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        related_name='subscription',
    )
    plan = models.CharField(
        max_length=20,
        choices=PlanChoices.choices,
        default=PlanChoices.STARTER,
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE,
    )

    stripe_customer_id          = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id      = models.CharField(max_length=255, blank=True, null=True)
    stripe_checkout_session_id  = models.CharField(max_length=255, blank=True, null=True)

    trial_end           = models.DateTimeField(null=True, blank=True)
    current_period_end  = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.clinic.name} — {self.plan} ({self.status})"

    @property
    def features(self):
        return PLAN_FEATURES.get(self.plan, PLAN_FEATURES['STARTER'])

    @property
    def is_active(self):
        return self.status in [self.StatusChoices.ACTIVE, self.StatusChoices.TRIALING]
