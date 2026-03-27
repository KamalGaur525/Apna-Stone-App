import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Smartphone, ShieldCheck, ArrowRight, Key, ChevronLeft } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { API } from '../constants/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // 1. Step 1: Check Admin Number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return toast.error('Enter valid 10-digit phone');

    setLoading(true);
    try {
      const res = await axiosInstance.post(API.ADMIN_LOGIN, { phone });

      if (res.data.message.includes("Admin identified") || res.data.success) {
        toast.success(res.data.message || 'Phone verified');
        setStep('otp');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post(API.ADMIN_VERIFY_OTP, { phone, otp });

      if (res.data.token) {
        login(res.data.token);
        toast.success('Master Access Granted!');
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid Master PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 sm:p-6">

      {/* Subtle background texture pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, #1c1917 39px, #1c1917 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #1c1917 39px, #1c1917 40px)',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-stone-300/60 overflow-hidden border border-stone-200/80">

          {/* ── Header ── */}
          <div className="relative bg-stone-950 px-8 pt-10 pb-9 overflow-hidden">
            {/* Decorative corner accent */}
            <span className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-bl-[4rem] pointer-events-none" aria-hidden="true" />
            <span className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" aria-hidden="true" />

            <div className="flex items-center gap-4">
              {/* Icon badge */}
              <div className="shrink-0 w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/40">
                <ShieldCheck size={26} className="text-stone-950" strokeWidth={2.5} />
              </div>

              <div>
                <h1 className="text-white text-2xl font-black tracking-tight leading-none">
                  Stone Wala
                </h1>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.25em] mt-1">
                  Admin Terminal
                </p>
              </div>
            </div>

            {/* Step indicator pills */}
            <div className="flex items-center gap-2 mt-7">
              <span
                className={`h-1 rounded-full transition-all duration-500 ${step === 'phone' ? 'w-8 bg-amber-400' : 'w-4 bg-stone-600'}`}
              />
              <span
                className={`h-1 rounded-full transition-all duration-500 ${step === 'otp' ? 'w-8 bg-amber-400' : 'w-4 bg-stone-700'}`}
              />
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-8 py-8">
            {step === 'phone' ? (
              /* ── Phone step ── */
              <form
                key="phone-form"
                onSubmit={handlePhoneSubmit}
                className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400"
              >
                <div>
                  <p className="text-stone-800 text-base font-semibold leading-snug">
                    Verify your identity
                  </p>
                  <p className="text-stone-400 text-sm mt-0.5">
                    Enter the registered admin number to proceed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest"
                  >
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Smartphone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-500 transition-colors duration-200"
                    />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold text-sm placeholder:text-stone-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 hover:border-stone-300 transition-all duration-200"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-200 disabled:cursor-not-allowed text-white disabled:text-stone-400 font-bold text-sm py-3.5 rounded-xl shadow-md shadow-stone-900/20 hover:shadow-lg hover:shadow-stone-900/25 transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ── OTP / PIN step ── */
              <form
                key="otp-form"
                onSubmit={handleVerifySubmit}
                className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-400"
              >
                <div>
                  <p className="text-stone-800 text-base font-semibold leading-snug">
                    Enter master PIN
                  </p>
                  <p className="text-stone-400 text-sm mt-0.5">
                    Authenticating&nbsp;
                    <span className="font-semibold text-stone-600">{phone}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="otp"
                    className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest"
                  >
                    Master PIN
                  </label>
                  <div className="relative group">
                    <Key
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-500 transition-colors duration-200"
                    />
                    <input
                      id="otp"
                      type="password"
                      autoFocus
                      placeholder="••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-bold text-center text-xl tracking-[0.6em] placeholder:tracking-[0.3em] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 hover:border-stone-300 transition-all duration-200"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 disabled:bg-stone-200 disabled:cursor-not-allowed text-white disabled:text-stone-400 font-bold text-sm py-3.5 rounded-xl shadow-md shadow-stone-900/20 hover:shadow-lg hover:shadow-stone-900/25 transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <>
                      Authenticate
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="group w-full flex items-center justify-center gap-1.5 text-stone-400 hover:text-stone-700 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 py-1"
                >
                  <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                  Change phone number
                </button>
              </form>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-8 pb-7">
            <div className="border-t border-stone-100 pt-5 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <p className="text-[11px] text-stone-400 font-medium tracking-wide">
                Secure encrypted connection
              </p>
            </div>
          </div>
        </div>

        {/* Below-card label */}
        <p className="text-center text-[11px] text-stone-400 font-medium mt-5 tracking-wide">
          © {new Date().getFullYear()} Stone Wala &mdash; Authorized access only
        </p>
      </div>
    </div>
  );
}