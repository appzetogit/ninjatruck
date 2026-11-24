import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import { RentalVehicleType } from '../../admin/models/RentalVehicleType.js';
import { DRIVER_RENTAL_STATUSES, DriverRentalBooking, RENTAL_TYPES } from '../models/DriverRentalBooking.js';
import { deleteLicence, readLicence, saveLicence } from './licenceStore.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 60;
const MAX_OPEN_BOOKINGS = 5;
const CANCELLABLE = ['pending', 'confirmed'];

const text = (value) => String(value ?? '').trim();
const requireId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid booking id');
};
// The licence file name stays on the server.
const view = ({ licenceFile, ...booking }) => ({
  ...booking,
  rentalType: booking.rentalType || 'with_driver',
  hasLicence: Boolean(licenceFile),
});

export const createBooking = async (userId, payload = {}) => {
  const rentalType = RENTAL_TYPES.includes(payload.rentalType) ? payload.rentalType : 'with_driver';
  const selfDrive = rentalType === 'self_drive';

  if (!mongoose.isValidObjectId(payload.vehicleTypeId)) throw new ApiError(400, 'Choose a vehicle');
  const vehicle = await RentalVehicleType.findOne({
    _id: payload.vehicleTypeId,
    active: true,
    status: 'active',
  }).lean();
  if (!vehicle || (selfDrive && !vehicle.selfDriveEnabled)) throw new ApiError(404, 'This vehicle is not available');

  // Price always comes from the catalogue, never from the request.
  const list = (selfDrive ? vehicle.selfDrivePricing : vehicle.pricing) || [];
  const pkg = list.find((p) => p.id === text(payload.packageId) && p.active !== false);
  if (!pkg || !(pkg.price > 0)) throw new ApiError(400, 'Choose a package');

  const pickupAddress = text(payload.pickupAddress);
  if (pickupAddress.length < 8) throw new ApiError(400, 'Enter the full address');
  if (pickupAddress.length > 300) throw new ApiError(400, 'Address is too long');
  const notes = text(payload.notes);
  if (notes.length > 500) throw new ApiError(400, 'Notes are too long');

  const pickupAt = new Date(payload.pickupAt);
  const ahead = pickupAt.getTime() - Date.now();
  if (Number.isNaN(ahead)) throw new ApiError(400, 'Choose a date and time');
  if (ahead <= 0) throw new ApiError(400, 'Time must be in the future');
  if (ahead > MAX_DAYS_AHEAD * DAY_MS) throw new ApiError(400, `Book up to ${MAX_DAYS_AHEAD} days ahead`);

  const open = await DriverRentalBooking.countDocuments({ userId, status: { $in: [...CANCELLABLE, 'active'] } });
  if (open >= MAX_OPEN_BOOKINGS) {
    throw new ApiError(409, 'You already have several open bookings. Please call us for more.');
  }

  const licenceFile = selfDrive ? await saveLicence(payload.licence) : '';
  try {
    const booking = await DriverRentalBooking.create({
      reference: `R${selfDrive ? 'S' : 'D'}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      rentalType,
      userId,
      vehicleTypeId: vehicle._id,
      vehicleName: vehicle.name,
      vehicleImage: vehicle.image || '',
      package: {
        id: pkg.id,
        label: pkg.label,
        durationHours: pkg.durationHours,
        includedKm: pkg.includedKm,
        price: pkg.price,
      },
      pickupAddress,
      pickupAt,
      notes,
      licenceFile,
    });
    return view(booking.toObject());
  } catch (error) {
    await deleteLicence(licenceFile);
    if (error?.code === 11000) throw new ApiError(409, 'You already booked this vehicle for that time');
    throw error;
  }
};

export const listMyBookings = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 50));
  const [rows, total] = await Promise.all([
    DriverRentalBooking.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DriverRentalBooking.countDocuments({ userId }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    results: rows.map(view),
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
};

// Returns the booking as it was before the update, for the licence file name.
const cancel = async (filter, set) => {
  const before = await DriverRentalBooking.findOneAndUpdate(
    { ...filter, status: { $in: CANCELLABLE } },
    { $set: { ...set, status: 'cancelled', licenceFile: '' } },
    { returnDocument: 'before' },
  ).lean();
  if (!before) return null;
  await deleteLicence(before.licenceFile);
  return DriverRentalBooking.findById(before._id).populate('userId', 'name phone').lean();
};

export const cancelMyBooking = async (userId, id) => {
  requireId(id);
  const booking = await cancel({ _id: id, userId }, { cancelledBy: 'customer' });
  if (!booking) throw new ApiError(409, 'This booking can no longer be cancelled');
  return view(booking);
};

export const listBookings = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const type = RENTAL_TYPES.includes(query.rentalType) ? { rentalType: query.rentalType } : {};
  const filter = DRIVER_RENTAL_STATUSES.includes(query.status) ? { ...type, status: query.status } : type;

  const [rows, total, counts] = await Promise.all([
    DriverRentalBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name phone')
      .lean(),
    DriverRentalBooking.countDocuments(filter),
    DriverRentalBooking.aggregate([{ $match: type }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const summary = Object.fromEntries(DRIVER_RENTAL_STATUSES.map((s) => [s, 0]));
  counts.forEach((c) => { summary[c._id] = c.count; });

  return {
    results: rows.map(view),
    summary,
    paginator: { current_page: page, per_page: limit, total, last_page: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const getLicenceImage = async (id) => {
  requireId(id);
  const booking = await DriverRentalBooking.findById(id).select('licenceFile').lean();
  const buffer = await readLicence(booking?.licenceFile);
  return { image: `data:image/jpeg;base64,${buffer.toString('base64')}` };
};

/**
 * confirm:  with driver needs driver name + phone; self drive needs the
 *           vehicle number. Confirming again changes them.
 * start:    self drive only, vehicle handed over.
 * complete: with driver after confirm; self drive after the vehicle is back.
 * cancel:   before the vehicle goes out.
 */
export const processBooking = async (id, payload = {}) => {
  requireId(id);
  const current = await DriverRentalBooking.findById(id).select('rentalType').lean();
  if (!current) throw new ApiError(404, 'Booking not found');
  const selfDrive = current.rentalType === 'self_drive';
  const action = text(payload.action);
  const stale = new ApiError(409, 'This booking has changed. Refresh and try again.');

  if (action === 'cancel') {
    const cancelled = await cancel({ _id: id }, { cancelledBy: 'admin', cancelReason: text(payload.reason).slice(0, 300) });
    if (!cancelled) throw stale;
    return view(cancelled);
  }

  let from;
  let set;
  if (action === 'confirm') {
    const vehicleNumber = text(payload.vehicleNumber).toUpperCase().slice(0, 20);
    let driver = { name: '', phone: '', vehicleNumber };
    if (selfDrive) {
      if (!vehicleNumber) throw new ApiError(400, 'Enter the vehicle number');
    } else {
      const name = text(payload.driverName).slice(0, 80);
      const phone = text(payload.driverPhone).replace(/[\s-]/g, '');
      if (!name) throw new ApiError(400, 'Enter the driver name');
      if (!/^\+?\d{10,13}$/.test(phone)) throw new ApiError(400, 'Enter a valid driver phone number');
      driver = { name, phone, vehicleNumber };
    }
    from = CANCELLABLE;
    set = { status: 'confirmed', driver };
  } else if (action === 'start' && selfDrive) {
    from = ['confirmed'];
    set = { status: 'active' };
  } else if (action === 'complete') {
    from = [selfDrive ? 'active' : 'confirmed'];
    set = { status: 'completed' };
  } else {
    throw new ApiError(400, 'That action is not available');
  }

  // The status check is part of the update, so an admin cannot confirm a
  // booking the customer cancelled a moment earlier.
  const booking = await DriverRentalBooking.findOneAndUpdate(
    { _id: id, status: { $in: from } },
    { $set: set },
    { returnDocument: 'after' },
  ).populate('userId', 'name phone').lean();
  if (!booking) throw stale;
  return view(booking);
};
