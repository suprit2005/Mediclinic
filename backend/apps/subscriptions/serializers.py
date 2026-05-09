from rest_framework import serializers
from .models import Subscription, PLAN_FEATURES


class SubscriptionSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    plan_label = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_label', 'price', 'status',
            'features', 'trial_end', 'current_period_end',
            'days_remaining', 'created_at', 'updated_at',
        ]

    def get_features(self, obj):
        return PLAN_FEATURES.get(obj.plan, PLAN_FEATURES['STARTER'])

    def get_plan_label(self, obj):
        return PLAN_FEATURES.get(obj.plan, {}).get('label', obj.plan)

    def get_price(self, obj):
        return PLAN_FEATURES.get(obj.plan, {}).get('price', 0)

    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.current_period_end:
            delta = obj.current_period_end - timezone.now()
            return max(0, delta.days)
        if obj.trial_end:
            delta = obj.trial_end - timezone.now()
            return max(0, delta.days)
        return None
