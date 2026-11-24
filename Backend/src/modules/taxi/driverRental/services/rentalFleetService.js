import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import { uploadDataUrl } from '../../../../utils/fileUpload.js';
import { RentalVehicleType } from '../../admin/models/RentalVehicleType.js';

/** Rental vehicles with one price list per rental type. */
const HOURS = [1, 6, 12];
const LABELS = { 1: 'Hourly', 6: '6 Hours', 12: '12 Hours' };
const CATEGORIES = ['Bike', 'Auto', 'Truck'];

const serialize = (v) => ({
  id: String(v._id),
  name: v.name,
  short_description: v.short_description || '',
  vehicleCategory: v.vehicleCategory || 'Truck',
  image: v.image || '',
  active: v.active !== false && v.status === 'active',
  pricing: v.pricing || [],
  selfDriveEnabled: Boolean(v.selfDriveEnabled),
  selfDrivePricing: v.selfDrivePricing || [],
});

export const listFleet = async () =>
  (await RentalVehicleType.find().sort({ createdAt: 1 }).lean()).map(serialize);

// Accepts [{ durationHours, price, includedKm, extraHourPrice, extraKmPrice }];
// a duration with no price is left out, so it is not offered.
const priceList = (rows, prefix) => {
  const list = [];
  for (const hours of HOURS) {
    const row = (Array.isArray(rows) ? rows : []).find((r) => Number(r?.durationHours) === hours);
    if (!row || row.price === '' || row.price === null || row.price === undefined) continue;
    const numbers = {};
    for (const key of ['price', 'includedKm', 'extraHourPrice', 'extraKmPrice']) {
      const n = Number(row[key] || 0);
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new ApiError(400, `Invalid ${key} for ${LABELS[hours]}`);
      numbers[key] = n;
    }
    if (numbers.price < 1) throw new ApiError(400, `Enter a price for ${LABELS[hours]}`);
    list.push({ id: `${prefix}-${hours}h`, label: LABELS[hours], durationHours: hours, active: true, ...numbers });
  }
  return list;
};

export const saveFleetVehicle = async (id, payload = {}) => {
  if (id && !mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid vehicle id');
  const name = String(payload.name || '').trim().slice(0, 80);
  if (!name) throw new ApiError(400, 'Enter the vehicle name');
  const pricing = priceList(payload.pricing, 'driver');
  const selfDrivePricing = priceList(payload.selfDrivePricing, 'self');
  const selfDriveEnabled = Boolean(payload.selfDriveEnabled);
  const active = Boolean(payload.active);
  if (selfDriveEnabled && !selfDrivePricing.length) throw new ApiError(400, 'Add a without-driver price before turning it on');
  if (active && !pricing.length && !selfDriveEnabled) throw new ApiError(400, 'Add a price before turning this vehicle on');

  const set = {
    name,
    short_description: String(payload.short_description || '').trim().slice(0, 160),
    vehicleCategory: CATEGORIES.includes(payload.vehicleCategory) ? payload.vehicleCategory : 'Truck',
    pricing,
    selfDriveEnabled,
    selfDrivePricing,
    active,
    status: active ? 'active' : 'inactive',
  };
  if (payload.photo) {
    const upload = await uploadDataUrl({ dataUrl: payload.photo, folder: 'rental-fleet', publicIdPrefix: 'vehicle' });
    set.image = upload.secureUrl;
    set.coverImage = upload.secureUrl;
  }

  const doc = id
    ? await RentalVehicleType.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after', runValidators: true }).lean()
    : (await RentalVehicleType.create(set)).toObject();
  if (!doc) throw new ApiError(404, 'Vehicle not found');
  return serialize(doc);
};
