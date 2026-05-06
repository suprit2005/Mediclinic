from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.accounts.permissions import IsClinicAdminOrReceptionist
from .services import get_clinic_dashboard_stats
from .services import get_doctor_workload
from .services import get_appointment_trend

class ClinicDashboardView(APIView):

    permission_classes = [IsAuthenticated, IsClinicAdminOrReceptionist]

    def get(self, request):

        clinic = request.user.clinic

        if clinic is None:
            return Response(
                {
                    "success": False,
                    "message": "User does not belong to a clinic."
                },
                status=400
            )

        stats = get_clinic_dashboard_stats(clinic)

        return Response(
            {
                "success": True,
                "data": stats
            }
        )
    

class DoctorWorkloadView(APIView):

    permission_classes = [IsAuthenticated, IsClinicAdminOrReceptionist]

    def get(self, request):

        clinic = request.user.clinic

        workload = get_doctor_workload(clinic)

        return Response({
            "success": True,
            "data": workload
        })



class AppointmentTrendView(APIView):

    permission_classes = [IsAuthenticated, IsClinicAdminOrReceptionist]

    def get(self, request):

        clinic = request.user.clinic

        data = get_appointment_trend(clinic)

        return Response({
            "success": True,
            "data": data
        })


class SuperAdminStatsView(APIView):
    """
    SUPER_ADMIN only — returns platform-wide metrics across all clinics.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "SUPER_ADMIN":
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        from apps.clinics.models import Clinic
        from apps.accounts.models import User
        from apps.appointments.models import Appointment
        from apps.billing.models import Invoice
        from django.db.models import Sum
        from django.utils import timezone

        today = timezone.now().date()

        total_clinics = Clinic.objects.count()
        active_clinics = Clinic.objects.filter(is_active=True).count()
        total_users = User.objects.count()
        total_appointments = Appointment.objects.count()
        appointments_today = Appointment.objects.filter(appointment_date=today).count()
        total_revenue = Invoice.objects.filter(
            status="PAID"
        ).aggregate(total=Sum("total_amount"))["total"] or 0

        # Per-clinic breakdown
        clinic_breakdown = []
        for clinic in Clinic.objects.filter(is_active=True).order_by("name"):
            clinic_breakdown.append({
                "id": clinic.id,
                "name": clinic.name,
                "plan": clinic.subscription_plan,
                "is_active": clinic.is_active,
                "total_appointments": Appointment.objects.filter(clinic=clinic).count(),
                "appointments_today": Appointment.objects.filter(clinic=clinic, appointment_date=today).count(),
                "total_doctors": clinic.doctor_associations.filter(is_active=True).count(),
                "total_patients": clinic.appointments.values("patient").distinct().count(),
            })

        return Response({
            "success": True,
            "data": {
                "total_clinics": total_clinics,
                "active_clinics": active_clinics,
                "total_users": total_users,
                "total_appointments": total_appointments,
                "appointments_today": appointments_today,
                "total_revenue_paid": float(total_revenue),
                "clinic_breakdown": clinic_breakdown,
            }
        })