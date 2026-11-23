import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bike,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  ImagePlus,
  Loader2,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

/**
 * Price Management > Vehicle Insurance.
 * Customers apply to insure their own vehicle; admin approves (issues a
 * policy) or rejects. Premium rates per vehicle class and the customer-app
 * banner are managed here too. Mirrors the old Ninja Truck admin.
 */

const unwrap = (response) => response?.data?.data ?? response?.data ?? response ?? {};

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

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
};

const input =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#111111] focus:ring-1 focus:ring-[#111111]';
const label = 'mb-1.5 block text-xs font-semibold text-gray-500';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-4 py-2.5 text-sm font-bold text-[#F9C105] transition hover:bg-black disabled:opacity-50';
const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50';

// ------------------------------------------------------------ Applications

const ProcessModal = ({ application, action, onClose, onDone }) => {
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const approving = action === 'approve';

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.processInsuranceApplication(application._id, approving
        ? { action, provider, policyNumber }
        : { action, reason });
      toast.success(approving ? 'Policy issued' : 'Application rejected');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{approving ? 'Approve & issue policy' : 'Reject application'}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {application.vehicleNumber} · {vehicleLabel(application.vehicleType)} · {durationLabel(application.duration)} · {rupees(application.premiumAmount)}
        </p>
        <div className="mt-5 space-y-4">
          {approving ? (
            <>
              <div>
                <label className={label}>Insurance provider</label>
                <input className={input} value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. ICICI Lombard" required />
              </div>
              <div>
                <label className={label}>Policy number (leave empty to generate)</label>
                <input className={input} value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="POL-…" />
              </div>
              <p className="text-xs text-gray-400">Coverage starts today and ends after {durationLabel(application.duration).toLowerCase()}.</p>
            </>
          ) : (
            <div>
              <label className={label}>Reason (shown to the customer)</label>
              <textarea className={`${input} min-h-[90px]`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vehicle number does not match RC" />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className={approving ? btnPrimary : 'inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50'}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            {approving ? 'Issue policy' : 'Reject'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ApplicationsTab = () => {
  const [filters, setFilters] = useState({ status: 'all', vehicleType: 'all', search: '', page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState({ results: [], summary: {}, paginator: {} });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(unwrap(await adminService.getInsuranceApplications(filters)));
    } catch {
      toast.error('Failed to load insurance applications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { results = [], summary = {}, paginator = {} } = data;
  const cards = [
    { label: 'Pending Requests', value: summary.pending || 0, icon: Clock, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Active Policies', value: summary.active || 0, icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rejected Requests', value: summary.rejected || 0, icon: XCircle, tone: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}><Icon size={20} /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <select className={`${input} w-auto`} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <select className={`${input} w-auto`} value={filters.vehicleType} onChange={(e) => setFilters((f) => ({ ...f, vehicleType: e.target.value, page: 1 }))}>
              <option value="all">All vehicle types</option>
              {VEHICLES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <div className="relative lg:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className={`${input} pl-9`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search vehicle, customer or policy" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {['Customer', 'Vehicle Number', 'Vehicle Type', 'Plan', 'Premium', 'Policy', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-14 text-center"><Loader2 className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={8} className="py-14 text-center text-gray-500">No insurance applications found.</td></tr>
              ) : (
                results.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{a.userId?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-500">{a.userId?.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">{a.vehicleNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{vehicleLabel(a.vehicleType)}</td>
                    <td className="px-4 py-3 text-gray-700">{durationLabel(a.duration)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{rupees(a.premiumAmount)}</td>
                    <td className="px-4 py-3">
                      {a.policyNumber ? (
                        <>
                          <p className="font-mono text-xs font-semibold text-gray-800">{a.policyNumber}</p>
                          <p className="text-xs text-gray-500">
                            {a.provider || ''}{a.expiresAt ? ` · till ${new Date(a.expiresAt).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLE[a.status] || STATUS_STYLE.expired}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setProcessing({ application: a, action: 'approve' })} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button type="button" onClick={() => setProcessing({ application: a, action: 'reject' })} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50">
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : <span className="text-xs text-gray-400">Processed</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
          <span>{paginator.total || 0} application{paginator.total === 1 ? '' : 's'}</span>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} disabled={(paginator.current_page || 1) <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
            <button type="button" className={btnGhost} disabled={(paginator.current_page || 1) >= (paginator.last_page || 1)} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
          </div>
        </div>
      </div>

      {processing && (
        <ProcessModal
          application={processing.application}
          action={processing.action}
          onClose={() => setProcessing(null)}
          onDone={() => { setProcessing(null); load(); }}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------ Premium rates

const RatesTab = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = unwrap(await adminService.getInsurancePlans());
        setPlans(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Failed to load premium rates');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setRate = (vehicleType, duration, value) =>
    setPlans((prev) => prev.map((p) => (p.vehicleType === vehicleType ? { ...p, rates: { ...p.rates, [duration]: value } } : p)));

  const save = async (plan) => {
    setSaving(plan.vehicleType);
    try {
      await adminService.updateInsurancePlan(plan.vehicleType, plan.rates);
      toast.success(`${vehicleLabel(plan.vehicleType)} rates saved`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save rates');
    } finally {
      setSaving('');
    }
  };

  if (loading) return <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-gray-400" /></div>;
  if (plans.length === 0) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">Could not load the premium rates. Refresh the page to try again.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {plans.map((plan) => {
        const Icon = VEHICLES.find((v) => v.id === plan.vehicleType)?.icon || Truck;
        return (
          <div key={plan.vehicleType} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9C105] text-[#111111]"><Icon size={18} /></span>
              <div>
                <p className="font-bold text-gray-900">{vehicleLabel(plan.vehicleType)}</p>
                <p className="text-xs text-gray-500">Premium the customer pays per plan</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map((d) => (
                <div key={d.id}>
                  <label className={label}>{d.label} (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={input}
                    value={plan.rates?.[d.id] ?? 0}
                    onChange={(e) => setRate(plan.vehicleType, d.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className={btnPrimary} disabled={saving === plan.vehicleType} onClick={() => save(plan)}>
                {saving === plan.vehicleType && <Loader2 size={15} className="animate-spin" />} Save rates
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ Banner settings

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BannerTab = () => {
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSettings(unwrap(await adminService.getInsuranceSettings()));
      } catch {
        setLoadError(true);
        toast.error('Failed to load banner settings');
      }
    })();
  }, []);

  if (loadError) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">Could not load the banner settings. Refresh the page to try again.</div>;
  if (!settings) return <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-gray-400" /></div>;

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5 MB');
    setUploading(true);
    try {
      const res = await adminService.uploadInsuranceImage(await readFileAsDataUrl(file));
      update('bannerImageUrl', unwrap(res).url || '');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { enabled, bannerTitle, bannerSubtitle, policyTermsLabel, bannerImageUrl } = settings;
      setSettings(unwrap(await adminService.updateInsuranceSettings({ enabled, bannerTitle, bannerSubtitle, policyTermsLabel, bannerImageUrl })));
      toast.success('Banner settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-3">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Show insurance section</p>
            <p className="text-xs text-gray-500">Turns the insurance banner and applications on in the customer app</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(settings.enabled)}
            onClick={() => update('enabled', !settings.enabled)}
            className={`relative h-6 w-11 rounded-full transition ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${settings.enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div>
          <label className={label}>Banner title</label>
          <input className={input} value={settings.bannerTitle || ''} onChange={(e) => update('bannerTitle', e.target.value)} />
        </div>
        <div>
          <label className={label}>Banner subtitle</label>
          <input className={input} value={settings.bannerSubtitle || ''} onChange={(e) => update('bannerSubtitle', e.target.value)} />
        </div>
        <div>
          <label className={label}>Policy terms label</label>
          <input className={input} value={settings.policyTermsLabel || ''} onChange={(e) => update('policyTermsLabel', e.target.value)} />
        </div>
        <div>
          <label className={label}>Banner image (800×400 recommended, max 5 MB)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {uploading ? 'Uploading…' : 'Choose image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex justify-end">
          <button type="button" className={btnPrimary} disabled={saving || uploading} onClick={save}>
            {saving && <Loader2 size={15} className="animate-spin" />} Save settings
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer app preview</p>
        <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-[#111111] ${settings.enabled ? '' : 'opacity-50'}`}>
          {settings.bannerImageUrl ? (
            <img src={settings.bannerImageUrl} alt="" className="aspect-[2/1] w-full object-cover" />
          ) : (
            <div className="flex aspect-[2/1] items-center justify-center bg-[#F9C105]/15 text-[#F9C105]"><ShieldCheck size={40} /></div>
          )}
          <div className="p-4">
            <p className="font-bold text-white">{settings.bannerTitle || 'Vehicle Insurance'}</p>
            <p className="text-sm text-white/70">{settings.bannerSubtitle}</p>
            {settings.policyTermsLabel && <p className="mt-2 text-xs font-semibold text-[#F9C105]">{settings.policyTermsLabel}</p>}
          </div>
        </div>
        {!settings.enabled && <p className="mt-2 text-xs text-gray-500">Hidden in the customer app while the section is off.</p>}
      </div>
    </div>
  );
};

// ------------------------------------------------------------ Page

const TABS = [
  { id: 'applications', label: 'Applications' },
  { id: 'rates', label: 'Premium Rates' },
  { id: 'banner', label: 'Banner Settings' },
];

const VehicleInsurance = () => {
  const [tab, setTab] = useState('applications');

  return (
    <div className="nt-dash min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
            <span>Price Management</span>
            <ChevronRight size={12} />
            <span className="text-gray-700">Vehicle Insurance</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Vehicle Insurance</h1>
        </div>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition ${
                tab === t.id ? 'bg-[#111111] text-[#F9C105]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'applications' && <ApplicationsTab />}
        {tab === 'rates' && <RatesTab />}
        {tab === 'banner' && <BannerTab />}
      </div>
    </div>
  );
};

export default VehicleInsurance;
