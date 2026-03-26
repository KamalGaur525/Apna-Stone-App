import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Smartphone, ShieldCheck, ArrowRight, Key } from 'lucide-react';
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
      
      // Backend status true aate hi OTP/PIN wale step par bhejo
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
        login(res.data.token); // Token save karo
        toast.success('Master Access Granted!');
        navigate('/', { replace: true }); // Dashboard par jao
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid Master PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Stone Wala Branding */}
        <div className="bg-stone-950 p-12 text-center text-white">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-3">
            <ShieldCheck size={40} className="text-stone-950" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">STONE WALA</h1>
          <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">Terminal Login</p>
        </div>

        <div className="p-10">
          <form onSubmit={step === 'phone' ? handlePhoneSubmit : handleVerifySubmit} className="space-y-6">
            {step === 'phone' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 ml-1">Identity</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="tel"
                    placeholder="Enter Admin Phone"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 ml-1">Master PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="password"
                    autoFocus
                    placeholder="••••"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold tracking-[1em] text-center text-xl"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {step === 'phone' ? 'Continue' : 'Authenticate'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {step === 'otp' && (
              <button 
                type="button" 
                onClick={() => setStep('phone')}
                className="w-full text-stone-400 text-xs font-bold hover:text-stone-600 transition-colors uppercase tracking-tighter"
              >
                Change Phone Number
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}