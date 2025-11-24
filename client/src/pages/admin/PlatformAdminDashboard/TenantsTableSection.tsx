import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Loader2,
  Search
} from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { EmptyState } from "../../../components/ui/empty-state";
import type { TenantDto } from "./types";

interface TenantsTableSectionProps {
  tenants: TenantDto[];
  isLoading: boolean;
}

/**
 * TenantsTableSection Component
 *
 * Displays a searchable table of all tenants with their details and actions
 */
export function TenantsTableSection({ tenants, isLoading }: TenantsTableSectionProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-6 border-neutral-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">All Tenants</h2>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="search"
            placeholder="Search tenants by name, slug, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-neutral-300 focus:border-macon-navy-500"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-200 hover:bg-neutral-50">
            <TableHead className="text-neutral-700 font-semibold">Tenant</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Slug</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Email</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Packages</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Bookings</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Commission</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Status</TableHead>
            <TableHead className="text-neutral-700 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-neutral-50">
              <TableCell colSpan={8} className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
              </TableCell>
            </TableRow>
          ) : filteredTenants.length === 0 ? (
            <TableRow className="hover:bg-neutral-50">
              <TableCell colSpan={8} className="p-0">
                {searchTerm ? (
                  <EmptyState
                    icon={Search}
                    title="No tenants found"
                    description={`No tenants match "${searchTerm}". Try adjusting your search terms.`}
                  />
                ) : (
                  <EmptyState
                    icon={Building2}
                    title="No tenants yet"
                    description="Get started by creating your first tenant to begin managing the platform."
                    action={{
                      label: "Add Tenant",
                      onClick: () => navigate("/admin/tenants/new")
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            filteredTenants.map((tenant) => (
              <TableRow key={tenant.id} className="border-neutral-200 hover:bg-neutral-50">
                <TableCell className="font-medium text-neutral-900">
                  {tenant.name}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {tenant.slug}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {tenant.email || "—"}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {tenant._count?.packages || 0}
                </TableCell>
                <TableCell className="text-neutral-600">
                  {tenant._count?.bookings || 0}
                </TableCell>
                <TableCell className="text-neutral-600">
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
                    size="default"
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                    className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
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
  );
}