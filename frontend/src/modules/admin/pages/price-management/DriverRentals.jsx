import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';

/** Rental bookings, with and without driver. */
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? {};
const TABS = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'];
const TYPE_LABEL = { with_driver: 'With driver', self_drive: 'Without driver' };
const BADGE = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  active: 'bg-sky-50 text-sky-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-50 text-rose-700',
};
const statusLabel = (status) => (status === 'active' ? 'vehicle out' : status);
const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#111111]';
const ghost = 'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50';
const when = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const isSelf = (b) => b.rentalType === 'self_drive';

const actionsFor = (b) => {
  const self = isSelf(b);
  const list = [];
  if (b.status === 'pending') list.push(['confirm', self ? 'Confirm' : 'Assign driver']);
  if (b.status === 'confirmed') {
    list.push(['confirm', self ? 'Change vehicle' : 'Change driver']);
    list.push(self ? ['start', 'Vehicle given'] : ['complete', 'Complete']);
  }
  if (b.status === 'active') list.push(['complete', 'Vehicle returned']);
  if (['pending', 'confirmed'].includes(b.status)) list.push(['cancel', 'Cancel']);
  return list;
};

const Modal = ({ onClose, children, wide }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className={`max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-6 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
      {children}
    </div>
  </div>
);

const LicenceModal = ({ booking, onClose }) => {
  const [image, setImage] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    adminService
      .getDriverRentalLicence(booking._id)
      .then((res) => alive && setImage(unwrap(res).image || ''))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [booking._id]);
  return (
    <Modal onClose={onClose} wide>
      <h3 className="mb-3 text-lg font-bold text-gray-900">Driving licence, {booking.reference}</h3>
      {failed ? <p className="text-sm text-rose-700">Could not load the photo.</p> : image ? <img src={image} alt="Driving licence" className="w-full rounded-lg" /> : <Loader2 className="mx-auto my-10 animate-spin text-gray-400" />}
    </Modal>
  );
};

const ActionModal = ({ booking, action, label, onClose, onDone }) => {
  const [form, setForm] = useState({
    driverName: booking.driver?.name || '',
    driverPhone: booking.driver?.phone || '',
    vehicleNumber: booking.driver?.vehicleNumber || '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const bind = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const self = isSelf(booking);

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

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500">{booking.reference} · {booking.vehicleName} · ₹{booking.package.price}</p>
        {action === 'confirm' && !self && (
          <>
            <input className={input} placeholder="Driver name" required {...bind('driverName')} />
            <input className={input} placeholder="Driver phone" inputMode="tel" required {...bind('driverPhone')} />
            <input className={input} placeholder="Vehicle number (optional)" {...bind('vehicleNumber')} />
            <p className="text-xs text-gray-500">The customer sees these details. The driver is not notified by the app, so call them.</p>
          </>
        )}
        {action === 'confirm' && self && (
          <>
            <input className={input} placeholder="Vehicle number" required {...bind('vehicleNumber')} />
            <p className="text-xs text-gray-500">Check the licence photo first. The customer sees the vehicle number.</p>
          </>
        )}
        {action === 'cancel' && <textarea className={input} maxLength={300} placeholder="Reason shown to the customer" required {...bind('reason')} />}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghost} onClick={onClose}>Back</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-bold text-[#F9C105] disabled:opacity-50">
            {saving ? 'Saving…' : label}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const DriverRentals = () => {
  const [status, setStatus] = useState('all');
  const [rentalType, setRentalType] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(unwrap(await adminService.getDriverRentals({ status, rentalType, page })));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [status, rentalType, page]);

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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Rental Bookings</h1>
          <div className="flex gap-2">
            <select className={ghost} value={rentalType} aria-label="Rental type" onChange={(e) => { setRentalType(e.target.value); setPage(1); }}>
              <option value="all">All rentals</option>
              <option value="with_driver">With driver</option>
              <option value="self_drive">Without driver</option>
            </select>
            <button type="button" className={ghost} onClick={load} aria-label="Refresh"><RefreshCw size={15} /></button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setStatus(t); setPage(1); }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold capitalize ${status === t ? 'bg-[#111111] text-[#F9C105]' : 'text-gray-600'}`}
            >
              {statusLabel(t)} {t !== 'all' && `(${summary[t] || 0})`}
            </button>
          ))}
        </div>
        {failed && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not load bookings. Use refresh to try again.</p>}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Booking', 'Customer', 'Vehicle', 'Where and when', 'Assigned', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12"><Loader2 className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">No bookings.</td></tr>
              ) : (
                results.map((b) => (
                  <tr key={b._id} className="align-top">
                    <td className="px-4 py-3 text-xs font-bold"><span className="font-mono">{b.reference}</span><br />{TYPE_LABEL[b.rentalType]}<br />{when(b.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold">{b.userId?.name || 'Customer'}<br />{b.userId?.phone || '-'}</td>
                    <td className="px-4 py-3"><b>{b.vehicleName}</b><br />{b.package.durationHours} hr, {b.package.includedKm} km<br /><b>₹{b.package.price}</b></td>
                    <td className="max-w-[240px] px-4 py-3"><b>{when(b.pickupAt)}</b><br />{b.pickupAddress}{b.notes && <><br /><i>{b.notes}</i></>}</td>
                    <td className="px-4 py-3">
                      {b.driver?.name && <>{b.driver.name}<br />{b.driver.phone}<br /></>}
                      {b.driver?.vehicleNumber || (!b.driver?.name && '-')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${BADGE[b.status]}`}>{statusLabel(b.status)}</span>
                      {b.cancelledBy && <div className="mt-1 text-xs">by {b.cancelledBy}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {b.hasLicence && <button type="button" className={ghost} onClick={() => setModal({ booking: b, action: 'licence' })}>View licence</button>}
                        {actionsFor(b).map(([action, label]) => (
                          <button key={action} type="button" className={ghost} onClick={() => setModal({ booking: b, action, label })}>{label}</button>
                        ))}
                      </div>
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
      {modal?.action === 'licence' && <LicenceModal booking={modal.booking} onClose={() => setModal(null)} />}
      {modal && modal.action !== 'licence' && <ActionModal {...modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
};

export default DriverRentals;
