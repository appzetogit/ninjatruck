import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import NinjaHeader from './components/NinjaHeader';
import NinjaFooter from './components/NinjaFooter';
import BookingModal from './components/BookingModal';
import useSmoothScroll from './hooks/useSmoothScroll';
import { pathForTab } from './landingTabs';
import { LandingContentProvider, useLanding } from './landingContentContext';
import './landing.css';

/**
 * Shell for the public marketing routes other than "/": Ninja Truck header and
 * footer, smooth scroll and the booking modal.
 *
 * The landing pages were written as a standalone app driven by an `activeTab`
 * state. The shell keeps that contract: `setActiveTab` navigates, so the URL
 * stays the single source of truth.
 *
 * `.zicab-landing` is what scopes landing.css; without it every landing style
 * would apply to the taxi app too. NinjaHeader/NinjaFooter sit outside it so
 * the landing.css element rules can't restyle their Tailwind markup.
 */

const NINJA_SEO_TITLE = 'Ninja Truck — All Over India Logistics';

function LandingShellBody() {
  const { waLink, seo } = useLanding();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useSmoothScroll();

  // index.html ships a static title and description; the CMS values are
  // applied at runtime so they stay editable from the admin panel.
  useEffect(() => {
    document.title = seo?.title || NINJA_SEO_TITLE;
    if (seo?.description) {
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', seo.description);
    }
  }, [seo?.title, seo?.description, pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const setActiveTab = useCallback((id) => navigate(pathForTab(id)), [navigate]);

  const openBookingModal = useCallback((vehicle = null) => {
    setSelectedVehicle(vehicle);
    setBookingOpen(true);
  }, []);

  return (
    <>
      <NinjaHeader />
      <div className="zicab-landing">
        <div className="scroll-progress" aria-hidden="true" />

        <main className="app-main-content">
          <Outlet context={{ openBookingModal, setActiveTab }} />
        </main>

        <a
          className="wa-float"
          href={waLink()}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Ninja Truck support on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.34-1.59-1.5-1.89-.15-.3-.02-.46.13-.61.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.37 2.98 1.17 2.98.78 3.52.73.54-.05 1.75-.71 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.82L2 22l5.4-1.42a9.86 9.86 0 004.64 1.18c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z" />
          </svg>
        </a>

        <BookingModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          selectedVehicle={selectedVehicle}
        />
      </div>
      <NinjaFooter />
    </>
  );
}

/**
 * The provider wraps the body rather than living inside it, so the shell's own
 * chrome (the WhatsApp button) reads the same CMS content as the pages, and the
 * content is fetched once for all routes instead of per page.
 */
export default function LandingShell() {
  return (
    <LandingContentProvider>
      <LandingShellBody />
    </LandingContentProvider>
  );
}
