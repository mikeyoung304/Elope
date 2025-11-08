/**
 * Tenant Admin Dashboard Page
 * Wrapper for existing TenantDashboard component with auth context
 * - Tenant-specific overview
 * - Packages management
 * - Bookings
 * - Branding
 * - Settings
 */

import { useEffect, useState } from "react";
import { Container } from "../../ui/Container";
import { TenantDashboard as TenantDashboardComponent } from "../../features/tenant-admin/TenantDashboard";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";

type TenantDto = {
  id: string;
  slug: string;
  name: string;
  email: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TenantAdminDashboard() {
  const { user } = useAuth();
  const [tenantInfo, setTenantInfo] = useState<TenantDto | undefined>(undefined);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    // Fetch tenant info using auth context
    const fetchTenantInfo = async () => {
      try {
        const result = await (api as any).tenantGetInfo();
        if (result.status === 200) {
          setTenantInfo(result.body);
        }
      } catch (error) {
        console.error("Failed to load tenant info:", error);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    if (user?.role === "TENANT_ADMIN") {
      fetchTenantInfo();
    }
  }, [user]);

  return (
    <Container className="py-12">
      <TenantDashboardComponent tenantInfo={tenantInfo} />
    </Container>
  );
}
