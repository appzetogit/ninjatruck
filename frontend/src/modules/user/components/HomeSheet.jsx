import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Search } from 'lucide-react';
import api from '../../../shared/api/axiosInstance';
import LocationMapSection from './LocationMapSection';

/**
 * Customer home: map with an address pill on top, and a rounded sheet with
 * search, services, insurance and the brand footer. Always light.
 */
const TRUCKS = '/taxi/user/parcel/type';
const SERVICES = [
  { id: 'delivery', label: 'Delivery', from: '#fff7ed', to: '#fed7aa', path: TRUCKS, state: { autoCategory: 'trucks' } },
  { id: 'courier', label: 'Courier', from: '#fefce8', to: '#fde68a', path: TRUCKS, state: { autoCategory: '2wheeler' } },
  { id: 'rental-without-driver', label: 'Rental Without Driver', from: '#eff6ff', to: '#bfdbfe', path: '/taxi/user/rental', state: { rentalType: 'self_drive' } },
  { id: 'rental-with-driver', label: 'Rental With Driver', from: '#faf5ff', to: '#e9d5ff', path: '/taxi/user/rental', state: { rentalType: 'with_driver' } },
  { id: 'outstation', label: 'Delivery Outstation', from: '#ecfdf5', to: '#a7f3d0', path: TRUCKS, state: { autoCategory: 'trucks', deliveryScope: 'outstation' } },
  { id: 'packers-movers', label: 'Packers & Movers', from: '#fff1f2', to: '#fecdd3', path: TRUCKS, state: { autoCategory: 'movers' } },
];

const InsuranceCard = ({ onOpen }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/insurance/settings')
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? res;
        if (alive && data && typeof data === 'object') setSettings(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!settings?.enabled) return null;
  return (
    <section className="px-5">
      <h2 className="text-[20px] font-black tracking-tight text-[#0f172a]">{settings.bannerTitle}</h2>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">{settings.bannerSubtitle}</p>
      <button type="button" onClick={onOpen} className="mt-4 block w-full overflow-hidden rounded-[28px] border border-[#f1f5f9] bg-[#ffffff] text-left shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
        {settings.bannerImageUrl && <img src={settings.bannerImageUrl} alt="" loading="lazy" className="aspect-[2.3/1] w-full object-cover object-top" />}
        <span className="flex items-center justify-between gap-3 p-4">
          <span>
            <span className="block text-[11px] font-black uppercase tracking-wide text-[#94a3b8]">Policy terms</span>
            <span className="mt-1 block text-[14px] font-bold text-[#0f172a]">{settings.policyTermsLabel}</span>
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[#ffffff]">
            <ArrowRight size={18} />
          </span>
        </span>
      </button>
    </section>
  );
};

const HomeSheet = ({ address, showMap, activeRide }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative mx-auto -mb-20 h-[100dvh] w-full max-w-[512px] overflow-hidden bg-[#e2e8f0] font-sans text-[#0f172a] shadow-[0_0_40px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-x-0 top-0 h-[56dvh]">
        {showMap ? <LocationMapSection fill /> : <div className="h-full w-full animate-pulse bg-[#e2e8f0]" />}
      </div>

      <button
        type="button"
        onClick={() => navigate('/taxi/user/ride/select-location', { state: { activeInput: 'pickup', flow: 'ride' } })}
        className="absolute left-1/2 top-4 z-30 flex w-[56%] min-w-[240px] -translate-x-1/2 items-center gap-3 rounded-full border border-[#f1f5f9] bg-[#ffffff] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.16)]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9]">
          <span className="h-2 w-2 rounded-full bg-[#34d399]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-bold text-[#0f172a]">{address}</span>
        <ChevronRight size={16} className="shrink-0 text-[#94a3b8]" />
      </button>

      <div
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[32px] bg-[#fbfcfb] shadow-[0_-12px_32px_rgba(15,23,42,0.14)] transition-[top] duration-300"
        style={{ top: expanded ? '88px' : '52dvh' }}
      >
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-label={expanded ? 'Show the map' : 'Show more'} className="flex h-8 w-full shrink-0 items-center justify-center">
          <span className="h-1.5 w-10 rounded-full bg-[#cbd5e1]" />
        </button>

        <div className="no-scrollbar flex-1 space-y-7 overflow-y-auto pb-32">
          <div className="px-4 pt-1">
            <button
              type="button"
              onClick={() => navigate(TRUCKS)}
              className="flex w-full items-center gap-3 rounded-full border border-[#e2e8f0] bg-[#ffffff] px-5 py-3.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
            >
              <Search size={20} strokeWidth={2.2} />
              <span className="truncate text-[15px] font-bold">Where do you want to deliver goods?</span>
            </button>
          </div>

          {activeRide && <div className="px-4">{activeRide}</div>}

          <section className="px-4">
            <div className="px-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">Services</p>
              <h1 className="mt-1 text-[19px] font-semibold text-[#0f172a]">Logistics &amp; Transportation</h1>
              <p className="mt-1 text-[12px] font-semibold text-[#64748b]">Select a service to get started.</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5">
              {SERVICES.map((s) => (
                <button key={s.id} type="button" onClick={() => navigate(s.path, { state: s.state })} className="flex flex-col items-center gap-2">
                  <span
                    className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[18px] p-1.5"
                    style={{ backgroundImage: `linear-gradient(135deg, ${s.from} 0%, ${s.to} 100%)` }}
                  >
                    <img src={`/services/${s.id}.webp`} alt="" className="h-full w-full rounded-[12px] object-contain mix-blend-multiply" />
                  </span>
                  <span className="text-center text-[10px] font-bold uppercase leading-tight tracking-[0.02em] text-[#1e293b]">{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <InsuranceCard onOpen={() => navigate('/taxi/user/insurance')} />

          <footer className="relative mx-4 h-[300px] overflow-hidden bg-[#f9f8f0]">
            <img src="/city_skyline_footer.png" alt="" loading="lazy" className="absolute inset-x-0 bottom-0 w-full translate-y-[36%] opacity-25" />
            <div className="relative mx-auto w-fit pt-6">
              <p className="text-[42px] font-black leading-none tracking-tight">
                <span className="text-[#ffb400]">Ninja</span> Truck
              </p>
              <p className="mt-2 text-[16px] font-semibold italic [font-synthesis:style]">No Highway Is Too Long</p>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                Made for everyone, crafted for you. <img src="/flag-in.svg" alt="India" className="h-3" />
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default HomeSheet;
