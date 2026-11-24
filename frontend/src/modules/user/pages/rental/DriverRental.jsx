import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Phone, Truck } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import { useUserTheme } from '../../../../shared/context/UserThemeContext';

/**
 * Rental with driver: choose hours, vehicle, pickup address and time, then
 * book. The team confirms with a driver (Admin > Rental With Driver). Prices
 * come from the rental vehicle catalogue and are applied again on the server.
 */
const DURATIONS = [
  { hours: 1, label: '1 Hour' },
  { hours: 6, label: '6 Hours' },
  { hours: 12, label: '12 Hours' },
];
const STATUS = {
  pending: ['Waiting for driver', 'bg-amber-50 text-amber-700 border-amber-200'],
  confirmed: ['Confirmed', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  completed: ['Completed', 'bg-slate-100 text-slate-600 border-slate-200'],
  cancelled: ['Cancelled', 'bg-rose-50 text-rose-700 border-rose-200'],
};
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const errorText = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const when = (value) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const packageOf = (vehicle, hours) =>
  (vehicle?.pricing || []).find((p) => Number(p.durationHours) === hours && p.active !== false);

// datetime-local value in the phone's own time zone.
const localInput = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const defaultPickup = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return localInput(d);
};

const DriverRental = () => {
  const navigate = useNavigate();
  const { theme } = useUserTheme();
  const isDark = theme === 'dark';

  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(1);
  const [vehicleId, setVehicleId] = useState('');
  const [address, setAddress] = useState('');
  const [pickupAt, setPickupAt] = useState(defaultPickup);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmCancel, setConfirmCancel] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get('/users/driver-rentals');
      const list = res?.data?.results || res?.results || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch {
      /* booking still works without the history */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users/rental-vehicles');
        const list = res?.data?.results || res?.results || [];
        setVehicles(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(errorText(err, 'Could not load vehicles.'));
      } finally {
        setLoading(false);
      }
    })();
    loadBookings();
    const timer = setInterval(loadBookings, 30000);
    return () => clearInterval(timer);
  }, [loadBookings]);

  const options = useMemo(
    () =>
      vehicles
        .filter((v) => packageOf(v, hours))
        .sort((a, b) => packageOf(a, hours).price - packageOf(b, hours).price),
    [vehicles, hours],
  );
  const vehicle = options.find((v) => v.id === vehicleId);
  const pkg = packageOf(vehicle, hours);
  const canBook = Boolean(pkg) && address.trim().length >= 8 && pickupAt && !busy;

  const book = async () => {
    setError('');
    setSuccess('');
    setBusy('book');
    try {
      await api.post('/users/driver-rentals', {
        vehicleTypeId: vehicle.id,
        packageId: pkg.id,
        pickupAddress: address.trim(),
        pickupAt: new Date(pickupAt).toISOString(),
        notes: notes.trim(),
      });
      setSuccess('Booking sent. We will confirm it with a driver.');
      setVehicleId('');
      setNotes('');
      await loadBookings();
    } catch (err) {
      setError(errorText(err, 'Could not book. Please try again.'));
    } finally {
      setBusy('');
    }
  };

  const cancel = async (id) => {
    setError('');
    setSuccess('');
    setBusy(id);
    try {
      await api.post(`/users/driver-rentals/${id}/cancel`);
      setSuccess('Booking cancelled.');
    } catch (err) {
      setError(errorText(err, 'Could not cancel.'));
    } finally {
      setBusy('');
      setConfirmCancel('');
      loadBookings();
    }
  };

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  // Not bg-slate-900: the user-app theme repaints buttons with that class yellow.
  const tile = isDark ? 'bg-[#0f1b2d] border-slate-700' : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';
  const field = `w-full rounded-[14px] border px-4 py-3 text-[14px] font-bold outline-none focus:border-[#F9C105] ${isDark ? 'border-slate-700 bg-slate-950 text-white [color-scheme:dark]' : 'border-slate-200 bg-white text-slate-900'}`;
  const heading = `mb-3 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`;

  return (
    <div className={`min-h-screen max-w-lg mx-auto pb-16 font-sans ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <header className={`sticky top-0 z-20 flex items-center gap-3 border-b px-5 pt-10 pb-4 ${card}`}>
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className={`flex h-9 w-9 items-center justify-center rounded-[12px] border ${tile}`}>
          <ArrowLeft size={18} className={strong} />
        </button>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.26em] text-slate-400">Vehicle and driver</p>
          <h1 className={`text-[19px] font-black leading-tight ${strong}`}>Rental With Driver</h1>
        </div>
      </header>

      <div className="space-y-4 px-5 pt-4">
        <section className={`rounded-[20px] border p-4 ${card}`}>
          <p className={heading}>1. How long</p>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.hours}
                type="button"
                aria-pressed={hours === d.hours}
                onClick={() => setHours(d.hours)}
                className={`rounded-[14px] border-2 py-3 text-[13px] font-black ${hours === d.hours ? 'border-[#111111] bg-[#F9C105] text-[#111111]' : `${tile} ${strong}`}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <section className={`rounded-[20px] border p-4 ${card}`}>
          <p className={heading}>2. Vehicle</p>
          {loading ? (
            <Loader2 className="mx-auto my-8 animate-spin text-slate-400" />
          ) : options.length === 0 ? (
            <div className={`py-6 text-center text-sm font-bold ${muted}`}>
              <Truck className="mx-auto mb-2" /> No vehicles for this duration.
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((v) => {
                const p = packageOf(v, hours);
                const active = v.id === vehicleId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setVehicleId(v.id)}
                    className={`flex w-full items-center gap-3 rounded-[16px] border-2 p-2.5 text-left ${active ? 'border-[#F9C105] bg-[#F9C105]/15' : tile}`}
                  >
                    <img src={v.image} alt="" className="h-14 w-20 shrink-0 rounded-[10px] bg-white object-contain" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14px] font-black ${strong}`}>{v.name}</span>
                      <span className={`block text-[11px] font-semibold ${muted}`}>{v.short_description}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={`block text-[17px] font-black ${strong}`}>{rupees(p.price)}</span>
                      <span className={`block text-[11px] font-bold ${muted}`}>up to {p.includedKm} km</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className={`space-y-3 rounded-[20px] border p-4 ${card}`}>
          <p className={heading}>3. Pickup</p>
          <label className={`block text-[12px] font-bold ${muted}`}>
            Full address
            <textarea className={`${field} mt-1.5 min-h-[80px]`} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House or shop, street, area, city" />
          </label>
          <label className={`block text-[12px] font-bold ${muted}`}>
            Date and time
            <input type="datetime-local" className={`${field} mt-1.5`} value={pickupAt} min={localInput(new Date())} onChange={(e) => setPickupAt(e.target.value)} />
          </label>
          <label className={`block text-[12px] font-bold ${muted}`}>
            Notes (optional)
            <input className={`${field} mt-1.5`} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Goods, stops, contact person" />
          </label>
        </section>

        {error && <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-700">{error}</p>}
        {success && <p role="status" className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">{success}</p>}

        <button
          type="button"
          disabled={!canBook}
          onClick={book}
          className="flex w-full items-center justify-between rounded-[18px] border-2 border-[#111111] bg-[#F9C105] px-5 py-4 text-[#111111] disabled:opacity-40"
        >
          <span className="text-[15px] font-black uppercase tracking-wide">{busy === 'book' ? 'Sending…' : 'Book now'}</span>
          <span className="text-[17px] font-black">{pkg ? rupees(pkg.price) : ''}</span>
        </button>

        {bookings.length > 0 && (
          <section className="pt-2">
            <p className={heading}>Your bookings</p>
            <div className="space-y-2">
              {bookings.map((b) => {
                const [label, cls] = STATUS[b.status] || STATUS.pending;
                return (
                  <article key={b._id} className={`space-y-1 rounded-[18px] border p-4 ${card}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-[15px] font-black ${strong}`}>{b.vehicleName}</p>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-black ${cls}`}>{label}</span>
                    </div>
                    <p className={`text-[12px] font-semibold ${muted}`}>
                      {b.reference} · {b.package.durationHours} hr, {b.package.includedKm} km · {rupees(b.package.price)}
                    </p>
                    <p className={`text-[12px] font-semibold ${muted}`}>{when(b.pickupAt)} · {b.pickupAddress}</p>
                    {b.status === 'confirmed' && (
                      <a href={`tel:${b.driver.phone}`} className={`flex items-center gap-2 pt-1 text-[13px] font-black ${strong}`}>
                        <Phone size={14} /> {b.driver.name} {b.driver.phone} {b.driver.vehicleNumber}
                      </a>
                    )}
                    {b.status === 'cancelled' && b.cancelReason && <p className="text-[12px] font-semibold text-rose-600">{b.cancelReason}</p>}
                    {['pending', 'confirmed'].includes(b.status) &&
                      (confirmCancel === b._id ? (
                        <div className="flex gap-4 pt-1 text-[12px] font-black">
                          <button type="button" disabled={busy === b._id} onClick={() => cancel(b._id)} className="text-rose-600">Yes, cancel booking</button>
                          <button type="button" onClick={() => setConfirmCancel('')} className={strong}>Keep it</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmCancel(b._id)} className="pt-1 text-[12px] font-black text-rose-600">Cancel</button>
                      ))}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DriverRental;
