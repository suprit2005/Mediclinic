from celery import shared_task
from .utils import send_appointment_email, send_twilio_sms

@shared_task
def send_email_task(to_email, subject, message):
    return send_appointment_email(to_email, subject, message)

@shared_task
def send_sms_task(to_phone, message):
    return send_twilio_sms(to_phone, message)
