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
  LogOut,
  Plus,
  Loader2,
  Search
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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

type SystemStats = {
  totalTenants: number;
  activeTenants: number;
  totalBookings: number;
  totalRevenue: number;
  platformCommission: number;
};

export function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalBookings: 0,
    totalRevenue: 0,
    platformCommission: 0,
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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-lavender-50">Platform Admin Dashboard</h1>
            <p className="text-lg text-lavender-200 mt-2">
              System Overview - {user?.email}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
            className="border-navy-600 text-lavender-100 hover:bg-navy-800 text-lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-navy-800 border-navy-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-navy-700 rounded">
                <Building2 className="w-5 h-5 text-lavender-300" />
              </div>
              <div className="text-base text-lavender-100">Total Tenants</div>
            </div>
            <div className="text-4xl font-bold text-lavender-50">{stats.totalTenants}</div>
            <p className="text-sm text-lavender-300 mt-1">{stats.activeTenants} active</p>
          </Card>

          <Card className="p-6 bg-navy-800 border-navy-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-navy-700 rounded">
                <Calendar className="w-5 h-5 text-lavender-300" />
              </div>
              <div className="text-base text-lavender-100">Total Bookings</div>
            </div>
            <div className="text-4xl font-bold text-lavender-50">{stats.totalBookings}</div>
            <p className="text-sm text-lavender-300 mt-1">All tenants</p>
          </Card>

          <Card className="p-6 bg-navy-800 border-navy-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-navy-700 rounded">
                <DollarSign className="w-5 h-5 text-lavender-300" />
              </div>
              <div className="text-base text-lavender-100">Total Revenue</div>
            </div>
            <div className="text-4xl font-bold text-lavender-300">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-lavender-300 mt-1">All tenants</p>
          </Card>

          <Card className="p-6 bg-navy-800 border-navy-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-navy-700 rounded">
                <Users className="w-5 h-5 text-lavender-300" />
              </div>
              <div className="text-base text-lavender-100">Platform Commission</div>
            </div>
            <div className="text-4xl font-bold text-lavender-300">
              {formatCurrency(stats.platformCommission)}
            </div>
            <p className="text-sm text-lavender-300 mt-1">From all bookings</p>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card className="p-6 bg-navy-800 border-navy-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-lavender-50">All Tenants</h2>
            <Button
              className="bg-lavender-500 hover:bg-lavender-600 text-lg"
              onClick={() => navigate("/admin/tenants/new")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Tenant
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy-400" />
              <Input
                type="search"
                placeholder="Search tenants by name, slug, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 h-12"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-navy-600 hover:bg-navy-700">
                <TableHead className="text-lavender-100 text-lg">Tenant</TableHead>
                <TableHead className="text-lavender-100 text-lg">Slug</TableHead>
                <TableHead className="text-lavender-100 text-lg">Email</TableHead>
                <TableHead className="text-lavender-100 text-lg">Packages</TableHead>
                <TableHead className="text-lavender-100 text-lg">Bookings</TableHead>
                <TableHead className="text-lavender-100 text-lg">Commission</TableHead>
                <TableHead className="text-lavender-100 text-lg">Status</TableHead>
                <TableHead className="text-lavender-100 text-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-navy-700">
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-lavender-300" />
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow className="hover:bg-navy-700">
                  <TableCell colSpan={8} className="text-center py-8 text-lavender-100 text-lg">
                    {searchTerm ? "No tenants match your search" : "No tenants yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-navy-600 hover:bg-navy-700">
                    <TableCell className="font-medium text-lavender-50 text-base">
                      {tenant.name}
                    </TableCell>
                    <TableCell className="text-lavender-200 text-base">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="text-lavender-200 text-base">
                      {tenant.email || "—"}
                    </TableCell>
                    <TableCell className="text-lavender-200 text-base">
                      {tenant._count?.packages || 0}
                    </TableCell>
                    <TableCell className="text-lavender-200 text-base">
                      {tenant._count?.bookings || 0}
                    </TableCell>
                    <TableCell className="text-lavender-200 text-base">
                      {tenant.commissionPercent}%
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {tenant.isActive ? (
                          <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-200">
                            Inactive
                          </Badge>
                        )}
                        {tenant.stripeOnboarded && (
                          <Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-200">
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
                        className="border-navy-600 text-lavender-200 hover:bg-navy-700"
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
    </div>
  );
}
