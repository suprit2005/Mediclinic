from rest_framework import serializers
from .models import Invoice, PaymentTransaction, InvoiceItem


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    transactions = PaymentTransactionSerializer(many=True, read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()
    appointment_date = serializers.SerializerMethodField()
    appointment_doctor = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'patient', 'patient_name', 'patient_email',
            'appointment', 'appointment_date', 'appointment_doctor',
            'total_amount', 'amount_paid', 'status',
            'stripe_payment_intent_id', 'issued_date', 'due_date',
            'created_at', 'updated_at', 'items', 'transactions',
        ]

    def get_patient_name(self, obj):
        user = obj.patient.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.email

    def get_patient_email(self, obj):
        return obj.patient.user.email

    def get_appointment_date(self, obj):
        if obj.appointment:
            return str(obj.appointment.scheduled_date)
        return None

    def get_appointment_doctor(self, obj):
        if obj.appointment and hasattr(obj.appointment, 'doctor') and obj.appointment.doctor:
            doc_user = obj.appointment.doctor.user
            name = f"{doc_user.first_name} {doc_user.last_name}".strip()
            return name if name else doc_user.email
        return None

    def create(self, validated_data):
        items_data = self.initial_data.get('items', [])
        invoice = Invoice.objects.create(**validated_data)

        total = 0
        for item in items_data:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item.get('description'),
                amount=item.get('amount')
            )
            total += float(item.get('amount', 0))

        if not invoice.total_amount or float(invoice.total_amount) == 0:
            invoice.total_amount = total
            invoice.save()

        return invoice
