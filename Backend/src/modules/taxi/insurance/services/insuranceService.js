import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import {
  INSURANCE_DURATIONS,
  INSURANCE_VEHICLE_TYPES,
  InsuranceApplication,
  InsurancePlan,
  InsuranceSetting,
} from '../models/InsuranceModels.js';

const DURATION_MONTHS = { '1_month': 1, '6_months': 6, '1_year': 12 };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------- settings

export const getSettings = async () => {
  const doc = await InsuranceSetting.findOneAndUpdate(
    { scope: 'default' },
    { $setOnInsert: { scope: 'default' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
};

export const updateSettings = async (payload = {}) => {
  const set = {};
  if (payload.enabled !== undefined) set.enabled = Boolean(payload.enabled);
  for (const key of ['bannerTitle', 'bannerSubtitle', 'policyTermsLabel', 'bannerImageUrl']) {
    if (payload[key] !== undefined) set[key] = String(payload[key] ?? '').trim();
  }
  return InsuranceSetting.findOneAndUpdate(
    { scope: 'default' },
    { $set: set, $setOnInsert: { scope: 'default' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
};

// ---------------------------------------------------------------- plans

/** Every vehicle class, with zero rates for any not configured yet. */
export const listPlans = async () => {
  const plans = await InsurancePlan.find().lean();
  const byType = new Map(plans.map((p) => [p.vehicleType, p]));
  return INSURANCE_VEHICLE_TYPES.map(
    (vehicleType) =>
      byType.get(vehicleType) || { vehicleType, rates: { '1_month': 0, '6_months': 0, '1_year': 0 } },
  );
};

export const updatePlan = async (vehicleType, rates = {}) => {
  if (!INSURANCE_VEHICLE_TYPES.includes(vehicleType)) throw new ApiError(400, 'Unknown vehicle type');
  const set = {};
  for (const duration of INSURANCE_DURATIONS) {
    if (rates[duration] === undefined) continue;
    const amount = Number(rates[duration]);
    if (!Number.isFinite(amount) || amount < 0) throw new ApiError(400, `Invalid premium for ${duration}`);
    set[`rates.${duration}`] = Math.round(amount * 100) / 100;
  }
  return InsurancePlan.findOneAndUpdate(
    { vehicleType },
    { $set: set, $setOnInsert: { vehicleType } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
};

// ---------------------------------------------------------------- applications

export const applyForInsurance = async (userId, payload = {}) => {
  const settings = await getSettings();
  if (!settings.enabled) throw new ApiError(400, 'Vehicle insurance is not available right now');

  const vehicleType = String(payload.vehicleType || '').toLowerCase();
  const duration = String(payload.duration || '');
  const vehicleNumber = String(payload.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();

  if (!INSURANCE_VEHICLE_TYPES.includes(vehicleType)) throw new ApiError(400, 'Choose a vehicle type');
  if (!INSURANCE_DURATIONS.includes(duration)) throw new ApiError(400, 'Choose a plan duration');
  if (!/^[A-Z0-9]{4,15}$/.test(vehicleNumber)) throw new ApiError(400, 'Enter a valid vehicle number');

  const plan = await InsurancePlan.findOne({ vehicleType }).lean();
  const premiumAmount = Number(plan?.rates?.[duration] || 0);
  if (premiumAmount <= 0) throw new ApiError(400, 'This plan is not available yet');

  const open = await InsuranceApplication.findOne({
    userId,
    vehicleNumber,
    status: { $in: ['pending', 'active'] },
  }).lean();
  if (open) throw new ApiError(409, `This vehicle already has a ${open.status} application`);

  const created = await InsuranceApplication.create({
    userId,
    vehicleNumber,
    vehicleType,
    duration,
    premiumAmount,
  });
  return created.toObject();
};

export const listMyApplications = (userId) =>
  InsuranceApplication.find({ userId }).sort({ createdAt: -1 }).lean();

export const listApplications = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const filter = {};

  if (query.status && query.status !== 'all') filter.status = String(query.status);
  if (query.vehicleType && query.vehicleType !== 'all') filter.vehicleType = String(query.vehicleType);

  const search = String(query.search || '').trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const users = await mongoose
      .model('TaxiUser')
      .find({ $or: [{ name: rx }, { phone: rx }, { email: rx }] }, { _id: 1 })
      .limit(200)
      .lean();
    filter.$or = [{ vehicleNumber: rx }, { policyNumber: rx }, { userId: { $in: users.map((u) => u._id) } }];
  }

  const [results, total, counts] = await Promise.all([
    InsuranceApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name phone email')
      .lean(),
    InsuranceApplication.countDocuments(filter),
    InsuranceApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const summary = { pending: 0, active: 0, rejected: 0, expired: 0 };
  counts.forEach((c) => { summary[c._id] = c.count; });

  return {
    results,
    summary,
    paginator: { current_page: page, per_page: limit, total, last_page: Math.max(1, Math.ceil(total / limit)) },
  };
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const newPolicyNumber = () => `POL-${crypto.randomInt(10000000, 99999999)}`;

/** action: 'approve' (issues a policy) or 'reject'. */
export const processApplication = async (id, payload = {}) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid application id');
  const application = await InsuranceApplication.findById(id);
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.status !== 'pending') throw new ApiError(400, `Application is already ${application.status}`);

  const action = String(payload.action || '').toLowerCase();
  const now = new Date();

  if (action === 'approve') {
    application.status = 'active';
    application.provider = String(payload.provider || '').trim();
    application.policyNumber = String(payload.policyNumber || '').trim() || newPolicyNumber();
    application.expiresAt = addMonths(now, DURATION_MONTHS[application.duration] || 1);
  } else if (action === 'reject') {
    application.status = 'rejected';
    application.rejectionReason = String(payload.reason || '').trim();
  } else {
    throw new ApiError(400, 'Action must be approve or reject');
  }

  application.processedAt = now;
  await application.save();
  return InsuranceApplication.findById(application._id).populate('userId', 'name phone email').lean();
};
