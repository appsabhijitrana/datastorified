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

  const showBanners = pathname !== "/maintenance" && !(maintenance.enabled && maintenance.mode === "page");

  return (
    <>
      {showBanners && scheduledBanner.enabled && <ScheduledMaintenanceBanner message={scheduledBanner.message} />}
      {showBanners && outageBanner.enabled && <OutageBanner message={outageBanner.message} />}
      {showBanners && maintenanceBanner.enabled && <MaintenanceBanner message={maintenanceBanner.message} />}
      {children}
    </>
  );
}
