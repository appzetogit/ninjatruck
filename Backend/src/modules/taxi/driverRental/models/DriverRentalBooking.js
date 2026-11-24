import mongoose from 'mongoose';

/**
 * Rentals, with or without a driver, for a fixed package (hours + km). The
 * vehicle comes to the customer's address, so there are no stores or service
 * locations. Price and package are copied at booking time, so later price
 * edits never change an existing booking.
 *
 * with_driver: pending -> confirmed -> completed
 * self_drive:  pending -> confirmed -> active (vehicle out) -> completed
 */
export const RENTAL_TYPES = ['with_driver', 'self_drive'];
export const DRIVER_RENTAL_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

const driverRentalBookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    rentalType: { type: String, enum: RENTAL_TYPES, default: 'with_driver', index: true },
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
    // File name inside the private licence folder; never sent to clients.
    licenceFile: { type: String, default: '' },
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
