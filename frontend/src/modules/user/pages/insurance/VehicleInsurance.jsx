import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bike, Car, CheckCircle2, Clock, Loader2, ShieldCheck, Truck, XCircle } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { useUserTheme } from '../../../../shared/context/UserThemeContext';

/**
 * Customer Vehicle Insurance: pick a vehicle class and plan, enter the vehicle
 * number, apply. The admin reviews it and issues the policy
 * (Price Management > Vehicle Insurance). Past applications and active
 * policies are listed underneath.
 */

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

const VEHICLES = [
  { id: 'bike', label: 'Bike', icon: Bike },
  { id: 'auto', label: 'Auto', icon: Car },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'truck', label: 'Truck', icon: Truck },
];
const DURATIONS = [
  { id: '1_month', label: '1 Month' },
  { id: '6_months', label: '6 Months' },
  { id: '1_year', label: '1 Year' },
];
const durationLabel = (id) => DURATIONS.find((d) => d.id === id)?.label || id;
const vehicleLabel = (id) => VEHICLES.find((v) => v.id === id)?.label || id;
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS = {
  pending: { label: 'Under review', icon: Clock, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  active: { label: 'Active', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  expired: { label: 'Expired', icon: Clock, cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const VehicleInsurance = () => {
  const navigate = useNavigate();
  const { theme } = useUserTheme();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState('truck');
  const [duration, setDuration] = useState('1_year');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMine = useCallback(async () => {
    try {
      const list = unwrap(await api.get('/insurance/my'));
      setMine(Array.isArray(list) ? list : []);
    } catch {
      /* the form still works without the history */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([api.get('/insurance/settings'), api.get('/insurance/plans')]);
        setSettings(unwrap(s));
        const list = unwrap(p);
        setPlans(Array.isArray(list) ? list : []);
      } catch {
        setError('Could not load insurance plans. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
    loadMine();
  }, [loadMine]);

  const rates = useMemo(() => plans.find((p) => p.vehicleType === vehicleType)?.rates || {}, [plans, vehicleType]);
  const premium = Number(rates[duration] || 0);
  const cleanNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();
  const canSubmit = premium > 0 && /^[A-Z0-9]{4,15}$/.test(cleanNumber) && !submitting;

  const apply = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/insurance/apply', { vehicleType, duration, vehicleNumber: cleanNumber });
      setSuccess('Application sent. Our team will review it and issue your policy.');
      setVehicleNumber('');
      loadMine();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not submit the application.');
    } finally {
      setSubmitting(false);
    }
  };

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/90 border-white/80 shadow-[0_4px_14px_rgba(15,23,42,0.06)]';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className={`relative min-h-screen max-w-lg mx-auto overflow-hidden pb-28 font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-[linear-gradient(180deg,#F8FAFC_0%,#F3F4F6_38%,#EEF2F7_100%)] text-slate-900'}`}>
      <header className={`sticky top-0 z-20 border-b px-5 pt-10 pb-4 backdrop-blur-md ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)]'}`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className={`flex h-9 w-9 items-center justify-center rounded-[12px] border shadow-sm active:scale-95 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-white/80 bg-white/90'}`}>
            <ArrowLeft size={18} className={strong} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-slate-400">Protect your vehicle</p>
            <h1 className={`text-[19px] font-black leading-tight tracking-tight ${strong}`}>{settings?.bannerTitle || 'Vehicle Insurance'}</h1>
          </div>
          <ShieldCheck size={20} className="text-yellow-500" />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : settings && !settings.enabled ? (
        <div className={`mx-5 mt-6 rounded-[20px] border p-6 text-center ${card}`}>
          <ShieldCheck size={32} className="mx-auto text-slate-400" />
          <p className={`mt-2 font-black ${strong}`}>Insurance is not available right now</p>
          <p className={`mt-1 text-sm ${muted}`}>Please check back later.</p>
        </div>
      ) : (
        <div className="space-y-4 px-5 pt-4">
          {settings?.bannerImageUrl && (
            <div className="overflow-hidden rounded-[20px] bg-[#111111]">
              <img src={settings.bannerImageUrl} alt="" className="aspect-[2/1] w-full object-cover" />
              <div className="p-4">
                <p className="text-sm font-bold text-white/80">{settings.bannerSubtitle}</p>
                {settings.policyTermsLabel && <p className="mt-1 text-xs font-black text-[#F9C105]">{settings.policyTermsLabel}</p>}
              </div>
            </div>
          )}

          <section className={`rounded-[20px] border p-4 ${card}`}>
            <p className={`mb-3 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>1. Your vehicle</p>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLES.map(({ id, label: l, icon }) => {
                const Icon = icon;
                const active = vehicleType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVehicleType(id)}
                    className={`flex flex-col items-center gap-1 rounded-[14px] border py-3 text-[12px] font-black transition ${active ? 'border-[#111111] bg-[#F9C105] text-[#111111]' : isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    <Icon size={20} />
                    {l}
                  </button>
                );
              })}
            </div>
            <label className={`mt-4 mb-1.5 block text-[12px] font-bold ${muted}`} htmlFor="ins-vehicle-number">Vehicle number</label>
            <input
              id="ins-vehicle-number"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MP09AB1234"
              autoCapitalize="characters"
              className={`w-full rounded-[14px] border px-4 py-3 font-mono text-[15px] font-bold tracking-wider outline-none focus:border-[#111111] ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
            />
          </section>

          <section className={`rounded-[20px] border p-4 ${card}`}>
            <p className={`mb-3 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>2. Choose a plan</p>
            <div className="space-y-2">
              {DURATIONS.map((d) => {
                const price = Number(rates[d.id] || 0);
                const active = duration === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={price <= 0}
                    onClick={() => setDuration(d.id)}
                    className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3 text-left transition disabled:opacity-40 ${active ? 'border-[#111111] bg-[#F9C105]/20' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${active ? 'border-[#111111]' : 'border-slate-300'}`}>
                        {active && <span className="h-2 w-2 rounded-full bg-[#111111]" />}
                      </span>
                      <span className={`text-[14px] font-black ${strong}`}>{d.label}</span>
                    </span>
                    <span className={`text-[15px] font-black ${strong}`}>{price > 0 ? rupees(price) : 'N/A'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {error && <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>}
          {success && <p className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">{success}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={apply}
            className="flex w-full items-center justify-between rounded-[18px] border-2 border-[#111111] bg-[#F9C105] px-5 py-4 text-[#111111] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition active:scale-[0.99] disabled:opacity-40"
          >
            <span className="text-[15px] font-black uppercase tracking-wide">{submitting ? 'Sending…' : 'Apply for cover'}</span>
            <span className="text-[17px] font-black">{premium > 0 ? rupees(premium) : ''}</span>
          </button>
          <p className={`text-center text-[11px] ${muted}`}>
            {vehicleLabel(vehicleType)} · {durationLabel(duration)}. Our team reviews every application before the policy is issued.
          </p>

          {mine.length > 0 && (
            <section className="pt-2">
              <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>Your applications</p>
              <div className="space-y-2">
                {mine.map((a, i) => {
                  const s = STATUS[a.status] || STATUS.expired;
                  const StatusIcon = s.icon;
                  return (
                    <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-[18px] border p-4 ${card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-mono text-[15px] font-black tracking-wider ${strong}`}>{a.vehicleNumber}</p>
                          <p className={`text-[12px] font-semibold ${muted}`}>{vehicleLabel(a.vehicleType)} · {durationLabel(a.duration)} · {rupees(a.premiumAmount)}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black ${s.cls}`}>
                          <StatusIcon size={12} /> {s.label}
                        </span>
                      </div>
                      {a.status === 'active' && (
                        <p className={`mt-2 text-[12px] font-semibold ${muted}`}>
                          Policy <span className={`font-mono font-black ${strong}`}>{a.policyNumber}</span>
                          {a.provider ? ` · ${a.provider}` : ''}
                          {a.expiresAt ? ` · valid till ${new Date(a.expiresAt).toLocaleDateString('en-IN')}` : ''}
                        </p>
                      )}
                      {a.status === 'rejected' && a.rejectionReason && (
                        <p className="mt-2 text-[12px] font-semibold text-rose-600">{a.rejectionReason}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleInsurance;
