from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from apps.appointments.models import Appointment
from .models import Notification
from django.contrib.auth import get_user_model

# Track previous status to detect transitions
_appointment_status_cache = {}

@receiver(pre_save, sender=Appointment)
def cache_appointment_previous_status(sender, instance, **kwargs):
    """Store previous status before save so we can detect COMPLETED transitions."""
    if instance.pk:
        try:
            _appointment_status_cache[instance.pk] = Appointment.objects.get(pk=instance.pk).status
        except Appointment.DoesNotExist:
            pass

@receiver(post_save, sender=Appointment)
def auto_create_invoice_on_completion(sender, instance, created, **kwargs):
    """
    Automatically generate an Invoice when an appointment transitions to COMPLETED.
    Skips if an invoice for this appointment already exists.
    """
    if created:
        return

    previous_status = _appointment_status_cache.pop(instance.pk, None)
    if previous_status == instance.status:
        return  # No status change, skip

    if instance.status == Appointment.StatusChoices.COMPLETED and previous_status != Appointment.StatusChoices.COMPLETED:
        from apps.billing.models import Invoice, InvoiceItem
        from django.db import transaction

        # Only create if one doesn't already exist for this appointment
        if not Invoice.objects.filter(appointment=instance).exists():
            with transaction.atomic():
                # Get the consultation fee from the doctor's clinic link
                consultation_fee = getattr(instance.doctor_clinic, 'consultation_fee', 500)

                invoice = Invoice.objects.create(
                    patient=instance.patient,
                    appointment=instance,
                    total_amount=consultation_fee,
                    status=Invoice.StatusChoices.PENDING,
                )

                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f"Consultation — Dr. {instance.doctor_clinic.doctor.user.get_full_name()}",
                    amount=consultation_fee,
                )



@receiver(post_save, sender=Appointment)
def create_appointment_notification(sender, instance, created, **kwargs):
    User = get_user_model()
    
    # Pre-fetch clinic staff for shared notifications
    clinic_staff = []
    if getattr(instance, 'clinic', None):
        clinic_staff = User.objects.filter(
            clinic=instance.clinic,
            role__in=[User.RoleChoices.CLINIC_ADMIN, User.RoleChoices.RECEPTIONIST]
        )

    if created:
        # 1. Notify the doctor
        if instance.doctor_clinic and instance.doctor_clinic.doctor and instance.doctor_clinic.doctor.user:
            Notification.objects.create(
                recipient=instance.doctor_clinic.doctor.user,
                notification_type='APPOINTMENT',
                title='New Appointment Booked',
                message=f'A new appointment has been scheduled for {instance.appointment_date} at {instance.start_time.strftime("%I:%M %p")}.',
                related_link='/dashboard/doctor/schedule'
            )
        
        # 2. Notify the patient
        if instance.patient and getattr(instance.patient, 'user', None):
            msg = f'Your appointment is confirmed for {instance.appointment_date} at {instance.start_time.strftime("%I:%M %p")}.'
            Notification.objects.create(
                recipient=instance.patient.user,
                notification_type='APPOINTMENT',
                title='Appointment Confirmed',
                message=msg,
                related_link='/dashboard/history'
            )
            
            # Real Omnichannel
            from .tasks import send_email_task, send_sms_task
            send_email_task.delay(
                instance.patient.user.email, 
                "MediClinic: Appointment Confirmed", 
                msg
            )
            if instance.patient.phone:
                send_sms_task.delay(instance.patient.phone, msg)
        
        # 3. Notify clinic staff (Admins and Receptionists)
        doctor_name = "Unknown"
        if instance.doctor_clinic and instance.doctor_clinic.doctor and instance.doctor_clinic.doctor.user:
            doctor_name = instance.doctor_clinic.doctor.user.get_full_name() or instance.doctor_clinic.doctor.user.email

        for staff in clinic_staff:
            link = '/dashboard/admin/schedules' if staff.role == User.RoleChoices.CLINIC_ADMIN else '/dashboard/receptionist/patients'
            Notification.objects.create(
                recipient=staff,
                notification_type='APPOINTMENT',
                title='New Appointment Booked',
                message=f'A new appointment was booked for Dr. {doctor_name} on {instance.appointment_date} at {instance.start_time.strftime("%I:%M %p")}.',
                related_link=link
            )

    else:
        # Status change notification
        if getattr(instance, 'status', None) == Appointment.StatusChoices.CANCELLED:
            # Notify Patient
            if instance.patient and getattr(instance.patient, 'user', None):
                Notification.objects.create(
                    recipient=instance.patient.user,
                    notification_type='APPOINTMENT',
                    title='Appointment Cancelled',
                    message=f'Your appointment on {instance.appointment_date} has been cancelled.',
                    related_link='/dashboard/history'
                )
            
            # Notify Doctor
            doctor_name = "Unknown"
            if instance.doctor_clinic and instance.doctor_clinic.doctor and instance.doctor_clinic.doctor.user:
                doctor_name = instance.doctor_clinic.doctor.user.get_full_name() or instance.doctor_clinic.doctor.user.email
                Notification.objects.create(
                    recipient=instance.doctor_clinic.doctor.user,
                    notification_type='APPOINTMENT',
                    title='Appointment Cancelled',
                    message=f'An appointment on {instance.appointment_date} has been cancelled.',
                    related_link='/dashboard/doctor/schedule'
                )
            
            # Notify Clinic Staff
            for staff in clinic_staff:
                link = '/dashboard/admin/schedules' if staff.role == User.RoleChoices.CLINIC_ADMIN else '/dashboard/receptionist/patients'
                Notification.objects.create(
                    recipient=staff,
                    notification_type='APPOINTMENT',
                    title='Appointment Cancelled',
                    message=f'An appointment for Dr. {doctor_name} on {instance.appointment_date} was cancelled.',
                    related_link=link
                )

                # Send real SMS/Email to patient on cancellation
                if instance.patient and getattr(instance.patient, 'user', None):
                    from .tasks import send_email_task, send_sms_task
                    msg = f"Your appointment on {instance.appointment_date} has been cancelled."
                    send_email_task.delay(instance.patient.user.email, "Appointment Cancelled", msg)
                    if instance.patient.phone:
                        send_sms_task.delay(instance.patient.phone, msg)

