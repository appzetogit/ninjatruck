import mongoose from 'mongoose';

/**
 * Rental with driver: the customer books a vehicle and driver for a fixed
 * package (hours + km). The vehicle comes to the customer, so there is no
 * licence check or pickup store, unlike RentalBookingRequest (self-drive).
 * Price and package are copied at booking time, so later price edits never
 * change an existing booking.
 */
export const DRIVER_RENTAL_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const driverRentalBookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },
    vehicleTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiRentalVehicleType', required: true },
    vehicleName: { type: String, required: true },
    vehicleImage: { type: String, default: '' },
    package: {
      id: { type: String, required: true },
      label: { type: String, default: '' },
      durationHours: { type: Number, required: true },
      includedKm: { type: Number, default: 0 },
      price: { type: Number, required: true, min: 1 },
    },
    pickupAddress: { type: String, required: true, trim: true, maxlength: 300 },
    pickupAt: { type: Date, required: true },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    status: { type: String, enum: DRIVER_RENTAL_STATUSES, default: 'pending', index: true },
    driver: {
      name: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      vehicleNumber: { type: String, default: '', trim: true, uppercase: true },
    },
    cancelledBy: { type: String, enum: ['', 'customer', 'admin'], default: '' },
    cancelReason: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

driverRentalBookingSchema.index({ createdAt: -1 });
// Stops a double tap creating the same booking twice, even when both requests
// arrive together.
driverRentalBookingSchema.index(
  { userId: 1, vehicleTypeId: 1, pickupAt: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } },
);

export const DriverRentalBooking =
  mongoose.models.TaxiDriverRentalBooking ||
  mongoose.model('TaxiDriverRentalBooking', driverRentalBookingSchema);
