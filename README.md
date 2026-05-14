<div align="center">

<img src="https://img.shields.io/badge/MediClinic-Healthcare%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white" alt="MediClinic" />

# MediClinic — Multi-Clinic Healthcare Platform

**A full-stack, role-based healthcare management system for modern clinics.**  
From appointment booking to billing, prescriptions to inventory — all in one platform.

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Environment Variables](#-environment-variables) · [API Reference](#-api-reference) · [Roles & Permissions](#-roles--permissions) · [Subscription Plans](#-subscription-plans)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Roles & Permissions](#-roles--permissions)
- [Subscription Plans](#-subscription-plans)
- [Key Design Decisions](#-key-design-decisions)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

MediClinic is a **production-grade, multi-tenant healthcare management platform** built to digitize the complete operational workflow of a clinic — from the moment a patient books an appointment to post-consultation billing and prescription management.

It is designed around **five distinct user roles**, each with their own dashboard and permissions, making it suitable for solo practitioners all the way up to large multi-specialty hospital networks.

> **Problem it solves:** Most clinics still rely on paper registers, manual phone bookings, and disconnected spreadsheets. MediClinic replaces all of that with a single, unified, real-time platform.

---

## ✨ Features

### For Patients
- 🗓️ Self-service appointment booking with real-time slot availability
- 📋 Pre-visit digital intake form (symptoms, allergies, medications)
- 🩺 View medical records and doctor notes after consultation
- 💊 Access digital prescriptions
- 💳 View and pay invoices online via Stripe
- 🔔 Appointment confirmation and reminder notifications

### For Doctors
- 📅 View daily appointment schedule
- 📝 Write structured medical records (symptoms, diagnosis, vitals, notes)
- 💊 Create prescriptions with reusable prescription templates
- 📊 Private notes per patient (not visible to patients)
- 🏥 Works across multiple clinic associations from a single account

### For Receptionists
- 👤 Register walk-in patients on the spot
- 📆 Book appointments on behalf of patients
- 🔢 Manage live patient queue with token system
- 📋 Review patient intake forms before consultation

### For Clinic Admins
- 👨‍⚕️ Invite and manage doctors via email (UUID invite tokens)
- 📦 Inventory management with low-stock restock alerts
- 🧾 Full billing and invoice management
- 📈 Analytics dashboard (appointments, revenue, patient trends)
- 🔐 Audit log — complete history of every action taken in the clinic
- 💳 Manage subscription plan via Stripe

### For Super Admins
- 🌐 Platform-wide visibility across all clinics
- 🛠️ Django admin panel for system configuration
- 📊 Cross-clinic analytics and monitoring

### Platform-Wide
- 🖥️ **Live Queue Display** — public screen (TV-ready) showing current serving token
- 🔒 **JWT Authentication** — secure, stateless auth with token rotation
- 📧 **Email Notifications** — async via Celery + Gmail SMTP
- 🔄 **Stripe Webhook Integration** — reliable subscription lifecycle management

---

## 🛠 Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Django 6.0 + Django REST Framework | REST API, ORM, Admin |
| Database | PostgreSQL 15 | Primary datastore |
| Auth | `djangorestframework-simplejwt` | JWT (30-min access / 7-day refresh) |
| Async Tasks | Celery + Redis | Non-blocking emails & background jobs |
| Payments | Stripe | Checkout Sessions, Webhooks, PaymentIntents |
| Email | SMTP via Gmail | Transactional emails |
| Media | Local filesystem (`/media/`) | Doctor profile photos |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + CSR hybrid rendering |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| HTTP Client | Axios | API calls with JWT interceptor |
| State | React Context API | Auth state, user info |
| Icons | Lucide React | Consistent iconography |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser / Client                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│              Next.js Frontend  (localhost:3000)               │
│  ┌───────────────────────┐   ┌──────────────────────────┐   │
│  │  SSR — Public Pages   │   │  CSR — Dashboard Pages   │   │
│  │  (Landing, Specialties│   │  (Role-based dashboards) │   │
│  │   Queue Display)      │   │                          │   │
│  └───────────────────────┘   └────────────┬─────────────┘   │
│                                           │  Axios + Bearer   │
└───────────────────────────────────────────┼──────────────────┘
                                            │
┌───────────────────────────────────────────▼──────────────────┐
│              Django REST API  (localhost:8000)                │
│   JWT Middleware → Role Permission Check → Business Logic    │
│                                                               │
│   apps/  accounts  · clinics  · doctors   · patients        │
│          appointments · records · billing · inventory        │
│          notifications · subscriptions · analytics · audit   │
└──────┬───────────────┬──────────────────┬────────────────────┘
       │               │                  │
  ┌────▼─────┐   ┌─────▼──────┐   ┌──────▼─────┐
  │PostgreSQL│   │   Redis    │   │   Stripe   │
  │          │   │  (Celery   │   │    API     │
  │ (DB)     │   │   Broker)  │   │            │
  └──────────┘   └─────┬──────┘   └──────┬─────┘
                       │                  │
                 ┌─────▼──────┐    ┌──────▼─────┐
                 │ Gmail SMTP │    │  Webhooks  │
                 │  (Emails)  │    │  → Django  │
                 └────────────┘    └────────────┘
```

### Appointment Lifecycle

```
SCHEDULED → CONFIRMED → WAITING → IN_PROGRESS → COMPLETED
    │                                                 │
    └──────────────► CANCELLED ◄─────────────────────┘
    └──────────────► NO_SHOW
```

---

## 📁 Project Structure

```
mediclinic-system/
├── backend/                        # Django project root
│   ├── config/
│   │   ├── settings.py             # All configuration (env-driven)
│   │   ├── urls.py                 # Root URL router
│   │   ├── celery.py               # Celery app + task discovery
│   │   └── exceptions.py          # Custom DRF exception handler
│   ├── apps/
│   │   ├── accounts/               # Custom User model, JWT, invites
│   │   ├── clinics/                # Clinic model + Stripe fields
│   │   ├── doctors/                # Doctor, DoctorClinic, Schedule, Leaves, Reviews
│   │   ├── patients/               # Patient profile, IntakeForm
│   │   ├── appointments/           # Appointment + overlap exclusion constraint
│   │   ├── records/                # MedicalRecord, Prescription, Templates
│   │   ├── billing/                # Invoice, InvoiceItem, PaymentTransaction
│   │   ├── inventory/              # InventoryItem, StockTransaction
│   │   ├── subscriptions/          # Subscription, Stripe checkout, Webhooks
│   │   ├── notifications/          # Notification model + Django signals
│   │   ├── analytics/              # Aggregated read-only stats views
│   │   ├── audit/                  # AuditLog — full action history
│   │   └── core/                   # Shared utilities
│   └── manage.py
│
└── frontend/                       # Next.js project root
    ├── app/
    │   ├── page.tsx                 # Public landing page (SSR)
    │   ├── login/                   # JWT login
    │   ├── register/                # Patient registration
    │   ├── invite/                  # Doctor invite acceptance
    │   ├── subscribe/               # Plan selection + Stripe redirect
    │   ├── queue-display/           # Public queue TV screen
    │   ├── specialties/[specialty]/ # Public doctor listing
    │   └── dashboard/
    │       ├── layout.tsx           # Auth guard + sidebar
    │       ├── admin/               # Clinic Admin dashboard
    │       ├── doctor/              # Doctor dashboard
    │       ├── receptionist/        # Receptionist dashboard
    │       ├── (patient)/           # Patient-specific pages
    │       └── super-admin/         # Platform-wide admin
    ├── components/                  # Reusable UI components
    ├── services/                    # Axios API call layer
    ├── context/                     # React Context (Auth, User)
    └── hooks/                       # Custom React hooks
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** (for Celery — optional in development, runs eagerly via `CELERY_TASK_ALWAYS_EAGER=True`)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/anmolbajpai58/Mediclinic.git
cd Mediclinic
```

---

### 2. Backend Setup (Django)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (see section below)
cp .env.example .env
# Edit .env with your values

# Run database migrations
python manage.py migrate

# (Optional) Create a superuser for the Django admin panel
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

> The Django API will be available at **http://127.0.0.1:8000/**  
> Django Admin panel at **http://127.0.0.1:8000/admin/**

---

### 3. Frontend Setup (Next.js)

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Start the development server
npm run dev
```

> The frontend will be available at **http://localhost:3000/**

---

### 4. (Optional) Start Celery Worker

Required for **real email delivery** in production. In development, tasks run synchronously.

```bash
# From the backend directory, with venv activated
celery -A config worker --loglevel=info
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=mediclinic_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Email (SMTP)
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL (used in invite emails)
FRONTEND_URL=http://localhost:3000

# Celery / Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=whsec_...
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📡 API Reference

All endpoints are prefixed with `http://localhost:8000/api/`.  
Authentication uses **Bearer JWT tokens** in the `Authorization` header.

| Prefix | Description |
|---|---|
| `POST /api/token/` | Obtain JWT access + refresh tokens |
| `POST /api/token/refresh/` | Refresh an expired access token |
| `api/accounts/` | Register, profile, password reset, invite accept |
| `api/doctors/` | Doctor CRUD, schedules, leaves, invitations, reviews |
| `api/appointments/` | Book, list, update status, queue management |
| `api/patients/` | Patient profile, intake forms, appointment history |
| `api/records/` | Medical records, prescriptions, prescription templates |
| `api/billing/` | Invoices, invoice items, payment transactions |
| `api/inventory/` | Inventory items, stock transactions, alerts |
| `api/analytics/` | Aggregated stats (appointments, revenue, occupancy) |
| `api/notifications/` | List notifications, mark as read |
| `api/clinics/` | Clinic CRUD |
| `api/subscriptions/` | Checkout session, webhook handler, plan status |
| `api/public/specialties/` | Unauthenticated — for landing page |
| `api/public/doctors/` | Unauthenticated — for landing page |

---

## 👥 Roles & Permissions

The platform uses a **role-based access control (RBAC)** system enforced at the API level via custom DRF permission classes.

| Role | Scope | Key Capabilities |
|---|---|---|
| `SUPER_ADMIN` | All clinics | Full platform access, Django admin |
| `CLINIC_ADMIN` | Own clinic | Manage doctors, staff, billing, inventory, subscription |
| `DOCTOR` | Own clinic | Appointments, medical records, prescriptions, schedules |
| `RECEPTIONIST` | Own clinic | Book appointments, patient queue, intake forms |
| `PATIENT` | Own data | Book appointments, view records, pay invoices |

> **Note:** Staff roles (`CLINIC_ADMIN`, `DOCTOR`, `RECEPTIONIST`) must be associated with a clinic. Patients register globally without a clinic association.

---

## 💳 Subscription Plans

MediClinic uses a **SaaS subscription model** powered by Stripe. Feature access is gated at the API level based on the clinic's active plan.

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| **Price** | $0 / month | $49 / month | $199 / month |
| **Doctors** | 1 | Up to 10 | Unlimited |
| **Appointments** | 50 / month | Unlimited | Unlimited |
| **Medical Records & EHR** | ✅ | ✅ | ✅ |
| **Analytics Dashboard** | ❌ | ✅ | ✅ |
| **Billing & Invoicing** | ❌ | ✅ | ✅ |
| **Inventory Management** | ❌ | ✅ | ✅ |
| **Multi-Clinic Support** | ❌ | ❌ | ✅ |
| **White-Label Branding** | ❌ | ❌ | ✅ |
| **Support** | Community | Priority | 24/7 SLA |
| **Free Trial** | — | 14 days | 14 days |

---

## 🧠 Key Design Decisions

### 1. Database-Level Overlap Prevention
Appointment double-booking is prevented using a **PostgreSQL `ExclusionConstraint`** on a `DateTimeRangeField`. This means it is physically impossible — not just application-level impossible — to create two overlapping appointments for the same doctor.

### 2. Doctor–Clinic Bridge Table (`DoctorClinic`)
A doctor can work at multiple clinics. The `DoctorClinic` join table stores clinic-specific data (consultation fee, schedule, leaves) separately — avoiding duplication and enabling true multi-clinic doctor accounts.

### 3. Custom User Model
Django's `AUTH_USER_MODEL` is overridden with a custom `User` model extending `AbstractBaseUser`. This adds `role` and `clinic` fields directly to the user, enabling clean JWT claims and permission checks without extra DB joins.

### 4. Subscription as a First-Class Model
The `Subscription` model is separate from `Clinic` (1-to-1 relationship). It stores all Stripe IDs, trial dates, and billing period data cleanly — making it easy to handle webhooks idempotently.

### 5. Celery for Non-Blocking Emails
All email delivery (appointment confirmations, invites, password resets) runs through **Celery tasks**. In development, `CELERY_TASK_ALWAYS_EAGER=True` runs tasks synchronously so no Redis is needed — just flip to `False` in production.

### 6. Audit Logging
Every significant action (create, update, delete, login, logout, book, cancel) is recorded in the `AuditLog` table with user, clinic, action type, object reference, IP address, and timestamp — providing full traceability.

---

## 🔭 Future Enhancements

- [ ] 📱 **React Native Mobile App** — patient-facing booking and records on iOS/Android
- [ ] 🎥 **Telemedicine / Video Calls** — WebRTC-based in-app video consultations
- [ ] 📲 **SMS Notifications** — appointment reminders via Twilio
- [ ] 🤖 **AI Symptom Checker** — pre-booking chatbot to guide patients
- [ ] 📄 **PDF Generation** — downloadable prescriptions and invoices
- [ ] 🗺️ **Clinic Map View** — find nearest clinic via Google Maps integration
- [ ] 🌐 **Multi-language Support** — localization for regional languages
- [ ] 🔗 **FHIR API** — HL7 FHIR compliance for hospital system interoperability
- [ ] 🧠 **Predictive Analytics** — no-show prediction and demand forecasting
- [ ] 🏥 **Insurance Integration** — direct claim submission and tracking

---

## 🤝 Contributing

This is an open project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit with clear messages: `git commit -m "feat: add prescription PDF export"`
4. Open a pull request against `main` with a detailed description

---

## 📄 License

This project is licensed under the MIT License.

© 2025 Anmol Bajpai. All rights reserved.

---

<div align="center">

Made with ❤️ for better healthcare by [Anmol Bajpai](https://github.com/anmolbajpai58)

**[⬆ Back to top](#mediclinic--multi-clinic-healthcare-platform)**

</div>
