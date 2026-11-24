import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';

/** Rental With Driver bookings: assign a driver, complete or cancel. */
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? {};
const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const BADGE = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-50 text-rose-700',
};
const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#111111]';
const ghost = 'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50';
const when = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const ActionModal = ({ booking, action, onClose, onDone }) => {
  const [form, setForm] = useState({
    driverName: booking.driver?.name || '',
    driverPhone: booking.driver?.phone || '',
    vehicleNumber: booking.driver?.vehicleNumber || '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.processDriverRental(booking._id, { action, ...form });
      toast.success('Booking updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not update');
      setSaving(false);
      return;
    }
    onDone();
  };

  const title = { confirm: 'Assign driver', complete: 'Mark as completed', cancel: 'Cancel booking' }[action];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{booking.reference} · {booking.vehicleName} · ₹{booking.package.price}</p>
        {action === 'confirm' && (
          <>
            <input className={input} placeholder="Driver name" required {...bind('driverName')} />
            <input className={input} placeholder="Driver phone" inputMode="tel" required {...bind('driverPhone')} />
            <input className={input} placeholder="Vehicle number (optional)" {...bind('vehicleNumber')} />
            <p className="text-xs text-gray-500">The customer sees these details. The driver is not notified by the app, so call them.</p>
          </>
        )}
        {action === 'cancel' && <textarea className={input} maxLength={300} placeholder="Reason shown to the customer" required {...bind('reason')} />}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghost} onClick={onClose}>Back</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-bold text-[#F9C105] disabled:opacity-50">
            {saving ? 'Saving…' : title}
          </button>
        </div>
      </form>
    </div>
  );
};

const DriverRentals = () => {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(unwrap(await adminService.getDriverRentals({ status, page })));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const results = data.results || [];
  const summary = data.summary || {};
  const pages = data.paginator?.last_page || 1;

  return (
    <div className="nt-dash min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Rental With Driver</h1>
          <button type="button" className={ghost} onClick={load} aria-label="Refresh"><RefreshCw size={15} /></button>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setStatus(t); setPage(1); }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold capitalize ${status === t ? 'bg-[#111111] text-[#F9C105]' : 'text-gray-600'}`}
            >
              {t} {t !== 'all' && `(${summary[t] || 0})`}
            </button>
          ))}
        </div>
        {failed && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not load bookings. Use refresh to try again.</p>}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Booking', 'Customer', 'Vehicle', 'Pickup', 'Driver', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12"><Loader2 className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">No bookings.</td></tr>
              ) : (
                results.map((b) => (
                  <tr key={b._id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{b.reference}<br />{when(b.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold">{b.userId?.name || 'Customer'}<br />{b.userId?.phone || '-'}</td>
                    <td className="px-4 py-3"><b>{b.vehicleName}</b><br />{b.package.durationHours} hr, {b.package.includedKm} km<br /><b>₹{b.package.price}</b></td>
                    <td className="max-w-[260px] px-4 py-3"><b>{when(b.pickupAt)}</b><br />{b.pickupAddress}{b.notes && <><br /><i>{b.notes}</i></>}</td>
                    <td className="px-4 py-3">{b.driver?.name ? <>{b.driver.name}<br />{b.driver.phone}<br />{b.driver.vehicleNumber}</> : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${BADGE[b.status]}`}>{b.status}</span>
                      {b.cancelledBy && <div className="mt-1 text-xs">by {b.cancelledBy}</div>}
                    </td>
                    <td className="space-y-1.5 px-4 py-3">
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button type="button" className={ghost} onClick={() => setModal({ booking: b, action: 'confirm' })}>{b.status === 'pending' ? 'Assign driver' : 'Change driver'}</button>
                      )}{' '}
                      {b.status === 'confirmed' && <button type="button" className={ghost} onClick={() => setModal({ booking: b, action: 'complete' })}>Complete</button>}{' '}
                      {['pending', 'confirmed'].includes(b.status) && <button type="button" className={ghost} onClick={() => setModal({ booking: b, action: 'cancel' })}>Cancel</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <button type="button" className={ghost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            {page} / {pages}
            <button type="button" className={ghost} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
      {modal && <ActionModal {...modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
};

export default DriverRentals;
