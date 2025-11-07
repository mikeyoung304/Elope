import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "../ui/Container";
import { TenantDashboard as TenantDashboardComponent } from "../features/tenant-admin/TenantDashboard";
import { api } from "../lib/api";

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

export function TenantDashboard() {
  const navigate = useNavigate();
  const [tenantInfo, setTenantInfo] = useState<TenantDto | undefined>(undefined);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    // Check for tenant token, redirect to login if not present
    const token = localStorage.getItem("tenantToken");
    if (!token) {
      navigate("/tenant/login");
      return;
    }

    // Fetch tenant info
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

    fetchTenantInfo();
  }, [navigate]);

  // Show nothing while checking token
  const token = localStorage.getItem("tenantToken");
  if (!token) {
    return null;
  }

  return (
    <Container className="py-12">
      <TenantDashboardComponent tenantInfo={tenantInfo} />
    </Container>
  );
}
