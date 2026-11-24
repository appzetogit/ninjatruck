import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, User } from 'lucide-react';
import HomeSheet from '../components/HomeSheet';

import taxiFallback from '../../../assets/user-app/taxi.png';
import bikeFallback from '../../../assets/user-app/bike.png';
import parcelFallback from '../../../assets/user-app/parcel.png';
import busFallback from '../../../assets/user-app/bus.png';
import api from '../../../shared/api/axiosInstance';

import { getLocalUserToken, clearLocalUserSession } from '../services/authService';
import {
  CURRENT_RIDE_UPDATED_EVENT,
  getCurrentRide,
  getCurrentRideSignature,
  isActiveCurrentRide,
  saveCurrentRide,
  clearCurrentRide,
} from '../services/currentRideService';

const ACTIVE_RIDE_SYNC_INTERVAL_MS = 15000;
const IDLE_RIDE_SYNC_INTERVALS_MS = [60000, 120000, 180000];
const DEFERRED_SECTION_DELAY_MS = 250;
const FORCED_SYNC_COOLDOWN_MS = 10000;

const getCurrentRideIcon = (ride) => {
  const customIcon = String(
    ride?.vehicleIconUrl ||
    ride?.vehicle?.vehicleIconUrl ||
    ride?.vehicle?.icon ||
    ride?.driver?.vehicleIconUrl ||
    '',
  ).trim();

  if (customIcon && !customIcon.includes('localhost') && !customIcon.startsWith('/')) {
    return customIcon;
  }

  const serviceType = String(ride?.serviceType || ride?.type || '').toLowerCase();
  const iconType = String(ride?.vehicleIconType || ride?.driver?.vehicleIconType || ride?.driver?.vehicleType || '').toLowerCase();

  if (serviceType === 'parcel' || serviceType === 'delivery') {
    return parcelFallback;
  }

  if (iconType.includes('bike')) {
    return bikeFallback;
  }

  if (iconType.includes('auto')) {
    return taxiFallback;
  }

  if (serviceType === 'bus') {
    return busFallback;
  }

  return taxiFallback;
};

const unwrapApiPayload = (response) => response?.data?.data || response?.data || response;

const formatScheduledDateTime = (value) => {
  if (!value) {
    return 'Scheduled time pending';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Scheduled time pending';
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getScheduledCountdownLabel = (value, now = Date.now()) => {
  const parsed = value ? new Date(value) : null;
  const time = parsed?.getTime?.() || NaN;

  if (!Number.isFinite(time)) {
    return '';
  }

  const diffMs = time - now;
  if (diffMs <= 0) {
    return 'Pickup window is opening now';
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }

  return `Starts in ${minutes}m`;
};

const normalizeRentalCurrentRideSnapshot = (ride = {}, previousRide = {}) => {
  if (!ride) {
    return null;
  }

  const assignedVehicle = ride.assignedVehicle || previousRide.assignedVehicle || {};
  const selectedPackage = ride.selectedPackage || previousRide.selectedPackage || null;
  const rideMetrics = ride.rideMetrics || previousRide.rideMetrics || {};
  const serviceLocation = ride.serviceLocation || previousRide.serviceLocation || null;
  const bookingReference = ride.bookingReference || previousRide.bookingReference || '';
  const vehicleName =
    assignedVehicle?.name ||
    ride.vehicleName ||
    previousRide.vehicleName ||
    previousRide?.vehicle?.name ||
    'Assigned Vehicle';
  const vehicleImage =
    assignedVehicle?.image ||
    ride.vehicleImage ||
    previousRide.vehicleImage ||
    previousRide?.vehicle?.image ||
    '';
  const vehicleCategory =
    assignedVehicle?.vehicleCategory ||
    ride.vehicleCategory ||
    previousRide.vehicleCategory ||
    previousRide?.driver?.vehicle ||
    'Rental';

  return {
    ...previousRide,
    ...ride,
    rideId: ride.id || ride.rideId || previousRide.rideId || '',
    bookingReference,
    fare: rideMetrics?.currentCharge ?? ride.fare ?? previousRide.fare ?? ride.payableNow ?? 0,
    totalCost: ride.totalCost ?? previousRide.totalCost ?? 0,
    advancePaid: ride.payableNow ?? ride.advancePaid ?? previousRide.advancePaid ?? 0,
    status: ride.status || previousRide.status || 'assigned',
    liveStatus: ride.status || ride.liveStatus || previousRide.liveStatus || 'assigned',
    serviceType: 'rental',
    vehicleName,
    vehicleImage,
    vehicleCategory,
    vehicle: {
      ...(previousRide.vehicle || {}),
      name: vehicleName,
      image: vehicleImage,
      vehicleIconUrl: vehicleImage,
    },
    driver: {
      ...(previousRide.driver || {}),
      name: vehicleName,
      vehicle: vehicleCategory,
      vehicleType: vehicleCategory,
      vehicleIconUrl: vehicleImage,
    },
    vehicleIconUrl: vehicleImage || previousRide.vehicleIconUrl || '',
    assignedAt: ride.assignedAt || previousRide.assignedAt || ride.createdAt || null,
    completionRequestedAt: ride.completionRequestedAt || previousRide.completionRequestedAt || null,
    hourlyRate: rideMetrics?.hourlyRate ?? ride.hourlyRate ?? previousRide.hourlyRate ?? 0,
    includedHours: rideMetrics?.includedHours ?? ride.includedHours ?? previousRide.includedHours ?? selectedPackage?.durationHours ?? 0,
    basePrice: rideMetrics?.basePrice ?? ride.basePrice ?? previousRide.basePrice ?? selectedPackage?.price ?? ride.totalCost ?? 0,
    extraHourRate: rideMetrics?.extraHourRate ?? ride.extraHourRate ?? previousRide.extraHourRate ?? selectedPackage?.extraHourPrice ?? 0,
    elapsedMinutes: rideMetrics?.elapsedMinutes ?? ride.elapsedMinutes ?? previousRide.elapsedMinutes ?? 0,
    remainingDue: rideMetrics?.remainingDue ?? ride.remainingDue ?? previousRide.remainingDue ?? 0,
    requestedHours: ride.requestedHours ?? previousRide.requestedHours ?? selectedPackage?.durationHours ?? 0,
    selectedPackage,
    paymentMethodLabel: ride.paymentMethodLabel || previousRide.paymentMethodLabel || '',
    serviceLocation,
    assignedVehicle,
    finalCharge: ride.finalCharge ?? previousRide.finalCharge ?? 0,
    finalElapsedMinutes: ride.finalElapsedMinutes ?? previousRide.finalElapsedMinutes ?? 0,
    updatedAt: ride.updatedAt || previousRide.updatedAt || Date.now(),
  };
};

const isRentalCurrentRide = (ride) =>
  String(ride?.serviceType || ride?.type || '').toLowerCase() === 'rental';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pickupAddress, setPickupAddress] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('Appzeto 24:lastLocation') || '{}');
      return String(saved?.address || '').trim() || 'Indore, Madhya Pradesh';
    } catch {
      return 'Indore, Madhya Pradesh';
    }
  });
  const [isLocationLoading, setIsLocationLoading] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('Appzeto 24:lastLocation') || '{}');
      return !saved?.address;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleLocationUpdate = () => {
      try {
        const saved = JSON.parse(window.localStorage.getItem('Appzeto 24:lastLocation') || '{}');
        setPickupAddress(String(saved?.address || '').trim() || 'Indore, Madhya Pradesh');
      } catch { /* keep the last address */ }
    };
    const handleLocationStatus = (e) => {
      setIsLocationLoading(e.detail === 'loading');
    };
    window.addEventListener('Appzeto 24:location-updated', handleLocationUpdate);
    window.addEventListener('Appzeto 24:location-status', handleLocationStatus);
    return () => {
      window.removeEventListener('Appzeto 24:location-updated', handleLocationUpdate);
      window.removeEventListener('Appzeto 24:location-status', handleLocationStatus);
    };
  }, []);

  const [currentRide, setCurrentRide] = useState(() => {
    const ride = getCurrentRide();
    return isActiveCurrentRide(ride) ? ride : null;
  });
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';
  const currentRideRef = useRef(currentRide);
  const lastSyncAtRef = useRef(0);
  const consecutiveIdleMissesRef = useRef(0);
  const lastRideSignatureRef = useRef(getCurrentRideSignature(currentRide));

  const persistCurrentRide = (ride) => {
    const normalizedRide = isActiveCurrentRide(ride) ? ride : null;
    const nextSignature = getCurrentRideSignature(normalizedRide);

    if (lastRideSignatureRef.current === nextSignature) {
      return;
    }

    lastRideSignatureRef.current = nextSignature;
    setCurrentRide(normalizedRide);

    if (normalizedRide) {
      saveCurrentRide(normalizedRide);
    } else {
      clearCurrentRide();
    }
  };

  useEffect(() => {
    currentRideRef.current = currentRide;
    lastRideSignatureRef.current = getCurrentRideSignature(currentRide);
  }, [currentRide]);


  useEffect(() => {
    const token = getLocalUserToken();
    if (!token) {
      clearLocalUserSession();
      navigate('/taxi/user/login', { replace: true });
    }
  }, [navigate]);

  const shouldTickClock =
    String(currentRide?.serviceType || '').toLowerCase() === 'rental'
    || Number.isFinite(currentRide?.scheduledAt ? new Date(currentRide.scheduledAt).getTime() : NaN);

  useEffect(() => {
    if (!shouldTickClock) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shouldTickClock]);

  useEffect(() => {
    let cancelled = false;
    const scheduleDeferredSections = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
        if (!cancelled) {
          setShowDeferredSections(true);
        }
      }, { timeout: DEFERRED_SECTION_DELAY_MS })
      : window.setTimeout(() => {
        if (!cancelled) {
          setShowDeferredSections(true);
        }
      }, DEFERRED_SECTION_DELAY_MS);

    return () => {
      cancelled = true;
      if (typeof scheduleDeferredSections === 'number') {
        window.clearTimeout(scheduleDeferredSections);
        return;
      }

      window.cancelIdleCallback?.(scheduleDeferredSections);
    };
  }, []);

  useEffect(() => {
    const refreshCurrentRide = () => {
      const ride = getCurrentRide();
      if (String(ride?.serviceType || '').toLowerCase() === 'rental') {
        const normalizedRentalRide = normalizeRentalCurrentRideSnapshot(ride, currentRideRef.current || {});
        const nextRide = isActiveCurrentRide(normalizedRentalRide) ? normalizedRentalRide : null;
        lastRideSignatureRef.current = getCurrentRideSignature(nextRide);
        setCurrentRide(nextRide);
        return;
      }
      const nextRide = isActiveCurrentRide(ride) ? ride : null;
      lastRideSignatureRef.current = getCurrentRideSignature(nextRide);
      setCurrentRide(nextRide);
    };

    refreshCurrentRide();
    window.addEventListener('storage', refreshCurrentRide);
    window.addEventListener(CURRENT_RIDE_UPDATED_EVENT, refreshCurrentRide);

    let cancelled = false;
    let syncTimer = null;
    let syncInFlight = false;

    const scheduleNextSync = () => {
      if (cancelled) {
        return;
      }

      const nextInterval = currentRideRef.current && !isRentalCurrentRide(currentRideRef.current)
        ? ACTIVE_RIDE_SYNC_INTERVAL_MS
        : IDLE_RIDE_SYNC_INTERVALS_MS[Math.min(consecutiveIdleMissesRef.current, IDLE_RIDE_SYNC_INTERVALS_MS.length - 1)];
      syncTimer = window.setTimeout(() => {
        syncCurrentRide();
      }, nextInterval);
    };

    const syncCurrentRide = async (reason = 'timer') => {
      if (cancelled || syncInFlight || document.visibilityState === 'hidden') {
        scheduleNextSync();
        return;
      }

      if (
        reason !== 'timer' &&
        Date.now() - lastSyncAtRef.current < FORCED_SYNC_COOLDOWN_MS
      ) {
        return;
      }

      syncInFlight = true;
      lastSyncAtRef.current = Date.now();
      try {
        const token = getLocalUserToken();
        if (!token) {
          persistCurrentRide(null);
          currentRideRef.current = null;
          consecutiveIdleMissesRef.current = 0;
          return;
        }

        // Rentals are tracked on their own screen.
        // Avoid re-polling the same "active rental" endpoint from the home page.
        if (isRentalCurrentRide(currentRideRef.current)) {
          consecutiveIdleMissesRef.current = 0;
          return;
        }

        let rideData = null;

        try {
          rideData = unwrapApiPayload(await api.get('/rides/active/me'));
        } catch (error) {
          const status = Number(error?.response?.status || 0);
          if (status !== 404) {
            throw error;
          }
        }

        if (rideData?._id || rideData?.rideId) {
          const normalizedRide = {
            rideId: rideData._id || rideData.rideId,
            pickup: rideData.pickupAddress || rideData.pickup,
            drop: rideData.dropAddress || rideData.drop,
            pickupCoords: rideData.pickupLocation?.coordinates || rideData.pickupCoords || null,
            dropCoords: rideData.dropLocation?.coordinates || rideData.dropCoords || null,
            fare: rideData.fare,
            baseFare: rideData.baseFare || rideData.fare || 0,
            status: rideData.status,
            liveStatus: rideData.liveStatus,
            serviceType: rideData.serviceType,
            scheduledAt: rideData.scheduledAt || null,
            acceptedAt: rideData.acceptedAt || null,
            arrivedAt: rideData.arrivedAt || null,
            estimatedDistanceMeters: rideData.estimatedDistanceMeters || 0,
            estimatedDurationMinutes: rideData.estimatedDurationMinutes || 0,
            paymentMethod: rideData.paymentMethod || 'Cash',
            pricingSnapshot: rideData.pricingSnapshot || null,
            otp: rideData.otp || '',
            driver: rideData.driverId || rideData.driver,
            vehicleIconUrl: rideData.vehicleIconUrl,
            vehicleIconType: rideData.vehicleIconType,
          };
          if (isActiveCurrentRide(normalizedRide)) {
            if (cancelled) return;
            consecutiveIdleMissesRef.current = 0;
            persistCurrentRide(normalizedRide);
            currentRideRef.current = normalizedRide;
            return;
          }
        }

        if (cancelled) return;
        consecutiveIdleMissesRef.current = Math.min(
          consecutiveIdleMissesRef.current + 1,
          IDLE_RIDE_SYNC_INTERVALS_MS.length - 1,
        );
        persistCurrentRide(null);
        currentRideRef.current = null;
      } finally {
        syncInFlight = false;
        scheduleNextSync();
      }
    };

    const handleWindowFocus = () => {
      if (document.visibilityState !== 'hidden') {
        syncCurrentRide('focus');
      }
    };

    syncCurrentRide('mount');
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      cancelled = true;
      if (syncTimer) {
        window.clearTimeout(syncTimer);
      }
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
      window.removeEventListener('storage', refreshCurrentRide);
      window.removeEventListener(CURRENT_RIDE_UPDATED_EVENT, refreshCurrentRide);
    };
  }, []);

  const driverName = currentRide?.driver?.name || 'Captain';
  const serviceType = String(currentRide?.serviceType || currentRide?.type || 'ride').toLowerCase();
  const vehicleLabel = currentRide?.driver?.vehicle || currentRide?.driver?.vehicleType || (serviceType === 'parcel' ? 'Parcel' : serviceType === 'rental' ? 'Rental' : 'Taxi');
  const currentRideIcon = getCurrentRideIcon(currentRide);
  const trackingPath =
    serviceType === 'parcel'
      ? `${routePrefix}/parcel/tracking`
      : serviceType === 'rental'
        ? `${routePrefix}/rental`
        : `${routePrefix}/ride/tracking`;
  const rideStage = String(currentRide?.liveStatus || currentRide?.status || 'accepted').toLowerCase();
  const hasAssignedDriver = Boolean(currentRide?.driver?._id || currentRide?.driver?.id || currentRide?.driver?.name);
  const scheduledTimestamp = currentRide?.scheduledAt ? new Date(currentRide.scheduledAt).getTime() : NaN;
  const isScheduledRide = Number.isFinite(scheduledTimestamp);
  const isScheduledUpcoming = isScheduledRide && scheduledTimestamp > clockNow;
  const isScheduledAcceptedRide = ['ride', 'intercity'].includes(serviceType) && isScheduledUpcoming && hasAssignedDriver && ['accepted', 'arriving'].includes(rideStage);
  const scheduledDateLabel = formatScheduledDateTime(currentRide?.scheduledAt);
  const scheduledCountdown = getScheduledCountdownLabel(currentRide?.scheduledAt, clockNow);
  let activeRide = null;
  if (isScheduledAcceptedRide) {
    activeRide = (
      <button
        type="button"
        onClick={() => navigate(trackingPath, { state: currentRide })}
        className="block w-full overflow-hidden rounded-[28px] border border-[#1e293b] p-5 text-left bg-[#0f172a] text-[#ffffff] shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] bg-[#facc15]/10 text-[#facc15]">
            <ShieldCheck size={11} strokeWidth={3} />
            Confirmed
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-[#facc15]" />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#facc15]">Live Status</span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <h2 className="text-[24px] font-black tracking-tight leading-none text-[#ffffff]">
              {scheduledCountdown}
            </h2>
            <p className="mt-1.5 text-[12px] font-bold text-[#94a3b8]">
              {scheduledDateLabel}
            </p>
          </div>
          <div className="relative mb-1">
            <div className="absolute -inset-4 rounded-full bg-[#facc15]/5 blur-xl animate-pulse" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#020617] shadow-2xl border border-[#1e293b]">
              <img src={currentRideIcon} alt="" className="h-8 w-8 object-contain" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl p-2.5 bg-[#020617]/60 border border-[#1e293b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#0f172a] border border-[#1e293b] text-[#facc15] flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#64748b] leading-none">Driver & Vehicle</p>
              <p className="mt-0.5 truncate text-[12.5px] font-bold">{driverName} • {vehicleLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#64748b] leading-none">Fare</p>
            <p className="mt-0.5 text-[12.5px] font-bold">₹{Number(currentRide?.fare || 0).toFixed(0)}</p>
          </div>
        </div>
      </button>
    );
  } else if (currentRide && String(currentRide?.status || '').toLowerCase() !== 'end_requested') {
    activeRide = (
      <button
        type="button"
        onClick={() => navigate(trackingPath, { state: currentRide })}
        className="flex w-full items-center justify-between rounded-2xl border border-[#d1fae5] bg-[#ecfdf5] px-4 py-3.5 text-left text-[#0f172a]"
      >
        <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-bold">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#10b981]" />
          You have an active booking
        </span>
        <span className="flex shrink-0 items-center text-[12px] font-black text-[#047857]">
          View details <ChevronRight size={14} />
        </span>
      </button>
    );
  }

  return (
    <HomeSheet
      address={isLocationLoading ? 'Pinning your current location...' : pickupAddress}
      showMap={showDeferredSections}
      activeRide={activeRide}
    />
  );
};

export default Home;
