from django.urls import path
from .views import CreateReceptionistView, ReceptionistListView, ClinicRegistrationView

urlpatterns = [
    path('receptionists/', ReceptionistListView.as_view(), name='receptionist-list'),
    path('receptionists/create/', CreateReceptionistView.as_view(), name='receptionist-create'),
    path('register/', ClinicRegistrationView.as_view(), name='clinic-register'),
]
