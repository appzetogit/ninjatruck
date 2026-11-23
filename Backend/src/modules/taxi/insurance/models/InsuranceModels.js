import mongoose from 'mongoose';

/**
 * Vehicle insurance - customers apply to insure their own vehicle; admin
 * approves (issuing a policy) or rejects. Same shape as the old Ninja Truck
 * admin, so its data migrates as-is.
 */

export const INSURANCE_VEHICLE_TYPES = ['bike', 'auto', 'car', 'truck'];
export const INSURANCE_DURATIONS = ['1_month', '6_months', '1_year'];
export const INSURANCE_STATUSES = ['pending', 'active', 'rejected', 'expired'];

// Premium per vehicle class and plan length.
const insurancePlanSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, enum: INSURANCE_VEHICLE_TYPES, required: true, unique: true },
    rates: {
      '1_month': { type: Number, default: 0, min: 0 },
      '6_months': { type: Number, default: 0, min: 0 },
      '1_year': { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

// Single document (scope 'default'): the customer-app banner.
const insuranceSettingSchema = new mongoose.Schema(
  {
    scope: { type: String, default: 'default', unique: true },
    enabled: { type: Boolean, default: false },
    bannerTitle: { type: String, default: 'Vehicle Insurance', trim: true },
    bannerSubtitle: { type: String, default: '', trim: true },
    policyTermsLabel: { type: String, default: '', trim: true },
    bannerImageUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

const insuranceApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
    vehicleType: { type: String, enum: INSURANCE_VEHICLE_TYPES, required: true },
    duration: { type: String, enum: INSURANCE_DURATIONS, required: true },
    premiumAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: INSURANCE_STATUSES, default: 'pending', index: true },
    policyNumber: { type: String, default: '', trim: true },
    provider: { type: String, default: '', trim: true },
    expiresAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '', trim: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

insuranceApplicationSchema.index({ createdAt: -1 });

export const InsurancePlan =
  mongoose.models.TaxiInsurancePlan || mongoose.model('TaxiInsurancePlan', insurancePlanSchema);
export const InsuranceSetting =
  mongoose.models.TaxiInsuranceSetting || mongoose.model('TaxiInsuranceSetting', insuranceSettingSchema);
export const InsuranceApplication =
  mongoose.models.TaxiInsuranceApplication ||
  mongoose.model('TaxiInsuranceApplication', insuranceApplicationSchema);
