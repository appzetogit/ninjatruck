import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Menu, Phone, X } from 'lucide-react';
import { NINJA_BRAND, NINJA_NAV, USER_LOGIN } from './ninjaBrand';

/**
 * Ninja Truck top bar + sticky header, shared by the home page and every other
 * marketing page. Tailwind only; it renders outside `.zicab-landing` so the
 * landing.css element rules can't restyle it.
 */
export default function NinjaHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const bookTruck = () => navigate(USER_LOGIN);
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      <div className="hidden lg:flex justify-between items-center px-8 lg:px-16 py-3 bg-[#111111] text-[#F9C105] font-bold text-sm tracking-widest border-b-4 border-[#F9C105] font-['Outfit',sans-serif]">
        <span>(WE DELIVER) ALL OVER INDIA LOGISTICS</span>
        <div className="flex gap-8">
          <a href={`tel:${NINJA_BRAND.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone size={16} />
            <span>CALL US {NINJA_BRAND.phone}</span>
          </a>
          <a href={`mailto:${NINJA_BRAND.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail size={16} />
            <span>{NINJA_BRAND.email.toUpperCase()}</span>
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-[#F9C105]/95 backdrop-blur-lg border-b-2 border-[#e6b204] shadow-2xl font-['Outfit',sans-serif]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex items-center justify-between h-24">
          <Link to="/" className="font-black text-2xl xl:text-3xl tracking-tighter text-[#111111] flex items-center gap-3 leading-none whitespace-nowrap shrink-0">
            <img src={NINJA_BRAND.logo} alt="" className="w-11 h-11 rounded-xl" />
            <span className="drop-shadow-sm">NINJA TRUCK</span>
            <span className="hidden 2xl:inline font-bold tracking-widest text-slate-800 text-lg">LOGISTICS</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-10 font-black text-slate-800 tracking-wider text-sm uppercase">
            {NINJA_NAV.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className={`hover:text-black transition-colors ${isActive(to) ? 'text-black border-b-2 border-black pb-1' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 xl:gap-4 shrink-0">
            <Link to={USER_LOGIN} className="font-bold text-slate-800 hover:text-black px-4 py-2 transition-colors">
              LOGIN
            </Link>
            <button
              type="button"
              onClick={bookTruck}
              className="bg-[#111111] text-[#F9C105] hover:bg-black px-6 xl:px-8 py-3 font-black tracking-widest uppercase whitespace-nowrap transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
            >
              Book Truck
            </button>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 -mr-2 text-[#111111]"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t-2 border-[#111111] bg-[#F9C105] px-6 py-6 flex flex-col gap-5 font-black tracking-wider uppercase text-[#111111]">
            {NINJA_NAV.map(({ label, to }) => (
              <Link key={label} to={to} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <Link to={USER_LOGIN}>Login</Link>
            <button
              type="button"
              onClick={bookTruck}
              className="bg-[#111111] text-[#F9C105] px-6 py-4 font-black tracking-widest uppercase"
            >
              Book Truck
            </button>
          </div>
        )}
      </header>
    </>
  );
}
