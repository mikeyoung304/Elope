/**
 * Dashboard Data Hook
 *
 * Manages data fetching for the tenant dashboard
 */

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { logger } from "../../../lib/logger";
import type { PackageDto, BookingDto } from "@macon/contracts";

type BlackoutDto = {
  id: string;
  tenantId: string;
  date: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

type BrandingDto = {
  id: string;
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export function useDashboardData(activeTab: string) {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [branding, setBranding] = useState<BrandingDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetPackages();
      if (result.status === 200) {
        setPackages(result.body);
      }
    } catch (error) {
      logger.error("Failed to load packages:", { error, component: "useDashboardData" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlackouts = async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBlackouts();
      if (result.status === 200) {
        setBlackouts(result.body);
      }
    } catch (error) {
      logger.error("Failed to load blackouts:", { error, component: "useDashboardData" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBookings();
      if (result.status === 200) {
        setBookings(result.body);
      }
    } catch (error) {
      logger.error("Failed to load bookings:", { error, component: "useDashboardData" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      const result = await api.tenantAdminGetBranding();
      if (result.status === 200) {
        setBranding(result.body);
      }
    } catch (error) {
      logger.error("Failed to load branding:", { error, component: "useDashboardData" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "packages") {
      loadPackages();
    } else if (activeTab === "blackouts") {
      loadBlackouts();
    } else if (activeTab === "bookings") {
      loadBookings();
    } else if (activeTab === "branding") {
      loadBranding();
    }
  }, [activeTab]);

  return {
    packages,
    blackouts,
    bookings,
    branding,
    isLoading,
    loadPackages,
    loadBlackouts,
    loadBookings,
    loadBranding,
  };
}