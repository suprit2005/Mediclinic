"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/billing/CheckoutForm';
import api from '@/services/api';
import {
  Receipt, CreditCard, CheckCircle2, Clock, ChevronRight,
  X, FileText, Calendar, Stethoscope, ArrowLeft, Shield,
  TrendingUp, DollarSign,
} from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx'
);

type InvoiceItem = { id: number; description: string; amount: string };
type Invoice = {
  id: number;
  patient_name: string;
  patient_email: string;
  appointment_date: string | null;
  appointment_doctor: string | null;
  total_amount: string;
  amount_paid: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  issued_date: string;
  due_date: string | null;
  items: InvoiceItem[];
};

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  PAID:    { label: 'Paid',    bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-500' },
  PENDING: { label: 'Pending', bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock,         dot: 'bg-amber-500'   },
  FAILED:  { label: 'Failed',  bg: 'bg-red-100',     text: 'text-red-700',     icon: X,             dot: 'bg-red-500'     },
};

export default function BillingPage() {
  const [invoices, setInvoices]         = useState<Invoice[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedInvoice, setSelected]  = useState<Invoice | null>(null);
  const [paying, setPaying]             = useState<Invoice | null>(null);
  const [clientSecret, setSecret]       = useState<string | null>(null);
  const [paySuccess, setPaySuccess]     = useState(false);
  const [payError, setPayError]         = useState('');
  const [initializingPay, setInitPay]   = useState(false);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices/');
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoice: Invoice) => {
    setPaying(invoice);
    setSecret(null);
    setPayError('');
    setInitPay(true);
    try {
      const res = await api.post(`/billing/invoices/${invoice.id}/create-payment-intent/`);
      setSecret(res.data.clientSecret);
    } catch {
      setPayError('Failed to initialize payment. Please try again.');
    } finally {
      setInitPay(false);
    }
  };

  const handlePaySuccess = () => {
    setPaySuccess(true);
    setPaying(null);
    setSecret(null);
    setTimeout(() => {
      setPaySuccess(false);
      fetchInvoices();
    }, 3000);
  };

  // KPI stats
  const totalBilled      = invoices.reduce((s, i) => s + parseFloat(i.total_amount), 0);
  const totalPaid        = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + parseFloat(i.total_amount), 0);
  const totalOutstanding = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + parseFloat(i.total_amount), 0);
  const paidCount        = invoices.filter(i => i.status === 'PAID').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading billing data...
        </div>
      </div>
    );
  }

  // ── Payment Success Screen ────────────────────────────────────────────────
  if (paySuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -inset-2 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500">Your invoice has been marked as paid. A receipt has been sent to your email.</p>
        </div>
      </div>
    );
  }

  // ── Payment Checkout Screen ───────────────────────────────────────────────
  if (paying) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <button
          onClick={() => { setPaying(null); setSecret(null); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to invoices
        </button>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Invoice</p>
              <h2 className="text-xl font-bold text-gray-900">INV-{paying.id.toString().padStart(4, '0')}</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
              {paying.status}
            </span>
          </div>
          <div className="border-t border-gray-50 pt-4 space-y-2">
            {paying.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-semibold text-gray-900">${parseFloat(item.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Due</span>
            <span className="text-2xl font-bold text-blue-600">${parseFloat(paying.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6 justify-center">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Secured by Stripe — 256-bit SSL encryption
        </div>

        {/* Stripe Checkout */}
        {payError && (
          <div className="mb-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm font-medium border border-red-100">
            {payError}
          </div>
        )}

        {initializingPay ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Initializing secure payment...
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaySuccess} />
          </Elements>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Receipt className="w-6 h-6 text-blue-600" /> Billing & Payments
        </h1>
        <p className="text-sm text-gray-500 mt-1">View your invoices and securely pay outstanding balances.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Billed', value: `$${totalBilled.toFixed(2)}`,   icon: TrendingUp,  color: 'bg-blue-50 text-blue-600' },
          { label: 'Amount Paid',  value: `$${totalPaid.toFixed(2)}`,     icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Outstanding',  value: `$${totalOutstanding.toFixed(2)}`, icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> Your Invoices
          </h2>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">
            {paidCount}/{invoices.length} paid
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-900">No invoices yet</p>
            <p className="text-sm text-gray-500 mt-1">Your payment history will appear here after your first appointment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => {
              const cfg = statusConfig[inv.status] ?? statusConfig.PENDING;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={inv.id}
                  className="px-6 py-5 flex items-center gap-5 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  onClick={() => setSelected(inv)}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900 text-sm">INV-{inv.id.toString().padStart(4, '0')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inv.issued_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {inv.appointment_doctor && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Dr. {inv.appointment_doctor}
                        </span>
                      )}
                      <span className="text-gray-400">{inv.items.length} item{inv.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">${parseFloat(inv.total_amount).toFixed(2)}</p>
                    {inv.status !== 'PAID' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePay(inv); }}
                        className="mt-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-600/20 transition-all"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Detail Slide-over */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-end"
             onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Invoice Detail</p>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  INV-{selectedInvoice.id.toString().padStart(4, '0')}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status */}
              {(() => {
                const cfg = statusConfig[selectedInvoice.status] ?? statusConfig.PENDING;
                return (
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-bold ${cfg.text}`}>
                      {selectedInvoice.status === 'PAID'
                        ? `Paid — $${parseFloat(selectedInvoice.amount_paid).toFixed(2)} received`
                        : `Outstanding — $${parseFloat(selectedInvoice.total_amount).toFixed(2)} due`}
                    </span>
                  </div>
                );
              })()}

              {/* Meta */}
              <div className="space-y-3">
                {[
                  { label: 'Issue Date', value: new Date(selectedInvoice.issued_date).toLocaleDateString('en-US', { dateStyle: 'long' }) },
                  selectedInvoice.due_date && { label: 'Due Date', value: new Date(selectedInvoice.due_date).toLocaleDateString('en-US', { dateStyle: 'long' }) },
                  selectedInvoice.appointment_date && { label: 'Appointment', value: new Date(selectedInvoice.appointment_date).toLocaleDateString('en-US', { dateStyle: 'long' }) },
                  selectedInvoice.appointment_doctor && { label: 'Doctor', value: `Dr. ${selectedInvoice.appointment_doctor}` },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" /> Line Items
                </h4>
                <div className="bg-gray-50 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-700 font-medium">{item.description}</span>
                      <span className="font-bold text-gray-900">${parseFloat(item.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-white">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">${parseFloat(selectedInvoice.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            {selectedInvoice.status !== 'PAID' && (
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={() => { setSelected(null); handlePay(selectedInvoice); }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Pay ${parseFloat(selectedInvoice.total_amount).toFixed(2)} Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
