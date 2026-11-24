import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import { RentalVehicleType } from '../../admin/models/RentalVehicleType.js';
import { DRIVER_RENTAL_STATUSES, DriverRentalBooking } from '../models/DriverRentalBooking.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 60;
const MAX_OPEN_BOOKINGS = 5;
const OPEN = ['pending', 'confirmed'];

const text = (value) => String(value ?? '').trim();
const requireId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid booking id');
};

export const createBooking = async (userId, payload = {}) => {
  if (!mongoose.isValidObjectId(payload.vehicleTypeId)) throw new ApiError(400, 'Choose a vehicle');
  const vehicle = await RentalVehicleType.findOne({
    _id: payload.vehicleTypeId,
    active: true,
    status: 'active',
  }).lean();
  if (!vehicle) throw new ApiError(404, 'This vehicle is not available');

  // Price always comes from the catalogue, never from the request.
  const pkg = (vehicle.pricing || []).find((p) => p.id === text(payload.packageId) && p.active !== false);
  if (!pkg || !(pkg.price > 0)) throw new ApiError(400, 'Choose a package');

  const pickupAddress = text(payload.pickupAddress);
  if (pickupAddress.length < 8) throw new ApiError(400, 'Enter the full pickup address');
  if (pickupAddress.length > 300) throw new ApiError(400, 'Pickup address is too long');
  const notes = text(payload.notes);
  if (notes.length > 500) throw new ApiError(400, 'Notes are too long');

  const pickupAt = new Date(payload.pickupAt);
  const ahead = pickupAt.getTime() - Date.now();
  if (Number.isNaN(ahead)) throw new ApiError(400, 'Choose a pickup date and time');
  if (ahead <= 0) throw new ApiError(400, 'Pickup time must be in the future');
  if (ahead > MAX_DAYS_AHEAD * DAY_MS) throw new ApiError(400, `Book up to ${MAX_DAYS_AHEAD} days ahead`);

  if ((await DriverRentalBooking.countDocuments({ userId, status: { $in: OPEN } })) >= MAX_OPEN_BOOKINGS) {
    throw new ApiError(409, 'You already have several open bookings. Please call us for more.');
  }

  try {
    const booking = await DriverRentalBooking.create({
      reference: `RD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
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
    });
    return booking.toObject();
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, 'You already booked this vehicle for that time');
    throw error;
  }
};

export const listMyBookings = (userId) =>
  DriverRentalBooking.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

export const cancelMyBooking = async (userId, id) => {
  requireId(id);
  const booking = await DriverRentalBooking.findOneAndUpdate(
    { _id: id, userId, status: { $in: OPEN } },
    { $set: { status: 'cancelled', cancelledBy: 'customer' } },
    { returnDocument: 'after' },
  ).lean();
  if (!booking) throw new ApiError(409, 'This booking can no longer be cancelled');
  return booking;
};

export const listBookings = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const filter = DRIVER_RENTAL_STATUSES.includes(query.status) ? { status: query.status } : {};

  const [results, total, counts] = await Promise.all([
    DriverRentalBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name phone')
      .lean(),
    DriverRentalBooking.countDocuments(filter),
    DriverRentalBooking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const summary = Object.fromEntries(DRIVER_RENTAL_STATUSES.map((s) => [s, 0]));
  counts.forEach((c) => { summary[c._id] = c.count; });

  return {
    results,
    summary,
    paginator: { current_page: page, per_page: limit, total, last_page: Math.max(1, Math.ceil(total / limit)) },
  };
};

/** action: confirm (needs driver name + phone) | complete | cancel. */
export const processBooking = async (id, payload = {}) => {
  requireId(id);
  const action = text(payload.action);
  let from;
  let set;

  if (action === 'confirm') {
    const name = text(payload.driverName);
    const phone = text(payload.driverPhone).replace(/[\s-]/g, '');
    if (!name) throw new ApiError(400, 'Enter the driver name');
    if (!/^\+?\d{10,13}$/.test(phone)) throw new ApiError(400, 'Enter a valid driver phone number');
    from = OPEN; // confirming again changes the driver
    set = { status: 'confirmed', driver: { name, phone, vehicleNumber: text(payload.vehicleNumber).toUpperCase() } };
  } else if (action === 'complete') {
    from = ['confirmed'];
    set = { status: 'completed' };
  } else if (action === 'cancel') {
    from = OPEN;
    set = { status: 'cancelled', cancelledBy: 'admin', cancelReason: text(payload.reason).slice(0, 300) };
  } else {
    throw new ApiError(400, 'Action must be confirm, complete or cancel');
  }

  // The status check is part of the update, so an admin cannot confirm a
  // booking the customer cancelled a moment earlier.
  const booking = await DriverRentalBooking.findOneAndUpdate(
    { _id: id, status: { $in: from } },
    { $set: set },
    { returnDocument: 'after' },
  ).populate('userId', 'name phone').lean();
  if (!booking) throw new ApiError(409, 'This booking has changed. Refresh and try again.');
  return booking;
};
