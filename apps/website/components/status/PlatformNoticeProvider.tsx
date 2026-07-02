"use client";

import React from "react";

import { usePathname } from "next/navigation";
import { MaintenanceBanner } from "./MaintenanceBanner";
import { OutageBanner } from "./OutageBanner";
import { ScheduledMaintenanceBanner } from "./ScheduledMaintenanceBanner";
import { StatusService } from "../../lib/status/service";

export function PlatformNoticeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const maintenance = StatusService.getMaintenance();
  const maintenanceBanner = StatusService.getMaintenanceBanner();
  const outageBanner = StatusService.getOutageBanner();
  const scheduledBanner = StatusService.getScheduledMaintenanceBanner();
  const isAdminPath = pathname ? pathname === "/admin" || pathname.startsWith("/admin/") : false;

  const showBanners = pathname !== "/maintenance" && !(maintenance.enabled && maintenance.mode === "page");

  return (
    <>
      {showBanners && !outageBanner.enabled && scheduledBanner.enabled && <ScheduledMaintenanceBanner message={scheduledBanner.message} />}
      {showBanners && !outageBanner.enabled && maintenanceBanner.enabled && <MaintenanceBanner message={maintenanceBanner.message} />}
      {showBanners && outageBanner.enabled && isAdminPath && <OutageBanner message={outageBanner.message} />}
      {children}
    </>
  );
}
