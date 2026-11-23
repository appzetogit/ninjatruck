/**
 * What the marketing site renders before the CMS responds, and if it never
 * does. Mirrors Backend/src/modules/taxi/admin/data/defaultLandingContent.js —
 * keep the two in step when adding a section.
 *
 * Icons are lucide component *names* here, matching the API's wire format;
 * useLandingContent resolves them to components.
 */
export const LANDING_FALLBACK = {
  services: [
    { id: 'mini-truck', title: 'Mini Truck', icon: 'Package', desc: 'Intracity trucks for small cargo' },
    { id: 'heavy', title: 'Heavy Vehicles', icon: 'Building2', desc: 'Big trucks for industrial goods' },
    { id: 'intercity', title: 'Intercity Freight', icon: 'Compass', desc: 'Outstation loads, city to city' },
    { id: 'rental', title: 'Hourly Rental', icon: 'Clock', desc: 'Truck with driver, by the hour' },
    { id: 'packers', title: 'Packers & Movers', icon: 'Building', desc: 'Home and office shifting' },
    { id: 'courier', title: 'Courier & Parcel', icon: 'ShoppingBag', desc: 'Doorstep parcel pickup & drop' },
    { id: 'business', title: 'Business Logistics', icon: 'Briefcase', desc: 'Contract trucks & monthly billing' },
    { id: 'insurance', title: 'Goods Insurance', icon: 'ShieldCheck', desc: 'Every load covered, end to end' },
    { id: 'tracking', title: 'Live GPS Tracking', icon: 'Navigation', desc: 'Watch your shipment move live' },
  ],

  valueProps: [
    { icon: 'Clock', title: 'Book in Under 60 Seconds', desc: 'Pick a truck, set pickup and drop, done.' },
    { icon: 'ShieldCheck', title: 'Verified Drivers', desc: 'Background-checked drivers on every load.' },
    { icon: 'Navigation', title: 'Live GPS Tracking', desc: 'Track your goods from pickup to delivery.' },
    { icon: 'Shield', title: 'Insured Goods', desc: 'Your cargo is covered on every trip.' },
    { icon: 'PhoneCall', title: '24x7 Support', desc: 'Call, WhatsApp or chat - we are always on.' },
  ],

  drivers: [
    {
      name: 'Ramesh Kumar', photo: '/drivers/driver-1.jpg', rating: 4.9, trips: '3,200+ deliveries',
      experience: '8 years experience', vehicle: 'Tata Ace Gold · KA 01 AB 1234',
      badge: 'Top Driver', city: 'Bengaluru',
    },
    {
      name: 'Suresh Naik', photo: '/drivers/driver-2.jpg', rating: 4.8, trips: '2,100+ deliveries',
      experience: '6 years experience', vehicle: 'Tata 1109 LPT · MH 12 CD 5678',
      badge: 'Verified', city: 'Pune',
    },
    {
      name: 'Mahesh Patil', photo: '/drivers/driver-3.jpg', rating: 5.0, trips: '1,450+ deliveries',
      experience: '5 years experience', vehicle: 'Mahindra Bolero Pickup · GJ 01 EF 9012',
      badge: 'Top Driver', city: 'Ahmedabad',
    },
    {
      name: 'Imran Shaikh', photo: '/drivers/driver-4.jpg', rating: 4.9, trips: '2,800+ deliveries',
      experience: '10 years experience', vehicle: 'Ashok Leyland 1920 · DL 03 GH 3456',
      badge: 'Verified', city: 'Delhi NCR',
    },
  ],

  partners: [
    { name: 'MANUFACTURERS', subtitle: 'INDUSTRIAL GOODS' },
    { name: 'WHOLESALERS', subtitle: 'BULK DISTRIBUTION' },
    { name: 'E-COMMERCE', subtitle: 'SELLERS & D2C BRANDS' },
    { name: 'RETAIL CHAINS', subtitle: 'STORE REPLENISHMENT' },
    { name: 'WAREHOUSES', subtitle: '3PL & STORAGE' },
    { name: 'FAMILIES', subtitle: 'HOME SHIFTING' },
  ],

  launchCities: [
    { name: 'Delhi NCR', note: 'North India Operations' },
    { name: 'Mumbai', note: 'West India Operations' },
    { name: 'Bengaluru', note: 'South India Operations' },
  ],

  contact: {
    email: 'support@ninjatruck.in',
    whatsapp: '918942852470',
    whatsappDisplay: '+91 8942852470',
    // No toll-free line yet. Every "call us" link dials this field, so it holds
    // the business number; tollFreeLive stays false, which keeps the toll-free
    // IVR banner on the contact page hidden until a real line exists.
    tollFree: '+91 8942852470',
    tollFreeLive: false,
    address: 'Ninja Truck Logistics, India',
    addressShort: 'Ninja Truck Logistics, India',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=India',
  },

  // Logo, wordmark and app-store links. The store badges were non-clickable
  // placeholders and the QR code was an icon, so these start empty and the
  // client fills them in.
  brand: {
    logo: '/ninjatruck-logo.svg',
    wordmarkPrimary: 'NINJA',
    wordmarkSecondary: 'TRUCK',
    tagline: 'No Highway Is Too Long.',
    appBlurb: 'Book a truck in under 60 seconds, track your goods live, and manage invoices with the Ninja Truck app.',
    playStoreUrl: '',
    appStoreUrl: '',
    playStoreQr: '',
    appStoreQr: '',
  },

  hero: {
    titleLine1: 'No Highway',
    titleLine2: 'Is Too Long.',
    subtitle: 'Book a truck in under 60 seconds. Doorstep pickup, live GPS tracking and insured goods - we deliver all over India.',
    primaryCta: 'Book a Truck',
    secondaryCta: 'Download App',
    badges: [
      { icon: 'ShieldCheck', label: 'Verified Drivers' },
      { icon: 'Navigation', label: 'Live GPS Tracking' },
      { icon: 'Shield', label: 'Insured Goods' },
      { icon: 'Clock', label: '99.8% On-Time' },
    ],
  },

  footer: {
    description:
      'Ninja Truck Logistics books trucks for businesses and individuals across India - mini trucks, heavy vehicles, intercity freight, packers & movers and parcel delivery. (We Deliver) All Over India.',
    servicesHeading: 'Truck Services',
    cabServices: [
      { label: 'Mini Trucks (Intracity)' },
      { label: 'Heavy Vehicles' },
      { label: 'Intercity & Outstation Freight' },
      { label: 'Hourly Truck Rental' },
      { label: 'Packers & Movers' },
      { label: 'Courier & Parcel Delivery' },
    ],
    trustPills: [
      { label: 'Verified Drivers' },
      { label: 'Insured Goods' },
    ],
    copyright: '© 2026 Ninja Truck Logistics. All Rights Reserved.',
  },

  seo: {
    title: 'Ninja Truck - No Highway Is Too Long.',
    description:
      'Ninja Truck - book mini trucks, heavy vehicles, intercity freight, packers & movers and parcel delivery all over India. Live GPS tracking, verified drivers, insured goods.',
  },

  about: {
    tag: 'About Ninja Truck',
    title: 'Moving India’s Goods, One Highway at a Time',
    subtitle:
      'Truck booking and logistics for businesses and individuals - built on verified drivers, live tracking and on-time delivery. (We Deliver) All Over India.',
    stats: [
      { label: 'Loads Delivered', count: 100000, suffix: '+' },
      { label: 'On-Time Delivery', value: '99.8%' },
      { label: 'Cities Served', count: 100, suffix: '+' },
      { label: 'Verified Drivers', count: 5000, suffix: '+' },
    ],
    foundersTag: 'Leadership',
    foundersHeading: 'Meet the Founders',
    founders: [],
    pillarsHeading: 'The Pillars of Ninja Truck',
    pillars: [
      { icon: 'ShieldCheck', title: 'Safe Goods', desc: 'Every truck runs on live GPS, and every load is insured from pickup to drop - so your cargo arrives the way it left.' },
      { icon: 'Award', title: 'Transparent Pricing', desc: 'The fare you see at booking is the fare you pay. No broker cuts, no surprise loading charges.' },
      { icon: 'HeartHandshake', title: 'Dedicated Support', desc: 'A real team watches your shipment and handles delays, rerouting and unloading questions 24x7.' },
      { icon: 'Users', title: 'Verified Fleet', desc: 'Driver background and document checks, plus regular vehicle fitness checks, keep every delivery on schedule.' },
    ],
  },

  faqs: [
    { q: 'How fast can I book a truck?', a: 'Under 60 seconds. Choose a truck type, set pickup and drop, and confirm - a verified driver is assigned right away.' },
    { q: 'Are my goods insured?', a: 'Yes. Goods insurance is available on every booking, so your cargo is covered from pickup to delivery.' },
    { q: 'Can I track my shipment?', a: 'Every truck is on live GPS. You get a tracking link the moment your load is picked up.' },
    { q: 'Do you deliver outside my city?', a: 'Yes. We run intercity and outstation freight all over India, from single parcels to full truck loads.' },
    { q: 'Which payment methods are accepted?', a: 'UPI, credit and debit cards, net banking and cash. Businesses can opt for consolidated monthly invoicing with GST bills.' },
  ],

  servicesPage: {
    tag: 'Ninja Truck Services',
    title: 'Every Load. Every Distance.',
    subtitle:
      'From a single parcel across town to a full truck load across the country - pick the right truck and we handle the rest.',
    ctaLabel: 'Book This Truck',
    items: [
      { id: 'mini-truck', title: 'Mini Truck', tag: 'Intracity & Small Cargo', icon: 'Package', image: '/premium_grid_map.png',
        description: 'Tata Ace, Dost and pickup trucks for quick city deliveries - shop stock, appliances, furniture and small business loads.',
        features: ['Doorstep pickup', 'Book in under 60 seconds', 'Live GPS tracking', 'Loading help on request'] },
      { id: 'heavy', title: 'Heavy Vehicles', tag: 'Industrial Goods', icon: 'Building2', image: '/ninjatruck-highway.svg',
        description: 'LCVs, 19 ft+ trucks and trailers for raw material, machinery and bulk industrial goods.',
        features: ['Open & closed body trucks', 'Full truck load (FTL)', 'Verified heavy-licence drivers', 'Goods insurance available'] },
      { id: 'intercity', title: 'Intercity Freight', tag: 'Outstation & All India', icon: 'Compass', image: '/ninjatruck-highway.svg',
        description: 'City-to-city freight on any highway in India. Part or full loads, tracked every kilometre of the way.',
        features: ['All India permit trucks', 'Live GPS tracking', 'Transparent per-km pricing', '99.8% on-time delivery'] },
      { id: 'rental', title: 'Hourly Truck Rental', tag: 'Truck + Driver by the Hour', icon: 'Clock', image: '/premium_grid_map.png',
        description: 'Rent a truck with a driver for a few hours or the whole day - ideal for multi-drop runs and event logistics.',
        features: ['4hr, 8hr & 12hr packages', 'Multiple stops allowed', 'Driver included', 'No hidden charges'] },
      { id: 'packers', title: 'Packers & Movers', tag: 'Home & Office Shifting', icon: 'Building', image: '/ninjatruck-cargo.svg',
        description: 'Packing, loading, transport and unloading for home and office moves - within the city or across India.',
        features: ['Professional packing', 'Loading & unloading crew', 'Insured household goods', 'Within city or intercity'] },
      { id: 'parcel', title: 'Courier & Parcel', tag: 'Fast & Secure Delivery', icon: 'Package', image: '/ninjatruck-cargo.svg',
        description: 'Fast, secure doorstep courier and parcel delivery with real-time tracking and OTP-verified handover.',
        features: ['Instant pickup from doorstep', 'Live package tracking', 'Secure OTP verification', 'Affordable distance rates'] },
      { id: 'business', title: 'Business Logistics', tag: 'B2B Contract Trucks', icon: 'Briefcase', image: '/premium_grid_map.png',
        description: 'Dedicated and on-demand trucks for factories, warehouses, distributors and e-commerce sellers.',
        features: ['Consolidated monthly invoicing', 'GST compliant bills', 'Dedicated account manager', 'Priority truck dispatch'] },
      { id: 'insurance', title: 'Goods Insurance', tag: 'Cargo Protection', icon: 'ShieldCheck', image: '/ninjatruck-cargo.svg',
        description: 'Add insurance to any booking and keep your goods covered against damage and loss in transit.',
        features: ['Cover on every trip', 'Simple claims process', 'Works with all truck types', 'Added at booking'] },
    ],
  },

  corporatePage: {
    tag: 'Ninja Truck Business',
    title: 'Logistics That Keeps Your Business Moving',
    subtitle:
      'On-demand and contract trucks for manufacturers, distributors, retailers and e-commerce - with live tracking and one monthly invoice.',
    benefitsHeading: 'Why Businesses Ship With Ninja Truck',
    formTitle: 'Request a Business Quote',
    formSubtitle: 'Get custom freight rates for your company in 2 hours.',
    benefits: [
      { icon: 'FileText', title: 'GST Compliant Central Invoicing', desc: 'Consolidated monthly bills with trip-wise breakdowns, proof of delivery and GST-ready reports.' },
      { icon: 'UserCheck', title: 'Dedicated Account Manager', desc: 'One point of contact for priority bookings, route planning and urgent truck dispatch 24x7.' },
      { icon: 'ShieldCheck', title: 'Insured, Tracked Loads', desc: 'Every shipment is on live GPS and covered by goods insurance from pickup to delivery.' },
      { icon: 'Building', title: 'Dedicated Fleet on Contract', desc: 'Reserve trucks for daily routes between plants, warehouses and stores at fixed monthly rates.' },
    ],
  },

  partnerPage: {
    tag: 'Attach Your Truck & Earn',
    title: 'Partner With the Ninja Truck Fleet',
    perksHeading: 'Why Truck Owners Trust Ninja Truck',
    earningsHeading: 'Est. Monthly Earnings Calculator',
    formTitle: 'Attach Your Truck Today',
    formSubtitle: 'Fill the form below to receive a callback within 30 minutes.',
    perks: [
      { icon: 'DollarSign', title: 'Weekly Direct Payouts', desc: 'Transparent weekly payments straight to your bank account with zero hidden deductions.' },
      { icon: 'Compass', title: 'Return Loads', desc: 'Intercity trips are matched with return loads so your truck never runs empty on the highway.' },
      { icon: 'Award', title: 'Low Commission Rates', desc: 'Keep more of every freight payment with our low commission structure.' },
      { icon: 'ShieldCheck', title: '24x7 Fleet Support', desc: 'Dedicated fleet helpline for load dispatch, FASTag support and on-road emergencies.' },
    ],
    earnings: [
      { label: 'Mini Truck (Tata Ace / Dost)', value: '₹40,000 - ₹55,000 / mo' },
      { label: 'LCV (14 - 17 ft)', value: '₹70,000 - ₹95,000 / mo' },
      { label: 'Heavy Vehicle (19 ft+)', value: '₹1,10,000 - ₹1,50,000 / mo' },
    ],
  },

  driverPage: {
    tag: 'Drive With Ninja Truck',
    title: 'Steady Loads. Weekly Pay. All Over India.',
    perksHeading: 'Driver Benefits at Ninja Truck',
    docsHeading: 'Documents Required for Verification',
    formTitle: 'Driver Onboarding Form',
    formSubtitle: 'Start driving with Ninja Truck within 24 hours.',
    perks: [
      { icon: 'Clock', title: 'Flexible Duty Hours', desc: 'Pick city deliveries or long-haul intercity trips - drive when it suits you.' },
      { icon: 'Shield', title: '₹5 Lakh Insurance Cover', desc: 'Free accidental insurance and medical assistance for every active Ninja Truck driver partner.' },
      { icon: 'Award', title: 'Return Load Guarantee', desc: 'Long trips are matched with return loads to save fuel and maximise earnings per trip.' },
    ],
    requiredDocs: [
      'Commercial Driving License (Transport / HMV)',
      'Aadhaar Card & PAN Card',
      'Current Police Verification Certificate',
      'Vehicle RC Book & Active Fitness Certificate',
      'Commercial Vehicle Insurance & National / State Permit',
    ],
  },

  advertisePage: {
    tag: 'Advertise with Ninja Truck',
    title: 'Reach Businesses and Drivers Moving Goods Across India',
    inventoryTag: 'Inventory',
    inventoryHeading: 'Where Your Brand Can Appear',
    industriesTag: 'Who Advertises With Us',
    industriesHeading: 'Built for Brands That Serve Logistics',
    mediaKitHeading: 'Request a Media Kit',
    formTitle: 'Advertising Enquiry',
    placements: [
      { icon: 'Smartphone', title: 'Mobile App', desc: 'In-app placements across the booking journey — from app open to delivery confirmation.', formats: ['Splash / app-open ad', 'In-feed native card', 'Delivery-summary banner'] },
      { icon: 'Globe', title: 'Website', desc: 'Placements on ninjatruck.in pages, seen by businesses comparing freight rates and booking online.', formats: ['Leaderboard banner', 'Sidebar tile', 'Sponsored service block'] },
      { icon: 'UserCheck', title: 'Driver App', desc: 'Reach our truck driver and fleet-owner network — ideal for fuel, tyres, lubricants, insurance and EMI brands.', formats: ['Driver home banner', 'Duty start/end card', 'Partner offer wall'] },
      { icon: 'Image', title: 'Home Screen Banners', desc: 'The highest-visibility slot in the app — every customer sees it before booking a truck.', formats: ['Hero carousel slide', 'Static top banner', 'City-targeted banner'] },
      { icon: 'CheckCircle2', title: 'Booking Confirmation Screen', desc: 'Shown at peak attention, right after a truck is booked and while the customer waits for pickup.', formats: ['Confirmation card ad', 'While you wait tile', 'Nearby-brand suggestion'] },
      { icon: 'Gift', title: 'Offers & Promotions', desc: 'Co-branded coupons and cashback that travel with every Ninja Truck shipment.', formats: ['Coupon in offers tab', 'Co-branded promo code', 'Book-and-win campaign'] },
      { icon: 'BellRing', title: 'Push Notifications', desc: 'Opt-in, frequency-capped pushes segmented by city, truck type and customer behaviour.', formats: ['Sponsored push', 'Geo-fenced alert', 'Weekend campaign blast'] },
    ],
    industries: [
      { icon: 'HardHat', label: 'Construction & Materials' },
      { icon: 'Building2', label: 'Manufacturers & Warehouses' },
      { icon: 'ShoppingBag', label: 'Retail & E-commerce' },
      { icon: 'Wallet', label: 'Finance, Insurance & EMI' },
      { icon: 'TrendingUp', label: 'Fuel, Tyres & Lubricants' },
      { icon: 'UtensilsCrossed', label: 'Highway Dhabas & F&B' },
    ],
    // {cities} is replaced at render with the launch city names, so this line
    // stays correct when a city is added or removed.
    whyUs: [
      { icon: 'Users', title: 'A high-intent business audience', desc: 'Shippers and fleet owners open the app to book, track and get paid — every single day.' },
      { icon: 'MapPin', title: 'Precise city & route targeting', desc: 'Target by city ({cities}), pickup zone, highway route or truck type.' },
      { icon: 'TrendingUp', title: 'Measurable, reported campaigns', desc: 'Impressions, taps, coupon redemptions and footfall attribution shared in a monthly report.' },
    ],
  },
};
