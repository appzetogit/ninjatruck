import { Link } from 'react-router-dom';
import { NINJA_BRAND } from './ninjaBrand';

const COLUMNS = [
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['Corporate', '/corporate'],
      ['Partner With Us', '/partner'],
      ['Drive With Us', '/drive-with-us'],
      ['Advertise', '/advertise'],
    ],
  },
  {
    title: 'Services',
    links: [
      ['Mini Trucks', '/services'],
      ['Heavy Vehicles', '/services'],
      ['Intercity', '/services'],
      ['Packers & Movers', '/services'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['FAQs', '/faq'],
      ['Contact Us', '/contact'],
      ['Terms & Conditions', '/terms'],
      ['Privacy Policy', '/privacy'],
      ['Refund Policy', '/refund'],
    ],
  },
];

/** Ninja Truck footer, shared by every marketing page. Tailwind only. */
export default function NinjaFooter() {
  return (
    <footer className="bg-[#F9C105] pt-24 pb-12 px-6 lg:px-16 text-slate-800 border-t-2 border-[#111111] font-['Outfit',sans-serif]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 lg:gap-8 mb-20">
        <div className="lg:col-span-2 lg:pr-16">
          <Link to="/" className="font-black text-4xl tracking-tighter text-[#111111] flex items-center gap-3 mb-8">
            <img src={NINJA_BRAND.logo} alt="" className="w-12 h-12 rounded-xl" />
            NINJA TRUCK
          </Link>
          <p className="font-bold leading-relaxed mb-8 text-lg">
            We provide the best logistics and truck rental services in the region. Reliable, fast, and secure deliveries
            at your fingertips.
          </p>
          <div className="font-black tracking-widest text-[#111111] text-xl bg-white/40 inline-block px-4 py-2 rounded-lg border border-[#111111]/10">
            {NINJA_BRAND.website}
          </div>
        </div>
        {COLUMNS.map(({ title, links }) => (
          <div key={title}>
            <h4 className="font-black text-[#111111] text-xl uppercase tracking-widest mb-8">{title}</h4>
            <ul className="flex flex-col gap-5 font-bold tracking-wide">
              {links.map(([label, to]) => (
                <li key={label}>
                  <Link className="hover:text-black hover:underline" to={to}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto border-t-2 border-[#111111]/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 font-bold tracking-wider text-sm text-[#111111]">
        <div className="flex items-center gap-8">
          <Link className="hover:text-black hover:underline" to="/privacy">PRIVACY POLICY</Link>
          <Link className="hover:text-black hover:underline" to="/terms">TERMS &amp; CONDITIONS</Link>
        </div>
        <div className="font-black text-center">COPYRIGHT {new Date().getFullYear()} © NINJA TRUCK LOGISTICS.</div>
      </div>
    </footer>
  );
}
