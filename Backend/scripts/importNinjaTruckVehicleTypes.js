/**
 * Import the Ninja Truck vehicle types (exported from the old Ninja Truck admin
 * at ninjatruck.onrender.com) into this backend's database.
 *
 *   node scripts/importNinjaTruckVehicleTypes.js            # dry run
 *   node scripts/importNinjaTruckVehicleTypes.js --apply    # write
 *
 * Source: scripts/data/ninjatruck-vehicle-types.json (25 types).
 *
 * - Keeps each type's original _id, so re-running updates instead of duplicating.
 * - The old admin used per-size delivery categories (pickup8ft ... pickup14ft,
 *   tataace, 3wheeler). This app's parcel flow groups vehicles into
 *   trucks / 2wheeler / movers, so those map to "trucks"; the original value is
 *   kept in `source_delivery_category` for reference.
 * - `size` gets the deck dimensions ("10ft × 5.9ft × 3ft") from the size line.
 * - Images keep their /uploads/... paths; copy the files into Backend/uploads
 *   at the same paths (done separately on the server).
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
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME;

if (!MONGO_URI || !MONGO_DB) {
  console.error('MONGODB_URI and MONGODB_DB_NAME must be set in .env');
  process.exit(1);
}
if (/zicab/i.test(MONGO_DB)) {
  console.error(`Refusing to import Ninja Truck vehicles into "${MONGO_DB}".`);
  process.exit(1);
}

const { vehicles } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'data/ninjatruck-vehicle-types.json'), 'utf8'),
);

const CATEGORY_MAP = {
  pickup8ft: 'trucks',
  pickup9ft: 'trucks',
  pickup10ft: 'trucks',
  pickup12ft: 'trucks',
  pickup14ft: 'trucks',
  tataace: 'trucks',
  '3wheeler': 'trucks',
  trucks: 'trucks',
  '2wheeler': '2wheeler',
  movers: 'movers',
  '': '',
};

// "2000 kgs • 10ft × 5.9ft × 3ft" -> "10ft × 5.9ft × 3ft"
const sizeFrom = (line = '') => {
  const parts = String(line).split('•');
  return parts.length > 1 ? parts.slice(1).join('•').trim() : '';
};

const toDoc = (v) => {
  const sourceCategory = String(v.delivery_category || '').trim();
  const isDelivery = ['delivery', 'both'].includes(v.transport_type);
  return {
    name: v.name,
    short_description: v.short_description || '',
    description: v.description || '',
    transport_type: v.transport_type,
    is_taxi: v.transport_type,
    dispatch_type: v.dispatch_type || 'normal',
    icon_types: v.icon_types || 'truck',
    capacity: Number(v.capacity || 0),
    size: sizeFrom(v.short_description),
    delivery_category: isDelivery ? (CATEGORY_MAP[sourceCategory] ?? 'trucks') : '',
    source_delivery_category: sourceCategory,
    delivery_distance_pricing: {
      enabled: Boolean(v.delivery_distance_pricing?.enabled),
      base_price: Number(v.delivery_distance_pricing?.base_price || 0),
      free_distance: Number(v.delivery_distance_pricing?.free_distance || 0),
      distance_price: Number(v.delivery_distance_pricing?.distance_price || 0),
      free_time: Number(v.delivery_distance_pricing?.free_time || 0),
      time_price: Number(v.delivery_distance_pricing?.time_price || 0),
    },
    image: v.image || '',
    icon: v.image || '',
    map_icon: v.map_icon || v.image || '',
    status: Number(v.status) === 1 ? 1 : 0,
    active: Boolean(v.active),
  };
};

(async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  const col = mongoose.connection.db.collection('taxivehicles');
  console.log(`${APPLY ? 'Importing' : 'Dry run'}: ${vehicles.length} vehicle types into ${MONGO_DB}.taxivehicles`);

  let inserted = 0;
  let updated = 0;
  for (const v of vehicles) {
    const _id = new mongoose.Types.ObjectId(String(v._id));
    const doc = toDoc(v);
    const exists = await col.findOne({ _id }, { projection: { _id: 1 } });
    console.log(
      `  ${exists ? 'update' : 'insert'}  ${doc.name.padEnd(24)} ${doc.transport_type.padEnd(8)} ` +
        `${(doc.delivery_category || '-').padEnd(9)} ${doc.size || '-'}  ${doc.active ? 'active' : 'inactive'}`,
    );
    if (!APPLY) continue;
    const now = new Date();
    await col.updateOne(
      { _id },
      { $set: { ...doc, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    exists ? (updated += 1) : (inserted += 1);
  }

  if (APPLY) console.log(`Done: ${inserted} inserted, ${updated} updated.`);
  else console.log('Nothing written. Re-run with --apply.');
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
