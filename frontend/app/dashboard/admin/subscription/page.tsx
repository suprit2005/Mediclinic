"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { subscriptionService } from "@/services/subscriptions";
import {
  Zap, Building2, CheckCircle2, Clock, AlertTriangle, XCircle,
  ArrowUpRight, X, Shield, CreditCard, RefreshCw, Calendar,
} from "lucide-react";

type Subscription = {
  plan: string;
  plan_label: string;
  price: number;
  status: string;
  features: Record<string, any>;
  trial_end: string | null;
  current_period_end: string | null;
  days_remaining: number | null;
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  ACTIVE:    { label: "Active",    icon: CheckCircle2,   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  TRIALING:  { label: "Free Trial",icon: Clock,          bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  PAST_DUE:  { label: "Past Due",  icon: AlertTriangle,  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  CANCELED:  { label: "Canceled",  icon: XCircle,        bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     },
  INACTIVE:  { label: "Inactive",  icon: XCircle,        bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400"    },
};

const PLAN_ICON: Record<string, any> = {
  STARTER:      Zap,
  PROFESSIONAL: Zap,
  ENTERPRISE:   Building2,
};

const FEATURE_ROWS = [
  { key: "max_doctors",  label: "Doctor Accounts" },
  { key: "analytics",    label: "Advanced Analytics" },
  { key: "billing",      label: "Billing & Invoicing" },
  { key: "inventory",    label: "Inventory Management" },
  { key: "multi_clinic", label: "Multi-Clinic Support" },
];

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    subscriptionService.getCurrent()
      .then((res) => setSub(res.data))
      .catch(() => setError("Failed to load subscription details."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: "PROFESSIONAL" | "ENTERPRISE") => {
    setUpgrading(plan);
    setError("");
    try {
      const res = await subscriptionService.createCheckout(plan);
      window.location.href = res.data.url;
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to start checkout. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await subscriptionService.cancel();
      const res = await subscriptionService.getCurrent();
      setSub(res.data);
      setShowCancelConfirm(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to cancel subscription.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading subscription details...
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">{error || "No subscription found."}</p>
        <Link href="/subscribe" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
          View Plans <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.INACTIVE;
  const StatusIcon = statusCfg.icon;
  const PlanIcon = PLAN_ICON[sub.plan] ?? Zap;
  const isPaid = sub.plan !== "STARTER";
  const canUpgrade = sub.plan === "STARTER" || sub.plan === "PROFESSIONAL";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" /> Subscription & Billing
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan, billing period, and feature access.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <PlanIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold text-gray-900">{sub.plan_label}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {sub.price === 0 ? "Free forever" : `$${sub.price}/month`}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusCfg.bg}`}>
            <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            <span className={`text-sm font-bold ${statusCfg.text}`}>{statusCfg.label}</span>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 gap-5">
          {sub.days_remaining !== null && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {sub.status === "TRIALING" ? "Trial ends in" : "Next renewal in"}
                </p>
                <p className="font-bold text-gray-900">{sub.days_remaining} days</p>
              </div>
            </div>
          )}
          {sub.current_period_end && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <RefreshCw className="w-5 h-5 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Billing renews</p>
                <p className="font-bold text-gray-900">
                  {new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature access grid */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Feature Access</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURE_ROWS.map(({ key, label }) => {
              const val = sub.features?.[key];
              const enabled = val === true || (typeof val === "number" && val > 0) || val === null;
              return (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${
                  enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-400"
                }`}>
                  {enabled ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                  <span>{label}</span>
                  {key === "max_doctors" && val !== null && (
                    <span className="ml-auto text-xs font-bold">{val === null ? "Unlimited" : `Up to ${val}`}</span>
                  )}
                  {key === "max_doctors" && val === null && (
                    <span className="ml-auto text-xs font-bold">Unlimited</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {canUpgrade && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-2">
            {sub.plan === "STARTER" ? "Unlock the Full Platform" : "Go Enterprise"}
          </h3>
          <p className="text-blue-100 text-sm mb-6">
            {sub.plan === "STARTER"
              ? "Start your 14-day free trial of Professional — no credit card required during trial."
              : "Upgrade to Enterprise for unlimited doctors, multi-clinic support, and a dedicated account manager."}
          </p>
          <div className="flex flex-wrap gap-3">
            {sub.plan === "STARTER" && (
              <button
                onClick={() => handleUpgrade("PROFESSIONAL")}
                disabled={!!upgrading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {upgrading === "PROFESSIONAL" ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : <Zap className="w-4 h-4" />}
                Upgrade to Professional — $49/mo
              </button>
            )}
            <button
              onClick={() => handleUpgrade("ENTERPRISE")}
              disabled={!!upgrading}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold border border-white/30 transition-colors disabled:opacity-60"
            >
              {upgrading === "ENTERPRISE" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Building2 className="w-4 h-4" />}
              {sub.plan === "STARTER" ? "Enterprise — $199/mo" : "Upgrade to Enterprise — $199/mo"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Subscription */}
      {isPaid && sub.status !== "CANCELED" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Cancel Subscription</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your access continues until the end of the current billing period. You can re-subscribe anytime.
          </p>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Cancel Subscription?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              You'll retain access to all {sub.plan_label} features until{" "}
              {sub.current_period_end
                ? new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "long" })
                : "the end of your billing period"}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {canceling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
