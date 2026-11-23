import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/adminService';
import { useSettings } from '../../../../shared/context/SettingsContext';
import { NINJA_BRAND } from '../../../landing/components/ninjaBrand';

/**
 * Admin sign-in, in the Ninja Truck brand: ink brand panel on the left (a top
 * band on phones), the form on brand yellow on the right. Kept an honest login
 * form - no "terminal access" theatre - just on-brand.
 */

const Field = ({ icon: Icon, id, label, trailing, ...props }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-[12px] font-black uppercase tracking-widest text-[#111111]">
      {label}
    </label>
    <div className="relative">
      <Icon
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/60 pointer-events-none"
      />
      <input
        id={id}
        className={`w-full pl-10 ${trailing ? 'pr-11' : 'pr-3'} py-3 bg-white border-2 border-[#111111] rounded-none text-[15px] font-semibold text-[#111111] placeholder:text-slate-400 placeholder:font-medium outline-none shadow-[4px_4px_0_0_rgba(17,17,17,0.9)] focus:shadow-[2px_2px_0_0_rgba(17,17,17,0.9)] focus:translate-x-[2px] focus:translate-y-[2px] transition`}
        {...props}
      />
      {trailing}
    </div>
  </div>
);

const PrimaryButton = ({ isLoading, children, loadingLabel }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="group w-full flex items-center justify-center gap-2 bg-[#111111] py-3.5 text-[15px] font-black uppercase tracking-widest text-[#F9C105] shadow-[5px_5px_0_0_rgba(255,255,255,0.55)] transition hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
  >
    {isLoading && <Loader2 className="animate-spin" size={17} />}
    {isLoading ? loadingLabel : children}
    {!isLoading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
  </button>
);

const AdminLogin = () => {
  const { settings } = useSettings();
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const appLogo = settings.general?.logo || settings.customization?.logo || NINJA_BRAND.logo;

  const switchView = (next) => {
    setError('');
    setNotice('');
    setView(next);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminService.login({ email, password });
      localStorage.setItem('adminToken', response?.token || '');
      localStorage.setItem('adminInfo', JSON.stringify(response?.admin || {}));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      await adminService.forgotPassword(resetEmail);
      setNotice('If that email belongs to an admin account, reset instructions are on their way.');
    } catch (err) {
      // Deliberately generic: the server can surface raw transport errors
      // ("connect ECONNREFUSED 127.0.0.1:587") that tell a visitor about our
      // infrastructure. The detail still goes to the console.
      console.error('[admin] password reset failed:', err.response?.data?.message || err.message);
      setError('Could not send reset instructions right now. Please contact your administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9C105] font-['Outfit',sans-serif] flex flex-col lg:flex-row selection:bg-[#111111] selection:text-[#F9C105]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-[#111111] text-white lg:w-[46%] xl:w-1/2 flex flex-col justify-between px-6 py-6 lg:px-14 lg:py-12 border-b-4 lg:border-b-0 lg:border-r-4 border-[#111111]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="relative z-10 flex items-center gap-3 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C105]"
          aria-label="Ninja Truck home"
        >
          <img src={appLogo} alt="" className="h-11 w-11 rounded-xl object-contain" />
          <span className="font-black text-2xl tracking-tighter text-white">NINJA TRUCK</span>
          <span className="hidden sm:inline font-bold tracking-widest text-[#F9C105] text-sm mt-1">ADMIN</span>
        </button>

        <div className="relative z-10 hidden lg:block my-12">
          <p className="mb-5 inline-block border-l-4 border-[#F9C105] bg-white/5 px-4 py-2 text-sm font-black uppercase tracking-widest text-[#F9C105]">
            Operations Console
          </p>
          <h2 className="text-5xl xl:text-6xl font-black uppercase leading-[1.02] tracking-tighter">
            Every load.
            <br />
            <span className="text-[#F9C105]">Under control.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg font-semibold leading-relaxed text-white/60">
            Bookings, drivers, fleets, pricing and payouts for Ninja Truck — all in one place.
          </p>
        </div>

        <div
          className="relative z-10 hidden lg:block w-full max-w-[520px] rotate-2"
          style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
        >
          <img src="/ninjatruck-highway.svg" alt="" className="w-full aspect-[4/3] object-cover" />
        </div>

        {/* road stripes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 hidden lg:flex gap-10 px-6 pb-4 opacity-30">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-1.5 w-14 bg-[#F9C105]" />
          ))}
        </div>
      </aside>

      {/* Form */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[420px]"
          >
            <p className="text-sm font-black uppercase tracking-widest text-white drop-shadow-sm">
              - {view === 'login' ? 'Admin Panel' : 'Account Recovery'} -
            </p>
            <h1 className="mt-2 text-5xl font-black uppercase tracking-tighter leading-none text-[#111111]">
              {view === 'login' ? 'Sign In' : 'Reset Password'}
            </h1>
            <p className="mt-3 border-l-2 border-[#111111] pl-3 text-[15px] font-bold text-slate-800">
              {view === 'login'
                ? 'Use your Ninja Truck admin email and password.'
                : 'Enter your admin email and we will send you a reset link.'}
            </p>

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {(error || notice) && (
                  <motion.div
                    key={error || notice}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-6 flex items-start gap-2 border-2 border-[#111111] p-3 text-[14px] font-bold ${
                      error ? 'bg-rose-50 text-rose-800' : 'bg-white text-emerald-800'
                    }`}
                    role={error ? 'alert' : 'status'}
                  >
                    {error ? (
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    )}
                    <p className="leading-snug">{error || notice}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <Field
                    icon={Mail}
                    id="admin-email"
                    label="Email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@ninjatruck.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <Field
                    icon={Lock}
                    id="admin-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#111111]/60 hover:text-[#111111]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    }
                  />

                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-[13px] font-black uppercase tracking-wider text-[#111111] underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <PrimaryButton isLoading={isLoading} loadingLabel="Signing in…">
                    Sign In
                  </PrimaryButton>
                </form>
              ) : (
                <form onSubmit={handleForgot} className="space-y-6">
                  <Field
                    icon={Mail}
                    id="reset-email"
                    label="Email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@ninjatruck.in"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoFocus
                    required
                  />

                  <PrimaryButton isLoading={isLoading} loadingLabel="Sending…">
                    Send Reset Link
                  </PrimaryButton>

                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="w-full flex items-center justify-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-[#111111] hover:underline underline-offset-4"
                  >
                    <ArrowLeft size={15} />
                    Back to sign in
                  </button>
                </form>
              )}
            </div>

            <p className="mt-10 text-[12px] font-bold uppercase tracking-wider text-[#111111]/60">
              Authorised access only. Sign-in attempts are logged.
            </p>
          </motion.div>
        </div>

        <footer className="border-t-2 border-[#111111]/15 px-5 py-5 text-center text-[12px] font-black uppercase tracking-wider text-[#111111]">
          © {new Date().getFullYear()} Ninja Truck Logistics
        </footer>
      </main>
    </div>
  );
};

export default AdminLogin;
