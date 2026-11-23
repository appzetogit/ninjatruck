import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import api from '../../../shared/api/axiosInstance';
import { useUserTheme } from '../../../shared/context/UserThemeContext';

/**
 * Home-screen entry to Vehicle Insurance. Hidden unless the admin has switched
 * the section on (Price Management > Vehicle Insurance > Banner Settings).
 */
const InsuranceBanner = ({ routePrefix = '/taxi/user' }) => {
  const navigate = useNavigate();
  const { theme } = useUserTheme();
  const isDark = theme === 'dark';
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
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`${routePrefix}/insurance`)}
      // Brand ink in both themes. Not bg-slate-900/bg-black: the user-app theme
      // repaints buttons with those classes in the accent yellow.
      className={`group relative flex w-full items-stretch overflow-hidden rounded-[22px] border bg-[#111111] text-left shadow-[0_12px_28px_rgba(0,0,0,0.10)] ${
        isDark ? 'border-white/10' : 'border-[#111111]/10'
      }`}
    >
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-1 p-4">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F9C105] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#111111]">
          <ShieldCheck size={11} strokeWidth={2.75} /> Insurance
        </span>
        <p className="text-[16px] font-black leading-tight text-white">{settings.bannerTitle || 'Vehicle Insurance'}</p>
        {settings.bannerSubtitle && <p className="text-[12px] font-semibold text-white/70">{settings.bannerSubtitle}</p>}
        {settings.policyTermsLabel && <p className="text-[11px] font-bold text-[#F9C105]">{settings.policyTermsLabel}</p>}
        <span className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-black text-white">
          Get covered <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      {settings.bannerImageUrl ? (
        <img src={settings.bannerImageUrl} alt="" className="w-[38%] shrink-0 object-cover" loading="lazy" />
      ) : (
        <div className="flex w-[30%] shrink-0 items-center justify-center bg-[#F9C105]/15 text-[#F9C105]">
          <ShieldCheck size={40} />
        </div>
      )}
    </motion.button>
  );
};

export default InsuranceBanner;
