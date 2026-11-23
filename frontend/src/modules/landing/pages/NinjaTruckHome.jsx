import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NinjaHeader from '../components/NinjaHeader';
import NinjaFooter from '../components/NinjaFooter';
import { DRIVER_LOGIN, USER_LOGIN } from '../components/ninjaBrand';
import {
  ArrowRight,
  Box,
  CircleCheck,
  Clock,
  FastForward,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useSettings } from '../../../shared/context/SettingsContext';

/**
 * Ninja Truck home page ("/"). It stands on its own, with its own top bar,
 * header and footer, outside LandingShell, so the old ZI CAB navbar/footer
 * don't wrap it. Brand: Ninja Truck yellow #F9C105, deep yellow #e6b204,
 * ink #111111, Outfit black uppercase headings.
 */


const MAIN_SERVICES = [
  { icon: Package, title: 'Courier', text: 'Secure parcel delivery for personal packages or e-commerce businesses.' },
  { icon: Clock, title: 'Vehicle Rental', text: 'Rent a truck by the hour with a dedicated driver for multiple stops.' },
  { icon: Box, title: 'Packers & Movers', text: 'Complete relocation services for home and office shifting.' },
];

const MORE_SERVICES = [
  { icon: Truck, title: 'Mini Trucks', text: 'Quick intracity deliveries & small cargo.' },
  { icon: Truck, title: 'Heavy Vehicles', text: 'Large capacity trucks for industrial goods.' },
  { icon: FastForward, title: 'Intercity', text: 'Outstation logistics across cities.' },
  { icon: ShieldCheck, title: 'Goods Insurance', text: 'Comprehensive coverage for cargo.' },
];

const REASONS = [
  { title: 'Doorstep Pickup', text: 'We pick up directly from your warehouse.' },
  { title: 'Live Tracking', text: 'Monitor your goods in real-time via GPS.' },
  { title: 'Fast Booking', text: 'Book a truck in under 60 seconds.' },
  { title: 'Secure Transit', text: 'Verified drivers and insured goods.' },
];

const SLANT = { clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' };

/** Brand illustration for the hero: a Ninja Truck lorry on a highway at dusk. */
const HeroTruck = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full" role="img" aria-label="Ninja Truck lorry on the highway">
    <defs>
      <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b1b1b" />
        <stop offset="1" stopColor="#3a2f08" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#nt-sky)" />
    <circle cx="300" cy="95" r="46" fill="#F9C105" opacity="0.9" />
    <path d="M0 190 L70 150 L130 175 L210 130 L290 168 L400 140 L400 210 L0 210Z" fill="#2a2a2a" />
    <rect y="205" width="400" height="95" fill="#111111" />
    <g fill="#F9C105">
      <rect x="10" y="250" width="40" height="6" />
      <rect x="90" y="250" width="40" height="6" />
      <rect x="170" y="250" width="40" height="6" />
      <rect x="250" y="250" width="40" height="6" />
      <rect x="330" y="250" width="40" height="6" />
    </g>
    {/* cargo box */}
    <rect x="70" y="128" width="190" height="90" rx="4" fill="#F9C105" stroke="#111" strokeWidth="4" />
    <text x="165" y="168" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="26" fill="#111" letterSpacing="-1">NINJA</text>
    <text x="165" y="196" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="26" fill="#111" letterSpacing="-1">TRUCK</text>
    {/* cab */}
    <path d="M264 150 H310 L338 182 V218 H264Z" fill="#ffffff" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
    <path d="M276 160 H305 L324 182 H276Z" fill="#111" />
    <rect x="330" y="200" width="12" height="8" fill="#F9C105" stroke="#111" strokeWidth="2" />
    <rect x="60" y="214" width="286" height="10" fill="#111" />
    {[110, 220, 306].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="226" r="20" fill="#111" stroke="#F9C105" strokeWidth="3" />
        <circle cx={cx} cy="226" r="7" fill="#F9C105" />
      </g>
    ))}
    {/* speed lines */}
    <g stroke="#F9C105" strokeWidth="4" strokeLinecap="round" opacity="0.8">
      <line x1="16" y1="150" x2="54" y2="150" />
      <line x1="4" y1="172" x2="54" y2="172" />
      <line x1="24" y1="194" x2="54" y2="194" />
    </g>
  </svg>
);

const SectionLabel = ({ children }) => (
  <h2 className="text-white font-black tracking-widest text-lg uppercase mb-4 drop-shadow-sm">- {children} -</h2>
);

const NinjaTruckHome = () => {
  const navigate = useNavigate();

  // SettingsContext sets the app-wide title whenever settings load. This page
  // re-applies its own title after each of those updates.
  const { settings } = useSettings();
  useEffect(() => {
    const previous = document.title;
    // SettingsProvider is a parent, so its effect runs after this one in the
    // same commit. A microtask makes this page's title land last.
    let active = true;
    queueMicrotask(() => {
      if (active) document.title = 'Ninja Truck — All Over India Logistics';
    });
    return () => {
      active = false;
      document.title = previous;
    };
  }, [settings]);

  const bookTruck = () => navigate(USER_LOGIN);

  return (
    <div className="min-h-screen bg-[#F9C105] font-['Outfit',sans-serif] text-slate-800 overflow-x-hidden selection:bg-[#111111] selection:text-[#F9C105]">
      <NinjaHeader />

      {/* Hero */}
      <section id="home" className="relative pt-12 pb-24 lg:pt-24 lg:pb-32 px-6 lg:px-16 overflow-hidden max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center relative z-10">
          <div className="flex flex-col items-start gap-8 lg:pr-12">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/80 border-l-4 border-[#111111] text-[#111111] font-black tracking-widest text-sm sm:text-base uppercase shadow-sm">
              (WE DELIVER) ALL OVER INDIA
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-[#111111] leading-[1.05] uppercase">
              No Highway Is <span className="text-white drop-shadow-md">Too Long.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-800 font-bold leading-relaxed max-w-lg border-l-2 border-[#111111] pl-4">
              Everything your business needs to move goods efficiently. Fast, secure, and affordable transportation for
              all commercial loads.
            </p>
            <button
              type="button"
              onClick={bookTruck}
              className="group mt-4 flex items-center justify-center gap-3 bg-[#111111] text-[#F9C105] hover:bg-black px-10 py-5 font-black text-xl tracking-widest uppercase shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] transition-all hover:translate-x-1 hover:-translate-y-1 w-full sm:w-auto"
            >
              <span>Book A Truck</span>
              <ArrowRight className="transition-transform group-hover:translate-x-2" />
            </button>
          </div>

          <div className="relative w-full max-w-[700px] mx-auto lg:mx-0 flex justify-center lg:justify-end py-10">
            <div className="absolute inset-0 bg-white opacity-40 blur-[100px] rounded-full scale-75" />
            <div className="relative rotate-3 hover:rotate-0 transition-transform duration-700 ease-out group w-full max-w-[550px]">
              <div
                className="absolute top-6 -left-6 w-full h-full bg-[#111111] opacity-90 group-hover:top-4 group-hover:-left-4 transition-all duration-700 ease-out shadow-2xl"
                style={SLANT}
              />
              <div className="relative z-10 w-full aspect-[4/3] overflow-hidden shadow-2xl shadow-black/50" style={SLANT}>
                <div className="w-full h-full scale-110 group-hover:scale-105 transition-transform duration-700 ease-out">
                  <HeroTruck />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 lg:px-16 bg-[#e6b204] relative border-t-2 border-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <SectionLabel>Our Expertise</SectionLabel>
            <h3 className="text-4xl lg:text-6xl font-black text-[#111111] tracking-tighter uppercase">Logistics Solutions</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {MAIN_SERVICES.map(({ icon, title, text }) => {
              const Icon = icon;
              return (
              <Link
                key={title}
                to="/services"
                className="group bg-[#111111] rounded-3xl p-10 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]"
              >
                <div className="bg-white/10 p-6 rounded-2xl mb-6">
                  <Icon size={48} className="text-[#F9C105]" />
                </div>
                <h4 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">{title}</h4>
                <p className="text-slate-300 font-bold text-lg leading-relaxed">{text}</p>
              </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-16 border-t-2 border-[#111111]/10">
            {MORE_SERVICES.map(({ icon, title, text }) => {
              const Icon = icon;
              return (
              <Link
                key={title}
                to="/services"
                className="block bg-white/40 border-2 border-[#111111]/10 rounded-2xl p-8 hover:border-[#111111] hover:bg-white/60 transition-all duration-300"
              >
                <Icon size={36} className="text-[#111111]" />
                <h4 className="text-xl font-black text-[#111111] tracking-wide uppercase mt-6 mb-3">{title}</h4>
                <p className="text-slate-800 font-bold">{text}</p>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-32 px-6 lg:px-16 bg-[#F9C105] border-t-2 border-[#111111] overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <SectionLabel>Why Choose Us</SectionLabel>
            <h3 className="text-4xl lg:text-6xl font-black tracking-tighter text-[#111111] uppercase mb-8">
              The Smartest Way To Move Goods
            </h3>
            <p className="text-xl text-slate-800 font-bold mb-16 max-w-lg">
              We combine cutting-edge technology with a vast network of professional drivers to deliver an unmatched
              logistics experience.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
              {REASONS.map(({ title, text }) => (
                <div key={title} className="flex gap-4">
                  <CircleCheck size={28} className="text-[#111111] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl font-black text-[#111111] uppercase tracking-wide mb-2">{title}</h4>
                    <p className="text-slate-800 font-bold">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden shadow-2xl border-4 border-[#111111] bg-white">
              <img
                src="/premium_grid_map.png"
                alt="Ninja Truck logistics network map"
                loading="lazy"
                className="w-full h-full object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-[#111111] text-[#F9C105] p-10 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] max-w-[320px] hidden md:block border-2 border-white/10">
              <div className="text-5xl font-black tracking-tighter mb-2">99.8%</div>
              <div className="font-black text-xl uppercase tracking-widest text-white">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="py-24 px-6 lg:px-16 bg-[#e6b204] border-y-2 border-[#111111]">
        <div className="max-w-7xl mx-auto text-center">
          <SectionLabel>Join The Network</SectionLabel>
          <h3 className="text-4xl lg:text-6xl font-black text-[#111111] tracking-tighter uppercase mb-16">Get Started Today</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link
              to={USER_LOGIN}
              className="flex items-center justify-center px-10 py-6 font-black text-xl tracking-widest uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 w-full sm:w-auto sm:min-w-[300px] bg-[#111111] text-[#F9C105] hover:bg-black"
            >
              User Login
            </Link>
            <Link
              to={DRIVER_LOGIN}
              className="flex items-center justify-center px-10 py-6 font-black text-xl tracking-widest uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 w-full sm:w-auto sm:min-w-[300px] bg-white/40 text-[#111111] border-2 border-[#111111] hover:bg-white/60"
            >
              Driver Login
            </Link>
          </div>
        </div>
      </section>

      <NinjaFooter />
    </div>
  );
};

export default NinjaTruckHome;
