/**
 * Platform Admin Dashboard
 * Full system overview for PLATFORM_ADMIN users
 * - Manage all tenants
 * - System-wide statistics
 * - Platform configuration
 * - NO tenant-specific content
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  DollarSign,
  Calendar,
  Users,
  Plus,
  Loader2,
  Search,
  Layers
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

type TenantDto = {
  id: string;
  slug: string;
  name: string;
  email?: string;
  isActive: boolean;
  stripeOnboarded: boolean;
  commissionPercent: number;
  createdAt: string;
  _count?: {
    packages: number;
    bookings: number;
  };
};

type SegmentDto = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type SystemStats = {
  totalTenants: number;
  activeTenants: number;
  totalBookings: number;
  totalRevenue: number;
  platformCommission: number;
  totalSegments: number;
  activeSegments: number;
};

export function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalBookings: 0,
    totalRevenue: 0,
    platformCommission: 0,
    totalSegments: 0,
    activeSegments: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all tenants (Platform admin can see all)
      const tenantsResult = await (api as any).platformGetAllTenants();
      if (tenantsResult.status === 200) {
        setTenants(tenantsResult.body);
      }

      // Load system-wide statistics
      const statsResult = await (api as any).platformGetStats();
      if (statsResult.status === 200) {
        setStats(statsResult.body);
      }

      // Fetch segments count across all tenants
      try {
        const segmentsResult = await (api as any).tenantAdminGetSegments();
        if (segmentsResult.status === 200) {
          const segments = segmentsResult.body as SegmentDto[];
          const segmentCount = segments.length;
          const activeSegmentCount = segments.filter((s) => s.active).length;

          setStats(prev => ({
            ...prev,
            totalSegments: segmentCount,
            activeSegments: activeSegmentCount,
          }));
        }
      } catch (segmentError) {
        // Segments endpoint might not be accessible or might fail
        // Set to 0 as fallback
        console.warn("Could not fetch segments:", segmentError);
        setStats(prev => ({
          ...prev,
          totalSegments: 0,
          activeSegments: 0,
        }));
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Dashboard" }
      ]}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
            <p className="text-gray-600 mt-1">
              Manage all tenants and monitor platform-wide metrics
            </p>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-navy-50 rounded">
                <Building2 className="w-5 h-5 text-macon-navy-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Total Tenants</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalTenants}</div>
            <p className="text-sm text-gray-600 mt-1">{stats.activeTenants} active</p>
          </Card>

          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-macon-orange-50 rounded">
                <Layers className="w-5 h-5 text-macon-orange-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Business Segments</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalSegments}</div>
            <p className="text-sm text-gray-600 mt-1">{stats.activeSegments} active</p>
          </Card>

          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Total Bookings</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
            <p className="text-sm text-gray-600 mt-1">All tenants</p>
          </Card>

          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Total Revenue</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600 mt-1">All tenants</p>
          </Card>

          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Platform Commission</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.platformCommission)}
            </div>
            <p className="text-sm text-gray-600 mt-1">From all bookings</p>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card className="p-6 border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">All Tenants</h2>
            <Button
              className="bg-macon-navy hover:bg-macon-navy-dark"
              onClick={() => navigate("/admin/tenants/new")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Tenant
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search tenants by name, slug, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-macon-navy-500"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Tenant</TableHead>
                <TableHead className="text-gray-700 font-semibold">Slug</TableHead>
                <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                <TableHead className="text-gray-700 font-semibold">Packages</TableHead>
                <TableHead className="text-gray-700 font-semibold">Bookings</TableHead>
                <TableHead className="text-gray-700 font-semibold">Commission</TableHead>
                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-gray-50">
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow className="hover:bg-gray-50">
                  <TableCell colSpan={8} className="text-center py-8 text-gray-600">
                    {searchTerm ? "No tenants match your search" : "No tenants yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">
                      {tenant.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tenant.email || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tenant._count?.packages || 0}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tenant._count?.bookings || 0}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tenant.commissionPercent}%
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {tenant.isActive ? (
                          <Badge variant="outline" className="border-green-600 bg-green-50 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-600 bg-red-50 text-red-700">
                            Inactive
                          </Badge>
                        )}
                        {tenant.stripeOnboarded && (
                          <Badge variant="outline" className="border-macon-teal bg-macon-teal/10 text-macon-teal">
                            Stripe
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
