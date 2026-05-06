"use client";

import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import apiClient from "@/services/api";
import {
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface ClinicRow {
  id: number;
  name: string;
  plan: string;
  is_active: boolean;
  total_appointments: number;
  appointments_today: number;
  total_doctors: number;
  total_patients: number;
}

interface SuperAdminData {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  total_appointments: number;
  appointments_today: number;
  total_revenue_paid: number;
  clinic_breakdown: ClinicRow[];
}

const PLAN_BADGE: Record<string, string> = {
  BASIC: "bg-slate-100 text-slate-600",
  PRO: "bg-blue-100 text-blue-700",
  ENTERPRISE: "bg-violet-100 text-violet-700",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [data, setData] = useState<SuperAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get("/analytics/super-admin/");
      setData(res.data.data);
    } catch {
      setError("Failed to load platform stats.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{error || "No data available."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Super Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">System-wide metrics across all registered clinics.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition"
        >
          <Activity className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          label="Total Clinics"
          value={data.total_clinics}
          icon={Building2}
          color="bg-violet-50 text-violet-600"
          sub={`${data.active_clinics} active`}
        />
        <StatCard
          label="Total Users"
          value={data.total_users}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          sub="Across all roles"
        />
        <StatCard
          label="Total Appointments"
          value={data.total_appointments}
          icon={CalendarCheck}
          color="bg-emerald-50 text-emerald-600"
          sub={`${data.appointments_today} today`}
        />
        <StatCard
          label="Today's Activity"
          value={data.appointments_today}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
          sub="Appointments booked today"
        />
        <StatCard
          label="Revenue Collected"
          value={`₹${data.total_revenue_paid.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-50 text-green-600"
          sub="Paid invoices only"
        />
        <StatCard
          label="Active Clinics"
          value={data.active_clinics}
          icon={BarChart3}
          color="bg-indigo-50 text-indigo-600"
          sub={`${data.total_clinics - data.active_clinics} inactive`}
        />
      </div>

      {/* Clinic Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">All Clinics</h2>
          <span className="text-xs text-gray-400 font-medium">{data.clinic_breakdown.length} clinics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Clinic Name</th>
                <th className="px-6 py-3 text-left font-semibold">Plan</th>
                <th className="px-6 py-3 text-right font-semibold">Doctors</th>
                <th className="px-6 py-3 text-right font-semibold">Patients</th>
                <th className="px-6 py-3 text-right font-semibold">All-time Appts</th>
                <th className="px-6 py-3 text-right font-semibold">Today</th>
                <th className="px-6 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.clinic_breakdown.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{clinic.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_BADGE[clinic.plan] || "bg-gray-100 text-gray-600"}`}>
                      {clinic.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 font-medium">{clinic.total_doctors}</td>
                  <td className="px-6 py-4 text-right text-gray-700 font-medium">{clinic.total_patients}</td>
                  <td className="px-6 py-4 text-right text-gray-700 font-medium">{clinic.total_appointments}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${clinic.appointments_today > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {clinic.appointments_today}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {clinic.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {data.clinic_breakdown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No clinics registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
