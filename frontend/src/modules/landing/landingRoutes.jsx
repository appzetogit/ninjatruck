import { Route, useOutletContext } from 'react-router-dom';
import LandingShell from './LandingShell';
import { LANDING_TABS } from './landingTabs';
import Home from './pages/Home';
import NinjaTruckHome from './pages/NinjaTruckHome';
import AboutUs from './pages/AboutUs';
import Services from './pages/Services';
import Corporate from './pages/Corporate';
import Partner from './pages/Partner';
import Driver from './pages/Driver';
import Advertise from './pages/Advertise';
import ContactUs from './pages/ContactUs';
import ZiBus from './pages/ZiBus';

/**
 * The landing pages take `openBookingModal` / `setActiveTab` as props, from when
 * they were a standalone tab-driven app. LandingShell puts both on the outlet
 * context, and this adapter feeds them back in as props — so the pages stay
 * unmodified and portable.
 */
const withShellContext = (Component) => {
  const Wrapped = () => <Component {...(useOutletContext() ?? {})} />;
  Wrapped.displayName = `LandingRoute(${Component.name})`;
  return Wrapped;
};

const PAGES = {
  home: withShellContext(Home),
  about: withShellContext(AboutUs),
  services: withShellContext(Services),
  bus: withShellContext(ZiBus),
  corporate: withShellContext(Corporate),
  partner: withShellContext(Partner),
  driver: withShellContext(Driver),
  advertise: withShellContext(Advertise),
  contact: withShellContext(ContactUs),
};

// Paths come from LANDING_TABS so the nav highlighting and the router can never
// drift apart.
// "/" is the Ninja Truck home page. It has its own header and footer, so it sits
// outside LandingShell. The other marketing pages stay inside the shell.
const landingRoutes = (
  <>
    <Route path="/" element={<NinjaTruckHome />} />
    <Route element={<LandingShell />}>
      {LANDING_TABS.filter(({ id }) => id !== 'home').map(({ id, path }) => {
        const Page = PAGES[id];
        return <Route key={id} path={path} element={<Page />} />;
      })}
    </Route>
  </>
);

export default landingRoutes;
