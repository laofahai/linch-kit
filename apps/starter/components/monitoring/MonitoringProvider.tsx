'use client';

import { useEffect } from 'react';
import { initMonitoring } from '@/lib/monitoring';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function MonitoringProvider() {
  useEffect(() => {
    initMonitoring();
  }, []);

  return (
    <>
      {/* Vercel Analytics - 自动追踪页面浏览和 Web Vitals */}
      <Analytics />
      {/* Vercel Speed Insights - 实时性能监控 */}
      <SpeedInsights />
    </>
  );
}