import { Router } from 'express';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { hasAdminPermission } from '../../admin/services/adminAccessService.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { enforceAdminReadOnly } from '../../middlewares/adminReadOnlyMiddleware.js';
import * as service from '../services/driverRentalService.js';
import * as fleet from '../services/rentalFleetService.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });

export const driverRentalRouter = Router();

const user = authenticate(['user']);
driverRentalRouter.get('/users/driver-rentals', user, asyncHandler(async (req, res) =>
  ok(res, await service.listMyBookings(req.auth.sub, req.query))));
driverRentalRouter.post('/users/driver-rentals', user, asyncHandler(async (req, res) =>
  ok(res, await service.createBooking(req.auth.sub, req.body), 'Booking sent')));
driverRentalRouter.post('/users/driver-rentals/:id/cancel', user, asyncHandler(async (req, res) =>
  ok(res, await service.cancelMyBooking(req.auth.sub, req.params.id), 'Booking cancelled')));

const requirePermission = (req, _res, next) =>
  next(hasAdminPermission(req.auth?.admin, 'rental.view')
    ? undefined
    : new ApiError(403, 'You do not have permission to access this'));
const admin = [authenticate(['admin']), requirePermission, enforceAdminReadOnly()];
driverRentalRouter.get('/admin/driver-rentals', admin, asyncHandler(async (req, res) =>
  ok(res, await service.listBookings(req.query))));
driverRentalRouter.get('/admin/driver-rentals/:id/licence', admin, asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  ok(res, await service.getLicenceImage(req.params.id));
}));
driverRentalRouter.patch('/admin/driver-rentals/:id', admin, asyncHandler(async (req, res) =>
  ok(res, await service.processBooking(req.params.id, req.body), 'Booking updated')));

driverRentalRouter.get('/admin/rental-fleet', admin, asyncHandler(async (_req, res) =>
  ok(res, { results: await fleet.listFleet() })));
driverRentalRouter.post('/admin/rental-fleet', admin, asyncHandler(async (req, res) =>
  ok(res, await fleet.saveFleetVehicle(null, req.body), 'Vehicle added')));
driverRentalRouter.patch('/admin/rental-fleet/:id', admin, asyncHandler(async (req, res) =>
  ok(res, await fleet.saveFleetVehicle(req.params.id, req.body), 'Vehicle saved')));
