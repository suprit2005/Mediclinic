import stripe
import json
from datetime import datetime

from django.conf import settings
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Subscription, PLAN_STRIPE_DATA
from .serializers import SubscriptionSerializer

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_dummy')


class SubscriptionStatusView(APIView):
    """GET — returns the current subscription for the authenticated clinic."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clinic = getattr(request.user, 'clinic', None)
        if not clinic:
            return Response({'error': 'No clinic associated with your account.'}, status=400)

        sub, _ = Subscription.objects.get_or_create(
            clinic=clinic,
            defaults={'plan': 'STARTER', 'status': 'ACTIVE'},
        )
        return Response(SubscriptionSerializer(sub).data)


class CreateCheckoutSessionView(APIView):
    """POST { plan: 'PROFESSIONAL' | 'ENTERPRISE' } — creates a Stripe Checkout Session."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan', '').upper()
        clinic = getattr(request.user, 'clinic', None)

        if not clinic:
            return Response({'error': 'No clinic associated with your account.'}, status=400)

        if plan not in PLAN_STRIPE_DATA:
            return Response({'error': f'Invalid plan "{plan}". Choose PROFESSIONAL or ENTERPRISE.'}, status=400)

        plan_data = PLAN_STRIPE_DATA[plan]
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        try:
            sub, _ = Subscription.objects.get_or_create(
                clinic=clinic,
                defaults={'plan': 'STARTER', 'status': 'ACTIVE'},
            )

            # Get or create Stripe Customer
            customer_id = sub.stripe_customer_id
            if not customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=clinic.name,
                    metadata={'clinic_id': str(clinic.id)},
                )
                customer_id = customer.id
                sub.stripe_customer_id = customer_id
                sub.save()

            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                mode='subscription',
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': plan_data['amount'],
                        'recurring': {'interval': 'month'},
                        'product_data': {
                            'name': plan_data['name'],
                            'description': plan_data['description'],
                        },
                    },
                    'quantity': 1,
                }],
                subscription_data={
                    'trial_period_days': 14,
                    'metadata': {
                        'clinic_id': str(clinic.id),
                        'plan': plan,
                    },
                },
                success_url=f"{frontend_url}/subscribe/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{frontend_url}/subscribe/cancel",
                metadata={
                    'clinic_id': str(clinic.id),
                    'plan': plan,
                },
            )

            sub.stripe_checkout_session_id = session.id
            sub.save()

            return Response({'url': session.url, 'session_id': session.id})

        except stripe.error.StripeError as e:
            return Response({'error': str(e.user_message)}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class CancelSubscriptionView(APIView):
    """POST — cancels the active subscription at period end."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        clinic = getattr(request.user, 'clinic', None)
        if not clinic:
            return Response({'error': 'No clinic associated.'}, status=400)

        try:
            sub = Subscription.objects.get(clinic=clinic)
        except Subscription.DoesNotExist:
            return Response({'error': 'No subscription found.'}, status=404)

        if not sub.stripe_subscription_id:
            return Response({'error': 'No active Stripe subscription.'}, status=400)

        try:
            stripe.Subscription.modify(
                sub.stripe_subscription_id,
                cancel_at_period_end=True,
            )
            sub.status = 'CANCELED'
            sub.save()
            return Response({'message': 'Subscription will be canceled at the end of the billing period.'})
        except stripe.error.StripeError as e:
            return Response({'error': str(e.user_message)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class SubscriptionWebhookView(APIView):
    """Stripe webhook — updates subscription status on events."""
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('STRIPE_SIGNATURE', '')
        webhook_secret = getattr(settings, 'STRIPE_SUBSCRIPTION_WEBHOOK_SECRET', '')

        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                event = json.loads(payload.decode('utf-8'))
        except (stripe.error.SignatureVerificationError, Exception) as e:
            return Response({'error': str(e)}, status=400)

        event_type = event['type']
        data = event['data']['object']

        if event_type == 'checkout.session.completed':
            self._handle_checkout_complete(data)

        elif event_type in ('customer.subscription.updated', 'customer.subscription.created'):
            self._handle_subscription_update(data)

        elif event_type == 'customer.subscription.deleted':
            self._handle_subscription_deleted(data)

        elif event_type == 'invoice.payment_failed':
            self._handle_payment_failed(data)

        return Response(status=200)

    # ── Handlers ──────────────────────────────────────────────────────────────

    def _handle_checkout_complete(self, session):
        clinic_id = session.get('metadata', {}).get('clinic_id')
        plan = session.get('metadata', {}).get('plan')
        stripe_sub_id = session.get('subscription')

        if not (clinic_id and plan):
            return

        try:
            sub = Subscription.objects.get(clinic_id=int(clinic_id))
            sub.plan = plan
            sub.stripe_subscription_id = stripe_sub_id
            sub.status = 'TRIALING'
            sub.save()
        except Subscription.DoesNotExist:
            pass

    def _handle_subscription_update(self, stripe_sub):
        clinic_id = stripe_sub.get('metadata', {}).get('clinic_id')
        plan = stripe_sub.get('metadata', {}).get('plan')

        if not clinic_id:
            return

        STATUS_MAP = {
            'active':     'ACTIVE',
            'trialing':   'TRIALING',
            'past_due':   'PAST_DUE',
            'canceled':   'CANCELED',
            'incomplete': 'INACTIVE',
            'unpaid':     'PAST_DUE',
        }

        try:
            sub = Subscription.objects.get(clinic_id=int(clinic_id))
            if plan:
                sub.plan = plan
            sub.status = STATUS_MAP.get(stripe_sub.get('status', ''), 'ACTIVE')

            period_end = stripe_sub.get('current_period_end')
            if period_end:
                sub.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

            trial_end = stripe_sub.get('trial_end')
            if trial_end:
                sub.trial_end = datetime.fromtimestamp(trial_end, tz=timezone.utc)

            sub.save()
        except Subscription.DoesNotExist:
            pass

    def _handle_subscription_deleted(self, stripe_sub):
        try:
            sub = Subscription.objects.get(stripe_subscription_id=stripe_sub['id'])
            sub.status = 'CANCELED'
            sub.plan = 'STARTER'
            sub.save()
        except Subscription.DoesNotExist:
            pass

    def _handle_payment_failed(self, invoice):
        stripe_sub_id = invoice.get('subscription')
        if stripe_sub_id:
            try:
                sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
                sub.status = 'PAST_DUE'
                sub.save()
            except Subscription.DoesNotExist:
                pass
