/**
 * Seed the Ninja Truck fleet: vehicle photos, "Rental With Driver" prices and
 * the customer-app home cards.
 *
 *   node scripts/seedNinjaTruckFleet.js            # dry run
 *   node scripts/seedNinjaTruckFleet.js --apply    # write
 *
 * Photos are frontend/public/fleet/*.webp, served at /fleet/. Prices are the
 * owner's written list of 2026-11-23. Map icons are left alone. Safe to re-run:
 * it resets the seeded rental prices to this list. Refuses zicab databases.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Vehicle } from '../src/modules/taxi/admin/models/Vehicle.js';
import { RentalVehicleType } from '../src/modules/taxi/admin/models/RentalVehicleType.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });
const APPLY = process.argv.includes('--apply');
const { MONGODB_URI, MONGODB_DB_NAME } = process.env;
if (!MONGODB_URI || !MONGODB_DB_NAME || /zicab/i.test(MONGODB_DB_NAME)) {
  console.error(`Refusing to run against "${MONGODB_DB_NAME || ''}"`);
  process.exit(1);
}
const img = (name) => `/fleet/${name}.webp`;

// Existing vehicle type -> photo.
const PHOTOS = {
  Scooty: 'scooter',
  Scooter: 'scooter',
  '2 Wheeler': 'courier-bike',
  'BIKE PARCEL': 'courier-bike',
  'Three Wheeler': 'mini-ev',
  '3 Wheeler': 'mini-ev',
  '7ft Mini truck': 'tata-ace',
  'Tata Ace': 'tata-ace',
  '8ft Mini truck': 'ninja-van',
  'Mini Truck': 'ninja-van',
  'Pickup 8ft': 'pickup',
  'Pickup 9ft': 'pickup',
  '9ft Pickup': 'pickup',
  '10ft Pickup': 'pickup',
};

// On the photos but not in the catalogue. No fare given, so created inactive:
// an active vehicle without a price could be booked for nothing.
const NEW_VEHICLES = [
  { name: 'Mini EV', photo: 'mini-ev', capacity: 500, size: '2.5ft × 5ft × 3ft' },
  { name: 'Tata 407', photo: 'tata-407', capacity: 2500, size: '9ft × 5.5ft × 6ft' },
];

// name, photo, category, load, [1 hour / 10 km, 6 hours / 50 km, 12 hours / 100 km]
const RENTALS = [
  ['Scooty', 'scooter', 'Bike', '20 kg', [200, 900, 1500]],
  ['Three Wheeler', 'mini-ev', 'Auto', '600 kg', [400, 1250, 1600]],
  ['7ft Mini Truck', 'tata-ace', 'Truck', '750 kg', [500, 1400, 1800]],
  ['8ft Mini Truck', 'ninja-van', 'Truck', '1300 kg', [600, 1600, 2000]],
  ['9ft Pickup', 'pickup', 'Truck', '1700 kg', [700, 1800, 2200]],
  ['10ft Pickup', 'pickup', 'Truck', '2000 kg', [800, 2000, 2500]],
];
const PACKAGES = [
  [1, 10, 'Hourly'],
  [6, 50, '6 Hours'],
  [12, 100, '12 Hours'],
];

const TRUCK = '/taxi/user/parcel/type';
const card = (id, title, photo, order, extra = {}) => ({
  id, title, image: img(photo), imageUrl: img(photo), route: TRUCK, status: 'active', order, ...extra,
});

// Tata 407 is left out until it has a fare and can be booked.
const FLEET_CARDS = [
  ['Scooty', 'scooter'],
  ['Bike Courier', 'courier-bike'],
  ['Three Wheeler', 'mini-ev'],
  ['Tata Ace', 'tata-ace'],
  ['8ft Mini Truck', 'ninja-van'],
  ['Pickup', 'pickup'],
].map(([title, photo], i) => card(`fleet_${photo}`, title, photo, i + 1));

const INSURANCE_IMAGE = '/uploads/insurance/insurance-banner.webp';
const PROMOS = [
  card('promo_mini_truck', 'Mini Trucks', 'ninja-van', 1, { badge: 'Featured', subtitle: 'Tata Ace, pickups and 3-wheelers for quick intracity loads and small cargo.' }),
  card('promo_heavy', 'Heavy Vehicles', 'tata-407', 2, { subtitle: '12ft and 14ft trucks for industrial goods and full truck loads.' }),
  card('promo_movers', 'Packers & Movers', 'pickup', 3, { subtitle: 'Complete relocation for home and office shifting.' }),
  card('promo_courier', 'Courier & Parcel', 'courier-bike', 4, { subtitle: 'Secure doorstep pickup and delivery for packages and e-commerce orders.' }),
  card('promo_insurance', 'Vehicle Insurance', 'scooter', 5, { subtitle: 'Monthly, 6-month and annual cover for your vehicle.', image: INSURANCE_IMAGE, imageUrl: INSURANCE_IMAGE, route: '/taxi/user/insurance' }),
];
const TOP_BANNERS = [
  { id: 'tb_ninja_1', title: 'Ninja Truck', subtitle: 'No Highway Is Too Long. Book a truck in under 60 seconds.', image: img('ninja-van'), redirect_url: TRUCK },
  { id: 'tb_ninja_2', title: 'Courier & Parcel', subtitle: 'Doorstep pickup and delivery.', image: img('courier-bike'), redirect_url: TRUCK },
  { id: 'tb_ninja_3', title: 'Packers & Movers', subtitle: 'Home and office shifting.', image: img('pickup'), redirect_url: TRUCK },
];

const main = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`${APPLY ? 'Seeding' : 'Dry run'}: ${MONGODB_DB_NAME}`);

  for (const [name, photo] of Object.entries(PHOTOS)) {
    const found = await Vehicle.countDocuments({ name });
    console.log(`  photo  ${name.padEnd(16)} ${photo}${found === 1 ? '' : `  (matches: ${found})`}`);
    if (APPLY) await Vehicle.updateMany({ name }, { $set: { image: img(photo), icon: img(photo) } });
  }

  for (const v of NEW_VEHICLES) {
    const exists = await Vehicle.exists({ name: v.name });
    console.log(`  new    ${v.name} ${exists ? '(already there, left alone)' : '(inactive until priced)'}`);
    if (APPLY && !exists) {
      const line = `${v.capacity} kg • ${v.size}`;
      await Vehicle.create({
        name: v.name,
        short_description: line,
        description: `Commercial vehicle: ${line}`,
        transport_type: 'delivery',
        is_taxi: 'delivery',
        dispatch_type: 'normal',
        icon_types: 'truck',
        capacity: v.capacity,
        size: v.size,
        delivery_category: 'trucks',
        image: img(v.photo),
        icon: img(v.photo),
        map_icon: '/uploads/ninja_truck_assets/Delivery.png',
        status: 0,
        active: false,
      });
    }
  }

  for (const [name, photo, vehicleCategory, load, prices] of RENTALS) {
    const pricing = PACKAGES.map(([hours, km, label], i) => ({
      id: `driver-${hours}h`,
      label,
      durationHours: hours,
      price: prices[i],
      includedKm: km,
      extraHourPrice: 0,
      extraKmPrice: 0,
      active: true,
    }));
    console.log(`  rental ${name.padEnd(16)} ${pricing.map((p) => `${p.label} ₹${p.price}/${p.includedKm}km`).join('  ')}`);
    if (APPLY) {
      await RentalVehicleType.findOneAndUpdate(
        { name },
        {
          $set: {
            vehicleCategory,
            pricing,
            image: img(photo),
            coverImage: img(photo),
            status: 'active',
            active: true,
            short_description: `Up to ${load}`,
            description: 'Rental vehicle.',
            amenities: [`Up to ${load}`],
            capacity: 1,
            luggageCapacity: 0,
          },
        },
        { upsert: true, setDefaultsOnInsert: true, runValidators: true },
      );
    }
  }

  console.log(`  app home: ${FLEET_CARDS.length} fleet cards, ${PROMOS.length} promos, ${TOP_BANNERS.length} banners`);
  if (APPLY) {
    await mongoose.connection.db.collection('taxiadminbusinesssettings').updateOne(
      { scope: 'default' },
      {
        $set: {
          'user_home_settings.goPlaces': FLEET_CARDS,
          'user_home_settings.promos': PROMOS,
          'user_home_settings.topBanners': TOP_BANNERS,
        },
      },
    );
  }
  console.log(APPLY ? 'Done. Restart the backend.' : 'Nothing written. Re-run with --apply.');
  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
