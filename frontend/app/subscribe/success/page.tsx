"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, LayoutDashboard } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-lg w-full text-center">
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -inset-2 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">You're all set! 🎉</h1>
        <p className="text-gray-500 text-lg mb-2">
          Your 14-day free trial has started.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          You now have full access to your plan features. No charges until after your trial ends.
        </p>

        {sessionId && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 font-mono mb-8 break-all">
            Session: {sessionId}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/admin/subscription"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm"
          >
            Manage Subscription
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SuccessContent />
    </Suspense>
  );
}
