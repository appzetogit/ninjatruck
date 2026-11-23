import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  CircleAlert,
  Clock,
  Cpu,
  Database,
  FileText,
  IndianRupee,
  Loader2,
  Map,
  MapPin,
  RefreshCw,
  Route,
  Server,
  Shield,
  Tags,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { adminService } from '../../services/adminService';
import { BACKEND_LABEL } from '../../../../shared/api/runtimeConfig';
import { INDIA_CENTER, useBaseGoogleMapsLoader } from '../../utils/googleMaps';

/**
 * Admin home - Ninja Truck operations console.
 *
 * Brand: ink #111111, yellow #F9C105, hard offset shadows, Outfit display type
 * (`nt-display`, see adminTheme.css). All data comes from
 * adminService.getDashboardData and refreshes every minute.
 */

const currency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const DASHBOARD_REFRESH_INTERVAL_MS = 60000;

const INK = '#111111';
const YELLOW = '#F9C105';

const card = 'rounded-2xl border-2 border-[#111111] bg-white shadow-[4px_4px_0_0_#111111]';

const SectionTitle = ({ icon: Icon, children, aside }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h3 className="nt-display flex items-center gap-2 text-[15px] font-black uppercase tracking-wide text-[#111111]">
      {Icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F9C105] text-[#111111]">
          <Icon size={15} strokeWidth={2.5} />
        </span>
      )}
      {children}
    </h3>
    {aside}
  </div>
);

const EmptyState = ({ title, hint }) => (
  <div className="flex h-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#111111]/20 bg-[#FFF8E1] p-4 text-center">
    <Truck size={22} className="mb-2 text-[#111111]/40" />
    <p className="text-sm font-bold text-[#111111]">{title}</p>
    <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
  </div>
);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const readAdminName = () => {
  try {
    const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    return String(info?.name || '').split(' ')[0] || 'Admin';
  } catch {
    return 'Admin';
  }
};

const MainDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [timeframe, setTimeframe] = useState('Today'); // Today | Overall
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  const [adminName] = useState(readAdminName);

  const { isLoaded } = useBaseGoogleMapsLoader();

  const fetchData = async (silent = false) => {
    try {
      silent ? setIsRefreshing(true) : setIsLoading(true);
      const res = await adminService.getDashboardData();
      setDashboard(res?.data || res || {});
      setDashboardError('');
      setLastUpdatedAt(new Date());
    } catch {
      setDashboardError(`Could not reach ${BACKEND_LABEL}. Showing the last numbers we had.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), DASHBOARD_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = dashboard?.totalUsers || 0;
  const totalDrivers = dashboard?.totalDrivers?.total || 0;
  const approvedDrivers = dashboard?.totalDrivers?.approved || 0;
  const totalOwners = dashboard?.totalOwners || 0;

  // Counts for right now, sent uncached by the backend.
  const live = dashboard?.live || {};
  const todayEarnings = dashboard?.todayEarnings || {};
  const overallEarnings = dashboard?.overallEarnings || {};
  const notifiedSos = dashboard?.notifiedSos || {};
  const todayTrips = dashboard?.todayTrips || {};
  const overallTrips = dashboard?.overallTrips || {};

  // Share of the online fleet that is carrying a load right now.
  const fleetUtilization = useMemo(() => {
    const online = Number(live.onlineDrivers || 0);
    if (online === 0) return 0;
    return Math.round((Number(live.driversOnTrip || 0) / online) * 100);
  }, [live.onlineDrivers, live.driversOnTrip]);

  const systemChecks = useMemo(() => {
    const health = live.systemHealth || {};
    const label = (value, fallback) => (value ? String(value) : fallback);
    const ok = (value) => ['operational', 'connected', 'healthy', 'active'].includes(String(value || '').toLowerCase());
    return [
      { name: 'Application API', icon: Server, status: 'Answering', healthy: true },
      { name: 'Database', icon: Database, status: label(health.database, 'unknown'), healthy: ok(health.database) },
      { name: 'Socket Server', icon: Activity, status: label(health.socket, 'unknown'), healthy: ok(health.socket) },
      { name: 'Redis Cache', icon: Cpu, status: label(health.redis, 'unknown'), healthy: ok(health.redis) },
      { name: 'Google Maps Key', icon: Map, status: label(health.maps, 'unknown'), healthy: ok(health.maps) },
    ];
  }, [live.systemHealth]);

  const topDrivers = dashboard?.topDrivers || [];
  const driverPositions = live.driverPositions || [];
  const sos = live.sos || {};

  // Revenue area chart
  const chartWidth = 500;
  const chartHeight = 160;
  const revenueChartData = useMemo(
    () => (overallEarnings?.chart || []).map((item) => ({ label: item.label, value: item.amount })),
    [overallEarnings],
  );

  const revenuePoints = useMemo(() => {
    if (revenueChartData.length === 0) return [];
    const maxVal = Math.max(...revenueChartData.map((d) => d.value), 1000);
    const step = revenueChartData.length > 1 ? chartWidth / (revenueChartData.length - 1) : 0;
    return revenueChartData.map((d, i) => ({
      x: revenueChartData.length > 1 ? i * step : chartWidth / 2,
      y: chartHeight - (d.value / maxVal) * (chartHeight - 30) - 15,
      label: d.label,
      value: d.value,
    }));
  }, [revenueChartData]);

  const linePath = useMemo(
    () => (revenuePoints.length ? 'M ' + revenuePoints.map((p) => `${p.x} ${p.y}`).join(' L ') : ''),
    [revenuePoints],
  );
  const areaPath = useMemo(
    () => (revenuePoints.length ? `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : ''),
    [revenuePoints, linePath],
  );

  // Booking donut
  const bookingDonutData = useMemo(() => {
    const completed = todayTrips.completed || 0;
    const cancelled = todayTrips.cancelled || 0;
    const pending = todayTrips.scheduled || 0;
    const total = completed + cancelled + pending;
    if (total === 0) return [];
    return [
      { label: 'Completed', value: completed, color: '#16A34A', percent: Math.round((completed / total) * 100) },
      { label: 'Cancelled', value: cancelled, color: '#DC2626', percent: Math.round((cancelled / total) * 100) },
      { label: 'Scheduled', value: pending, color: YELLOW, percent: Math.round((pending / total) * 100) },
    ];
  }, [todayTrips]);

  const donutRadius = 32;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutSegments = useMemo(() => {
    let accumulated = 0;
    return bookingDonutData.map((seg) => {
      const out = {
        ...seg,
        strokeDasharray: `${(seg.percent / 100) * donutCircumference} ${donutCircumference}`,
        strokeDashoffset: -accumulated,
      };
      accumulated += (seg.percent / 100) * donutCircumference;
      return out;
    });
  }, [bookingDonutData, donutCircumference]);

  const show = (value) => (isLoading ? '…' : value);
  const pendingApprovals = Number(live.pendingApprovals || 0);
  const activeSos = Number(sos.active || 0);
  const allHealthy = systemChecks.every((check) => check.healthy);

  const quickActions = [
    { label: 'Approve Drivers', to: '/admin/drivers/pending', icon: UserCheck, badge: pendingApprovals },
    { label: 'All Bookings', to: '/admin/trips', icon: Route },
    { label: 'Pricing & Zones', to: '/admin/pricing', icon: Tags },
    { label: 'Website Content', to: '/admin/settings/cms/landing', icon: FileText },
  ];

  const networkKpis = [
    { label: 'Customers', value: totalUsers, icon: Users },
    { label: 'Drivers', value: totalDrivers, icon: Truck },
    { label: 'Approved Drivers', value: approvedDrivers, icon: UserCheck },
    { label: 'Fleet Owners', value: totalOwners, icon: Building2 },
  ];

  const liveKpis = [
    { label: 'Drivers Online', value: live.onlineDrivers ?? 0, icon: Wifi },
    { label: 'Loads In Transit', value: live.ongoingTrips ?? 0, icon: Truck },
    { label: 'Fleet Utilisation', value: `${fleetUtilization}%`, icon: TrendingUp },
    { label: 'Pending Approvals', value: pendingApprovals, icon: Clock, alert: pendingApprovals > 0 },
  ];

  const summary =
    timeframe === 'Today'
      ? { revenue: todayEarnings.total, commission: todayEarnings.admin_commission, trips: todayTrips.total }
      : { revenue: overallEarnings.total, commission: overallEarnings.admin_commission, trips: overallTrips.total };

  return (
    <div className="redigo-admin-root nt-dash min-h-screen bg-[#FFF8E1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-[#111111] bg-[#111111] p-6 text-white shadow-[6px_6px_0_0_#F9C105] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#F9C105]/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-3 right-6 hidden gap-6 opacity-40 md:flex">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="h-1.5 w-10 bg-[#F9C105]" />
            ))}
          </div>

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dashboardError ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F9C105]">
                  {dashboardError ? 'Connection problem' : 'Live operations'}
                </span>
              </div>
              <h1 className="nt-display !text-white text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
                {greeting()}, {adminName}.
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium text-white/60">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}
                {isLoading
                  ? 'Loading today’s numbers…'
                  : `${live.ongoingTrips ?? 0} load${(live.ongoingTrips ?? 0) === 1 ? '' : 's'} in transit, ${live.onlineDrivers ?? 0} driver${(live.onlineDrivers ?? 0) === 1 ? '' : 's'} online.`}
              </p>
            </div>

            <div className="flex items-stretch gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Today’s revenue</p>
                <p className="nt-display mt-1 text-3xl font-black text-[#F9C105]">₹{show(currency(todayEarnings.total))}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#F9C105] px-4 text-[#111111] transition hover:-translate-y-0.5"
                title={lastUpdatedAt ? `Last synced ${lastUpdatedAt.toLocaleTimeString()}` : 'Refresh'}
              >
                <RefreshCw size={18} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sync'}
                </span>
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {quickActions.map(({ label, to, icon, badge }) => { const Icon = icon; return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide text-white transition hover:border-[#F9C105] hover:bg-[#F9C105] hover:text-[#111111]"
              >
                <Icon size={15} />
                <span className="truncate">{label}</span>
                {badge > 0 && (
                  <span className="ml-auto rounded-full bg-[#F9C105] px-2 py-0.5 text-[10px] font-black text-[#111111] group-hover:bg-[#111111] group-hover:text-[#F9C105] sm:ml-1">
                    {badge}
                  </span>
                )}
                <ArrowRight size={13} className="ml-auto hidden opacity-0 transition group-hover:opacity-100 sm:block" />
              </button>
            ); })}
          </div>
        </section>

        {dashboardError && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-600 bg-rose-50 p-4" role="alert">
            <CircleAlert size={20} className="shrink-0 text-rose-600" />
            <p className="text-sm font-bold text-rose-800">{dashboardError}</p>
          </div>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[
            { title: 'Network', items: networkKpis },
            { title: 'Right now', items: liveKpis },
          ].map((group) => (
            <div key={group.title} className={`${card} p-5`}>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
              <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
                {group.items.map(({ label, value, icon, alert }) => { const Icon = icon; return (
                  <div
                    key={label}
                    className={`rounded-xl p-3 ${alert ? 'bg-[#F9C105]' : 'bg-[#FFF8E1]'}`}
                  >
                    <Icon size={16} strokeWidth={2.5} className="text-[#111111]" />
                    <p className="nt-display mt-2 text-2xl font-black leading-none text-[#111111]">{show(value)}</p>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
                  </div>
                ); })}
              </div>
            </div>
          ))}
        </section>

        {/* REVENUE / BOOKINGS / HEALTH */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${card} p-5 md:col-span-2`}>
            <SectionTitle
              icon={IndianRupee}
              aside={
                <div className="flex rounded-lg border-2 border-[#111111] p-0.5">
                  {['Today', 'Overall'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTimeframe(tab)}
                      className={`rounded-md px-3 py-1 text-[11px] font-black uppercase tracking-wide transition ${
                        timeframe === tab ? 'bg-[#111111] text-[#F9C105]' : 'text-[#111111] hover:bg-[#FFF8E1]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              }
            >
              Revenue
            </SectionTitle>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Revenue', value: `₹${currency(summary.revenue)}` },
                { label: 'Commission', value: `₹${currency(summary.commission)}`, accent: true },
                { label: 'Bookings', value: summary.trips || 0 },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 ${s.accent ? 'bg-[#F9C105]' : 'bg-[#FFF8E1]'}`}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#111111]/60">{s.label}</p>
                  <p className="nt-display mt-1 text-lg font-black text-[#111111]">{show(s.value)}</p>
                </div>
              ))}
            </div>

            {revenueChartData.length === 0 ? (
              <EmptyState title="No revenue history yet" hint="The trend appears here once bookings are completed." />
            ) : (
              <>
                <div className="relative">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
                    <defs>
                      <linearGradient id="ntRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={YELLOW} stopOpacity="0.55" />
                        <stop offset="1" stopColor={YELLOW} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#ntRevenueFill)" />
                    <path d={linePath} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
                    {revenuePoints.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredRevenueIndex === idx ? 7 : 4.5}
                        fill={hoveredRevenueIndex === idx ? YELLOW : '#FFFFFF'}
                        stroke={INK}
                        strokeWidth="2.5"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRevenueIndex(idx)}
                        onMouseLeave={() => setHoveredRevenueIndex(null)}
                      />
                    ))}
                  </svg>
                  {hoveredRevenueIndex !== null && revenuePoints[hoveredRevenueIndex] && (
                    <div
                      className="pointer-events-none absolute rounded-lg bg-[#111111] px-2.5 py-1.5 text-[11px] font-bold !text-white shadow-xl"
                      style={{
                        left: `${(revenuePoints[hoveredRevenueIndex].x / chartWidth) * 100}%`,
                        top: `${(revenuePoints[hoveredRevenueIndex].y / chartHeight) * 100 - 30}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <span className="block text-[#F9C105]">{revenuePoints[hoveredRevenueIndex].label}</span>₹
                      {currency(revenuePoints[hoveredRevenueIndex].value)}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between border-t-2 border-[#111111]/10 pt-2 text-[10px] font-bold uppercase text-slate-500">
                  {revenueChartData.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`${card} p-5`}>
            <SectionTitle icon={Route}>Bookings Today</SectionTitle>
            {bookingDonutData.length === 0 ? (
              <EmptyState title="No bookings today" hint="Completed, cancelled and scheduled loads show here." />
            ) : (
              <>
                <div className="relative flex items-center justify-center py-1">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r={donutRadius} fill="transparent" stroke="#FFF8E1" strokeWidth="12" />
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment(seg)}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute text-center">
                    <span className="nt-display block text-2xl font-black text-[#111111]">
                      {hoveredDonutSegment ? `${hoveredDonutSegment.percent}%` : todayTrips.total || 0}
                    </span>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">
                      {hoveredDonutSegment ? hoveredDonutSegment.label : 'Bookings'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-2 border-t-2 border-[#111111]/10 pt-3">
                  {bookingDonutData.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                        {seg.label}
                      </span>
                      <span className="font-black text-[#111111]">
                        {seg.value} <span className="font-semibold text-slate-400">({seg.percent}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`${card} flex flex-col p-5`}>
            <SectionTitle icon={Server}>System Health</SectionTitle>
            <div className="flex-1 space-y-2">
              {systemChecks.map(({ name, icon, status, healthy }) => { const Icon = icon; return (
                <div key={name} className="flex items-center justify-between gap-2 rounded-lg bg-[#FFF8E1] px-3 py-2 text-[12px]">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <Icon size={13} className="text-[#111111]/60" />
                    {name}
                  </span>
                  <span className={`flex shrink-0 items-center gap-1.5 font-black capitalize ${healthy ? 'text-emerald-700' : 'text-rose-600'}`}>
                    <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {status}
                  </span>
                </div>
              ); })}
            </div>
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-center text-[11px] font-bold ${
                allHealthy ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {allHealthy
                ? 'All systems running normally.'
                : `Needs attention: ${systemChecks.filter((c) => !c.healthy).map((c) => c.name).join(', ')}`}
            </p>
          </div>
        </section>

        {/* LEADERBOARD / SOS / LIVE */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className={`${card} p-5`}>
            <SectionTitle icon={Award}>Top Drivers</SectionTitle>
            {topDrivers.length === 0 && !isLoading ? (
              <EmptyState title="No completed loads yet" hint="Drivers with the most completed bookings appear here." />
            ) : (
              <ol className="space-y-2">
                {topDrivers.map((lead, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-[#FFF8E1] px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`nt-display flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                          i === 0 ? 'bg-[#F9C105] text-[#111111]' : 'bg-[#111111] text-[#F9C105]'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[13px] font-bold text-[#111111]">{lead.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {Number(lead.rating) > 0 ? `★ ${Number(lead.rating).toFixed(2)}` : 'Not rated yet'}
                          {lead.online ? ' · online' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[12px] font-black text-[#111111]">{lead.trips} loads</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className={`${card} flex flex-col p-5 ${activeSos > 0 ? '!border-rose-600 !shadow-[4px_4px_0_0_#e11d48]' : ''}`}>
            <SectionTitle
              icon={Shield}
              aside={
                activeSos > 0 && (
                  <span className="animate-pulse rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                    Active SOS
                  </span>
                )
              }
            >
              Safety & SOS
            </SectionTitle>
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 text-center ${activeSos > 0 ? 'bg-rose-600 text-white' : 'bg-[#FFF8E1]'}`}>
                <p className={`nt-display text-4xl font-black ${activeSos > 0 ? '!text-white' : 'text-[#111111]'}`}>{activeSos}</p>
                <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${activeSos > 0 ? '!text-white/80' : 'text-slate-500'}`}>
                  Open alerts
                </p>
              </div>
              <div className="rounded-xl bg-[#FFF8E1] p-4 text-center">
                <p className="nt-display text-4xl font-black text-[#111111]">{sos.resolved || 0}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Resolved</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between text-slate-600">
                <span>Support tickets open</span>
                <span className="font-black text-[#111111]">{notifiedSos.total || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Of those, assigned</span>
                <span className="font-black text-[#111111]">{notifiedSos.assigned || 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/safety')}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-[12px] font-black uppercase tracking-wider !text-white transition hover:bg-rose-700"
            >
              <AlertTriangle size={14} />
              Open Safety Center
            </button>
          </div>

          <div className="flex flex-col rounded-2xl border-2 border-[#111111] bg-[#111111] p-5 text-white shadow-[4px_4px_0_0_#F9C105]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="nt-display flex items-center gap-2 text-[15px] font-black uppercase tracking-wide !text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F9C105] text-[#111111]">
                  <Activity size={15} strokeWidth={2.5} />
                </span>
                Fleet Live
              </h3>
              <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#F9C105]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F9C105]" /> Live
              </span>
            </div>
            <div className="flex-1 space-y-1">
              {[
                { label: 'Drivers online', value: live.onlineDrivers ?? 0 },
                { label: 'Drivers carrying a load', value: live.driversOnTrip ?? 0 },
                { label: 'Customers connected', value: live.onlineCustomers ?? 0 },
                { label: 'Loads in transit', value: live.ongoingTrips ?? 0 },
                { label: 'Drivers awaiting approval', value: pendingApprovals },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/10 py-2 text-[13px] last:border-0">
                  <span className="text-white/70">{row.label}</span>
                  <span className="nt-display text-lg font-black text-[#F9C105]">{show(row.value)}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/drivers')}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#F9C105] py-2.5 text-[12px] font-black uppercase tracking-wider text-[#111111] transition hover:-translate-y-0.5"
            >
              Manage Drivers <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* MAP */}
        <section className={`${card} p-5`}>
          <SectionTitle
            icon={MapPin}
            aside={
              <div className="hidden items-center gap-4 text-[11px] font-bold text-slate-600 sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Free</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F9C105] ring-1 ring-[#111111]" /> On a load</span>
              </div>
            }
          >
            Fleet Map
          </SectionTitle>
          <p className="-mt-2 mb-4 text-[12px] text-slate-500">
            {driverPositions.length > 0
              ? `${driverPositions.length} driver${driverPositions.length === 1 ? '' : 's'} online right now.`
              : 'No drivers are online right now.'}
          </p>
          <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-[#111111] bg-[#FFF8E1]">
            {isLoaded ? (
              <GoogleMap
                mapContainerClassName="w-full h-full"
                center={INDIA_CENTER}
                zoom={5}
                options={{
                  disableDefaultUI: true,
                  styles: [
                    { elementType: 'geometry', stylers: [{ color: '#f6f2e6' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#5f5a4d' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#f6f2e6' }] },
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
                    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f9d45c' }] },
                    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e6b204' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfd6dc' }] },
                  ],
                }}
              >
                {driverPositions
                  .filter((driver) => Number.isFinite(driver.lat) && Number.isFinite(driver.lng))
                  .map((driver) => (
                    <MarkerF
                      key={driver.id}
                      position={{ lat: driver.lat, lng: driver.lng }}
                      title={`${driver.name}${driver.onTrip ? ' - on a load' : ' - free'}`}
                      icon={{
                        path: window.google?.maps?.SymbolPath?.CIRCLE,
                        scale: 7,
                        fillColor: driver.onTrip ? YELLOW : '#22C55E',
                        fillOpacity: 1,
                        strokeColor: INK,
                        strokeWeight: 2,
                      }}
                    />
                  ))}
              </GoogleMap>
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-500">
                <Loader2 size={24} className="animate-spin text-[#111111]" />
                Loading map…
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainDashboard;
