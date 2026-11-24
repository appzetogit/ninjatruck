import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2, Plus } from 'lucide-react';
import { adminService } from '../../services/adminService';

/** Rental vehicles: name, photo, on/off, and prices with and without driver. */
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? {};
const HOURS = [1, 6, 12];
const COLUMNS = [
  ['price', 'Price ₹'],
  ['includedKm', 'Km included'],
  ['extraHourPrice', 'Extra hour ₹'],
  ['extraKmPrice', 'Extra km ₹'],
];
const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#111111]';
const primary = 'inline-flex items-center gap-2 rounded-lg bg-[#111111] px-4 py-2 text-sm font-bold text-[#F9C105] disabled:opacity-50';
const ghost = 'rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700';

const rowsFrom = (list = []) =>
  HOURS.map((hours) => {
    const found = list.find((p) => Number(p.durationHours) === hours) || {};
    return {
      durationHours: hours,
      price: found.price ?? '',
      includedKm: found.includedKm ?? '',
      extraHourPrice: found.extraHourPrice ?? 0,
      extraKmPrice: found.extraKmPrice ?? 0,
    };
  });
const readPhoto = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PriceTable = ({ rows, onChange }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] text-left text-sm">
      <thead className="text-xs text-gray-500">
        <tr><th className="py-1 pr-2">Hours</th>{COLUMNS.map(([k, l]) => <th key={k} className="py-1 pr-2">{l}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.durationHours}>
            <td className="py-1 pr-2 font-bold text-gray-800">{row.durationHours}</td>
            {COLUMNS.map(([key, label]) => (
              <td key={key} className="py-1 pr-2">
                <input
                  type="number"
                  min="0"
                  aria-label={`${row.durationHours} hours ${label}`}
                  className={input}
                  value={row[key]}
                  onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)))}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const VehicleForm = ({ vehicle, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    short_description: vehicle?.short_description || '',
    vehicleCategory: vehicle?.vehicleCategory || 'Truck',
    active: vehicle ? vehicle.active : true,
    pricing: rowsFrom(vehicle?.pricing),
    selfDriveEnabled: Boolean(vehicle?.selfDriveEnabled),
    selfDrivePricing: rowsFrom(vehicle?.selfDrivePricing),
    photo: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveRentalFleetVehicle(vehicle?.id, form);
      toast.success('Vehicle saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not save');
      setSaving(false);
      return;
    }
    onSaved();
  };

  const pickPhoto = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Photo must be under 8 MB');
      return;
    }
    set('photo', await readPhoto(file));
  };

  const photo = form.photo || vehicle?.image;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-auto rounded-2xl bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</h3>
        <div className="flex gap-4">
          <label className="flex h-28 w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300">
            {photo ? <img src={photo} alt="Vehicle" className="h-full w-full object-contain" /> : <ImagePlus className="text-gray-400" />}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          <div className="flex-1 space-y-2">
            <input className={input} placeholder="Name" required maxLength={80} value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input className={input} placeholder="Short line, e.g. up to 750 kg" maxLength={160} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} />
            <div className="flex items-center gap-4">
              <select className={`${input} max-w-[130px]`} aria-label="Type" value={form.vehicleCategory} onChange={(e) => set('vehicleCategory', e.target.value)}>
                {['Bike', 'Auto', 'Truck'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Available to customers
              </label>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-bold text-gray-900">With driver</p>
          <PriceTable rows={form.pricing} onChange={(rows) => set('pricing', rows)} />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
            <input type="checkbox" checked={form.selfDriveEnabled} onChange={(e) => set('selfDriveEnabled', e.target.checked)} /> Without driver
          </label>
          <PriceTable rows={form.selfDrivePricing} onChange={(rows) => set('selfDrivePricing', rows)} />
        </div>
        <p className="text-xs text-gray-500">Leave a price empty to not offer that duration. Extra charges are for your reference; the app does not collect them.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className={ghost} onClick={onClose}>Back</button>
          <button type="submit" className={primary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

const summary = (list = []) => list.map((p) => `${p.durationHours}h ₹${p.price}`).join(' · ') || 'No prices';

const RentalFleet = () => {
  const [vehicles, setVehicles] = useState([]);
  const [state, setState] = useState('loading');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = unwrap(await adminService.getRentalFleet()).results;
      setVehicles(Array.isArray(list) ? list : []);
      setState('ready');
    } catch {
      setState('failed');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="nt-dash min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Rental Vehicles & Prices</h1>
          <button type="button" className={primary} onClick={() => setEditing({})}><Plus size={15} /> Add vehicle</button>
        </div>
        {state === 'loading' && <Loader2 className="mx-auto animate-spin text-gray-400" />}
        {state === 'failed' && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not load vehicles. Refresh the page to try again.</p>}
        {vehicles.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <img src={v.image} alt="" className="h-16 w-24 object-contain" />
            <div className="min-w-[220px] flex-1 text-sm text-gray-600">
              <p className="text-base font-bold text-gray-900">{v.name} {!v.active && <span className="text-xs font-bold text-rose-600">Off</span>}</p>
              <p>With driver: {summary(v.pricing)}</p>
              <p>Without driver: {v.selfDriveEnabled ? summary(v.selfDrivePricing) : 'Off'}</p>
            </div>
            <button type="button" className={ghost} onClick={() => setEditing(v)}>Edit</button>
          </div>
        ))}
      </div>
      {editing && (
        <VehicleForm
          vehicle={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

export default RentalFleet;
