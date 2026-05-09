"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function SubscribeCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-lg w-full text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-12 h-12 text-gray-400" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Cancelled</h1>
        <p className="text-gray-500 text-lg mb-8">
          No charges were made. You can try again anytime — your free trial is still available.
        </p>

        <div className="space-y-3">
          <Link
            href="/subscribe"
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
