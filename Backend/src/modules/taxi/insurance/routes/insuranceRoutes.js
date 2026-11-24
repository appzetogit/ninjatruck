import { Router } from 'express';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { uploadDataUrl } from '../../../../utils/fileUpload.js';
import { hasAdminPermission } from '../../admin/services/adminAccessService.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { enforceAdminReadOnly } from '../../middlewares/adminReadOnlyMiddleware.js';
import * as insuranceService from '../services/insuranceService.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });

// Uploads are stored as '/uploads/...'; the apps need a full URL.
const absoluteUrl = (req, url) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  return `${proto}://${req.get('host')}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const insuranceRouter = Router();

// Public - the customer-app banner and the price list.
insuranceRouter.get('/insurance/settings', asyncHandler(async (req, res) => {
  const settings = await insuranceService.getSettings();
  ok(res, { ...settings, bannerImageUrl: absoluteUrl(req, settings.bannerImageUrl) });
}));
insuranceRouter.get('/insurance/plans', asyncHandler(async (_req, res) =>
  ok(res, await insuranceService.listPlans())));

// Customer
const user = authenticate(['user']);
insuranceRouter.post('/insurance/apply', user, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.applyForInsurance(req.auth.sub, req.body), 'Application submitted')));
insuranceRouter.get('/insurance/my', user, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.listMyApplications(req.auth.sub))));

// Admin (Price Management > Vehicle Insurance)
const requirePermission = (req, _res, next) =>
  next(hasAdminPermission(req.auth?.admin, 'set_prices.view')
    ? undefined
    : new ApiError(403, 'You do not have permission to access this'));
const admin = [authenticate(['admin']), requirePermission, enforceAdminReadOnly()];
insuranceRouter.get('/insurance/admin', admin, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.listApplications(req.query))));
insuranceRouter.get('/insurance/admin/plans', admin, asyncHandler(async (_req, res) =>
  ok(res, await insuranceService.listPlans())));
insuranceRouter.put('/insurance/admin/plans/:vehicleType', admin, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.updatePlan(req.params.vehicleType, req.body?.rates || req.body), 'Rates updated')));
insuranceRouter.get('/insurance/admin/settings', admin, asyncHandler(async (_req, res) =>
  ok(res, await insuranceService.getSettings())));
insuranceRouter.patch('/insurance/admin/settings', admin, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.updateSettings(req.body), 'Settings updated')));
insuranceRouter.post('/insurance/admin/upload-image', admin, asyncHandler(async (req, res) => {
  if (!req.body?.image) throw new ApiError(400, 'Image data is required');
  const result = await uploadDataUrl({ dataUrl: req.body.image, publicIdPrefix: 'insurance-banner' });
  ok(res, { url: result.secureUrl }, 'Image uploaded');
}));
// Last, so it does not swallow /plans and /settings.
insuranceRouter.patch('/insurance/admin/:id', admin, asyncHandler(async (req, res) =>
  ok(res, await insuranceService.processApplication(req.params.id, req.body), 'Application updated')));
