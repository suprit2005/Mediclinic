# MediClinic — Production-Grade Healthcare SaaS Platform

**A full-stack, role-based healthcare management and multi-clinic operations platform.**  
MediClinic is designed to modernise healthcare clinic operations by integrating patient self-scheduling, pre-consultation intake forms, structured Electronic Health Records (EHR) entry, prescription template management, medical billing, live token-based queue boards, inventory tracking, and Stripe-powered subscription plan billing into a single, high-availability SaaS platform.

---

## 🛠 Tech Stack

<div align="center">

![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

---

## 🏗 Containerised Architecture

The system is fully containerised using **Docker** and orchestrated via **Docker Compose** across 5 distinct services:

```
                  ┌──────────────────────────────┐
                  │       Browser / Client       │
                  └──────────────┬───────────────┘
                                 │ HTTP (Port 3000 / 8000)
┌────────────────────────────────┼────────────────────────────────┐
│ Docker Compose Network         │                                │
│                                ▼                                │
│                   ┌──────────────────────────┐                  │
│                   │    frontend (Next.js)    │                  │
│                   └────────────┬─────────────┘                  │
│                                │ axios requests                 │
│                                ▼                                │
│                   ┌──────────────────────────┐                  │
│                   │     backend (Django)     │                  │
│                   └─────────┬──────────┬─────┘                  │
│                             │          │                        │
│             ┌───────────────┘          └────────────────┐       │
│             ▼                                           ▼       │
│      ┌──────────────┐                            ┌────────────┐ │
│      │ db (Postgres)│                            │    redis   │ │
│      └──────────────┘                            └─────┬──────┘ │
│                                                        │        │
│                                                        ▼        │
│                                                  ┌────────────┐ │
│                                                  │celery_work.│ │
│                                                  └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

1. **`db`** (PostgreSQL 15-alpine): The primary relational database storing accounts, schedules, clinical records, billing, inventory, and audit logs. Uses PostgreSQL exclusion constraints on time ranges for double-booking prevention.
2. **`redis`** (Redis 7-alpine): Serves as the asynchronous task queue broker for Celery and the backend caching layer.
3. **`backend`** (Django 6.0 REST API): Main API service executing Python business logic, endpoints, database migrations, and administrative tools.
4. **`celery_worker`** (Celery Broker client): Handles asynchronous worker threads (concurrency=2) for background processing, such as sending patient registration confirmations and email doctor invites.
5. **`frontend`** (Next.js 16 App Router): Node.js container compiling and rendering the user dashboard, portal interfaces, and landing page.

---

## 🚀 Quick Start

To set up and run the entire project locally using Docker, execute the following steps:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Mediclinic.git
cd Mediclinic
```

### 2. Configure Environment Variables
Copy the templates to their local configuration locations:
```bash
# Backend configurations
cp backend/.env.example backend/.env

# Frontend configurations
cp frontend/.env.example frontend/.env.local
```
*(Open the generated `backend/.env` and `frontend/.env.local` files to populate them with your real database passwords and Stripe integration API keys)*

### 3. Build and Run Containers
Compile and launch all 5 microservices in detached mode:
```bash
docker compose up --build -d
```
Docker Compose will automatically await the database and Redis health checks before performing Django database migrations and booting up development environments.

*   **Frontend Client**: [http://localhost:3000](http://localhost:3000)
*   **Backend REST API**: [http://localhost:8000](http://localhost:8000)
*   **Django Admin Console**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 👥 Roles & Permissions

The platform uses a role-based access control (RBAC) authorization schema:
*   **`SUPER_ADMIN`**: Full administrative panel configuration and monitoring of all clinic tenants.
*   **`CLINIC_ADMIN`**: Invites clinic staff/doctors, oversees invoices, configures billing, tracks stock inventory, and maintains subscription checkout states.
*   **`DOCTOR`**: Manages shifts, updates leaves, reviews appointments, records patient visits, and configures templates for prescriptions.
*   **`RECEPTIONIST`**: Bookings walk-in patients, manages daily schedules, and handles the live queue board.
*   **`PATIENT`**: Views medical notes/records, completes pre-visit intake forms, books doctor time slots, and settles invoices via Stripe.

---

## ✨ Features

*   🗓️ **Double-Booking Protection**: Powered by PostgreSQL database-level `ExclusionConstraints` on `DateTimeRangeField` columns to ensure time-slots cannot overlap.
*   📈 **Real-Time Queue Board**: TV-optimised queue dashboard showing currently serving token numbers.
*   💳 **SaaS Subscription Engine**: Stripe Checkout integration gating access to Starter, Professional, and Enterprise plans based on clinic counts.
*   🔒 **Stateless JWT Authorization**: Auto-rotates JWT access tokens with blacklist mechanics to secure API pathways.
*   📦 **Inventory Restock Alerting**: Automatic monitoring of clinical materials with warnings when quantities drop below minimum levels.
*   📝 **HIPAA Auditing**: Tracks and logs all critical operations with user context, IP addresses, and database changes in the `AuditLog` table.

---

## 🐳 DevOps & CI/CD Pipeline

MediClinic leverages a automated CI/CD pipeline built with **GitHub Actions**:

*   **Continuous Integration**: Triggered on pushes to `main` and `develop` branches and pull requests to `main`. It spins up local Postgres and Redis services inside the runner, installs requirements, executes Django checks, and applies migrations.
*   **Docker Integration Tests**: Builds backend and frontend images on the runner, boots the services via Docker Compose, and verifies connection responses on port `8000`.
*   **Continuous Deployment**: On pushes to `main`, successfully compiled images are built and pushed to **Docker Hub** with `latest` and commit SHA tags.

---

## 🔑 Environment Variables Reference

### Backend Configuration (`backend/.env`)
*   `SECRET_KEY`: Django cryptographic signing key.
*   `DEBUG`: Enables verbose trace logs (`True` in dev, `False` in production).
*   `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT`: Postgres connection parameters.
*   `REDIS_URL` / `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND`: Redis server endpoints.
*   `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`: Stripe payment details.
*   `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD`: SMTP server credentials for invites and alerts.

### Frontend Configuration (`frontend/.env.local`)
*   `NEXT_PUBLIC_API_URL`: Root path to the API backend server.
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Client-facing publishable Stripe key.
