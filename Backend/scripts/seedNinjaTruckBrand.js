/**
 * Seed the Ninja Truck branding into this backend's database.
 *
 *   node scripts/seedNinjaTruckBrand.js
 *
 * - Business settings: app name, footer lines, contact numbers, logo, favicon,
 *   landing theme colour.
 * - Landing content: replaced with the Ninja Truck defaults from
 *   src/modules/taxi/admin/data/defaultLandingContent.js. The legal documents
 *   (terms, privacy, refund...) are kept, with the old brand names swapped.
 *
 * Safe to re-run. Refuses to run against the ZI CAB database.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLandingContent } from '../src/modules/taxi/admin/data/defaultLandingContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME;

if (!MONGO_URI || !MONGO_DB) {
  console.error('MONGODB_URI and MONGODB_DB_NAME must be set in .env');
  process.exit(1);
}
if (/zicab/i.test(MONGO_DB)) {
  console.error(`Refusing to seed Ninja Truck branding into "${MONGO_DB}".`);
  process.exit(1);
}

const BRAND = {
  app_name: 'Ninja Truck — All Over India Logistics',
  contact_phone_1: '8942852470',
  contact_booking_number: '8942852470',
  footer_1: `${new Date().getFullYear()} © Ninja Truck Logistics.`,
  footer_2: 'No Highway Is Too Long.',
  logo: '/ninjatruck-logo.svg',
  favicon: '/ninjatruck-favicon.svg',
};

const rebrandText = (value) =>
  JSON.parse(
    JSON.stringify(value ?? {})
      .replace(/Zicab Group Private Limited/gi, 'Ninja Truck Logistics')
      .replace(/ZI CAB Technologies Pvt Ltd/gi, 'Ninja Truck Logistics')
      .replace(/support@zicab\.in/gi, 'support@ninjatruck.in')
      .replace(/(https?:\/\/)?(www\.)?zicab\.in/gi, 'https://ninjatruck.live')
      .replace(/ZI ?CAB|Zicab/g, 'Ninja Truck'),
  );

(async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  const db = mongoose.connection.db;
  console.log(`Connected to ${MONGO_DB}`);

  const set = Object.fromEntries(Object.entries(BRAND).map(([k, v]) => [`general.${k}`, v]));
  set['customization.landing_theme_color'] = '#F9C105';
  const settings = await db
    .collection('taxiadminbusinesssettings')
    .updateOne({ scope: 'default' }, { $set: set }, { upsert: true });
  console.log('Business settings:', settings.modifiedCount || settings.upsertedCount ? 'updated' : 'unchanged');

  const landing = db.collection('taxilandingcontents');
  const existing = await landing.findOne({ scope: 'default' });
  await landing.replaceOne(
    { scope: 'default' },
    {
      scope: 'default',
      ...defaultLandingContent,
      legal: rebrandText(existing?.legal),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    },
    { upsert: true },
  );
  console.log('Landing content: replaced with Ninja Truck defaults');

  // App modules copied from ZI CAB carry its "Zi " product prefix
  // ("Zi Parcel", "Zi Outstation"); the apps show these names.
  const modules = db.collection('taxiappmodules');
  let renamed = 0;
  for await (const m of modules.find({ name: /^Zi\s+/i })) {
    await modules.updateOne({ _id: m._id }, { $set: { name: m.name.replace(/^Zi\s+/i, '') } });
    renamed += 1;
  }
  console.log(`App modules: ${renamed} renamed`);

  await mongoose.disconnect();
  console.log('Done. Restart the backend so its 60s content cache is dropped.');
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
