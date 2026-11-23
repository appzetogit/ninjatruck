/**
 * Import the Ninja Truck pricing setup - service locations, zones and set
 * prices - exported from the old Ninja Truck admin (ninjatruck.onrender.com).
 *
 *   node scripts/importNinjaTruckPricing.js <export.json>            # dry run
 *   node scripts/importNinjaTruckPricing.js <export.json> --apply    # write
 *
 * The export is the JSON bundle captured from the old admin's API:
 *   { serviceLocations, zones, setPrices (detail records), setPriceList,
 *     rentalPackages, appModules }
 *
 * - Every record keeps its original _id, so a re-run updates instead of
 *   duplicating, and the prices' zone / service-location / vehicle-type links
 *   stay intact (vehicle types come from importNinjaTruckVehicleTypes.js).
 * - Zones: the admin API returns boundaries as [{lat, lng}]; they are stored as
 *   a closed GeoJSON Polygon ([lng, lat]) exactly as the admin's own
 *   normalizeZoneCoordinates does. Circle zones keep centre + radius and use
 *   the exported outline as their polygon.
 * - Set prices: detail fields plus the list's pricing_scope / package fields.
 *   A price whose zone, vehicle type or package type is missing is skipped and
 *   reported, never written half-linked.
 *
 * Refuses to run against a ZI CAB database.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APPLY = process.argv.includes('--apply');
const exportPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME;

if (!exportPath) {
  console.error('Usage: node scripts/importNinjaTruckPricing.js <export.json> [--apply]');
  process.exit(1);
}
if (!MONGO_URI || !MONGO_DB) {
  console.error('MONGODB_URI and MONGODB_DB_NAME must be set in .env');
  process.exit(1);
}
if (/zicab/i.test(MONGO_DB)) {
  console.error(`Refusing to import Ninja Truck pricing into "${MONGO_DB}".`);
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(path.resolve(exportPath), 'utf8'));
const { ObjectId } = mongoose.Types;

const oid = (value) => {
  const raw = value && typeof value === 'object' ? value._id || value.id : value;
  const str = String(raw ?? '').trim();
  return ObjectId.isValid(str) && str.length === 24 ? new ObjectId(str) : null;
};
const date = (value) => (value ? new Date(value) : new Date());
const num = (value, fallback = null) => (Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : fallback);

// Same conversion as adminService.normalizeZoneCoordinates.
const toRing = (points = []) => {
  const ring = (points || [])
    .map((p) => [Number(p?.lng), Number(p?.lat)])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (ring.length < 3) return null;
  const [fLng, fLat] = ring[0];
  const [lLng, lLat] = ring[ring.length - 1];
  if (fLng !== lLng || fLat !== lLat) ring.push([fLng, fLat]);
  return ring.length >= 4 ? ring : null;
};

const serviceLocationDoc = (s) => {
  const lat = num(s.latitude);
  const lng = num(s.longitude);
  return {
    name: s.name || s.service_location_name || '',
    legacy_id: s.legacy_id || '',
    company_key: s.company_key ?? null,
    service_location_name: s.service_location_name || s.name || '',
    address: s.address || '',
    country: s.country || 'India',
    translation_dataset: s.translation_dataset || '',
    currency_name: s.currency_name || 'INR',
    currency_symbol: s.currency_symbol || '₹',
    currency_code: s.currency_code || 'INR',
    timezone: s.timezone || 'Asia/Kolkata',
    currency_pointer: s.currency_pointer || 'ltr',
    unit: s.unit || 'km',
    latitude: lat,
    longitude: lng,
    location:
      s.location?.type === 'Point'
        ? s.location
        : lat !== null && lng !== null
          ? { type: 'Point', coordinates: [lng, lat] }
          : undefined,
    status: s.status || (s.active === false ? 'inactive' : 'active'),
    active: s.active !== false,
    createdAt: date(s.createdAt),
    updatedAt: date(s.updatedAt),
  };
};

const zoneDoc = (z) => {
  const ring = toRing(z.coordinates);
  if (!ring) return null;
  const isCircle = String(z.boundary_mode || '').toLowerCase() === 'circle';
  return {
    name: z.name,
    service_location_id: oid(z.service_location_id),
    unit: z.unit || 'km',
    peak_zone_ride_count: num(z.peak_zone_ride_count),
    peak_zone_radius: num(z.peak_zone_radius),
    peak_zone_selection_duration: num(z.peak_zone_selection_duration),
    peak_zone_duration: num(z.peak_zone_duration),
    peak_zone_surge_percentage: num(z.peak_zone_surge_percentage),
    maximum_distance_for_regular_rides: num(z.maximum_distance_for_regular_rides),
    maximum_distance_for_outstation_rides: num(z.maximum_distance_for_outstation_rides),
    active: z.active !== false,
    status: z.status || (z.active === false ? 'inactive' : 'active'),
    boundary_mode: isCircle ? 'circle' : 'polygon',
    circle_center: isCircle
      ? { lat: num(z.circle_center?.lat), lng: num(z.circle_center?.lng) }
      : { lat: null, lng: null },
    circle_radius_meters: isCircle ? num(z.circle_radius_meters) : null,
    geometry: { type: 'Polygon', coordinates: [ring] },
    createdAt: date(z.createdAt),
    updatedAt: date(z.updatedAt),
  };
};

// Detail fields that are display-only or rebuilt here.
const DROP = new Set(['_id', 'id', '__source_id', 'vehicle_name', 'icon', 'createdAt', 'updatedAt', '__v']);

const setPriceDoc = (detail, row = {}) => {
  const doc = {};
  for (const [k, v] of Object.entries(detail)) if (!DROP.has(k)) doc[k] = v;
  doc.pricing_scope = row.pricing_scope || detail.pricing_scope || 'ride';
  doc.zone_id = oid(detail.zone_id);
  doc.service_location_id = oid(detail.service_location_id);
  doc.vehicle_type = oid(detail.vehicle_type);
  doc.package_type_id = oid(row.package_type_id ?? detail.package_type_id);
  doc.package_destination = row.package_destination ?? detail.package_destination ?? '';
  doc.package_availability = row.package_availability ?? detail.package_availability ?? 'available';
  doc.package_vehicle_prices = (row.package_vehicle_prices || detail.package_vehicle_prices || []).map((p) => {
    const { vehicle_type_name: _name, ...rest } = p || {};
    return { ...rest, vehicle_type: oid(p?.vehicle_type) };
  });
  doc.createdAt = date(detail.createdAt);
  doc.updatedAt = date(detail.updatedAt);
  return doc;
};

const upsert = async (col, _id, doc) => {
  const { createdAt, ...rest } = doc;
  await col.updateOne({ _id }, { $set: rest, $setOnInsert: { createdAt } }, { upsert: true });
};

(async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  const db = mongoose.connection.db;
  const cols = {
    sl: db.collection('taxiservicelocations'),
    zones: db.collection('taxizones'),
    prices: db.collection('taxisetprices'),
    vehicles: db.collection('taxivehicles'),
    packages: db.collection('taxirentalpackagetypes'),
  };
  console.log(`${APPLY ? 'Importing' : 'Dry run'} into ${MONGO_DB}`);

  // 1. Service locations
  let slCount = 0;
  for (const s of bundle.serviceLocations || []) {
    const _id = oid(s._id);
    if (!_id) continue;
    if (APPLY) await upsert(cols.sl, _id, serviceLocationDoc(s));
    slCount += 1;
  }
  console.log(`Service locations: ${slCount}`);

  // 2. Zones
  const zoneIds = new Set();
  const zoneFailures = [];
  for (const z of bundle.zones || []) {
    const _id = oid(z._id || z.id);
    const doc = zoneDoc(z);
    if (!_id || !doc) {
      zoneFailures.push(`${z.name}: no usable boundary`);
      continue;
    }
    try {
      if (APPLY) await upsert(cols.zones, _id, doc);
      zoneIds.add(String(_id));
    } catch (err) {
      // e.g. a self-intersecting polygon the 2dsphere index rejects
      zoneFailures.push(`${z.name}: ${err.message.split('\n')[0].slice(0, 140)}`);
    }
  }
  console.log(`Zones: ${zoneIds.size} ok, ${zoneFailures.length} failed`);
  zoneFailures.forEach((f) => console.log(`  zone skipped - ${f}`));

  // 3. Set prices
  const vehicleIds = new Set((await cols.vehicles.find({}, { projection: { _id: 1 } }).toArray()).map((v) => String(v._id)));
  const packageIds = new Set([
    ...(await cols.packages.find({}, { projection: { _id: 1 } }).toArray()).map((p) => String(p._id)),
  ]);
  const rows = new Map((bundle.setPriceList || []).map((r) => [String(r.id), r]));
  const skipped = [];
  let priceCount = 0;
  for (const detail of bundle.setPrices || []) {
    const sourceId = String(detail.__source_id || detail._id || detail.id);
    const _id = oid(sourceId);
    const doc = setPriceDoc(detail, rows.get(sourceId));
    const label = `${rows.get(sourceId)?.vehicle_type_name || doc.pricing_scope} @ ${rows.get(sourceId)?.zone_name || '-'}`;
    if (!_id) { skipped.push(`${label}: bad id`); continue; }
    if (doc.zone_id && !zoneIds.has(String(doc.zone_id))) { skipped.push(`${label}: zone not imported`); continue; }
    if (doc.pricing_scope !== 'package' && doc.vehicle_type && !vehicleIds.has(String(doc.vehicle_type))) {
      skipped.push(`${label}: vehicle type missing`); continue;
    }
    if (doc.pricing_scope === 'package' && (!doc.package_type_id || !packageIds.has(String(doc.package_type_id)))) {
      skipped.push(`${label} (package "${rows.get(sourceId)?.package_type_name || '?'}"): package type not in this database`);
      continue;
    }
    if (APPLY) await upsert(cols.prices, _id, doc);
    priceCount += 1;
  }
  console.log(`Set prices: ${priceCount} ok, ${skipped.length} skipped`);
  skipped.forEach((s) => console.log(`  price skipped - ${s}`));

  if (!APPLY) console.log('Nothing written. Re-run with --apply.');
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
