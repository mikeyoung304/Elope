/**
 * Tenant Form Component
 * For creating and editing tenants in the platform admin dashboard
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface TenantFormData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  commissionRate: number;
  stripeAccountId?: string;
  isActive: boolean;
}

export function TenantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    commissionRate: 10,
    stripeAccountId: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing tenant if editing
  useEffect(() => {
    if (isEditing) {
      loadTenant();
    }
  }, [id]);

  const loadTenant = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:3001/v1/admin/tenants/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const tenant = await response.json();
        setFormData({
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email || "",
          phone: tenant.phone || "",
          commissionRate: Number(tenant.commissionPercent || 10),
          stripeAccountId: tenant.stripeAccountId || "",
          isActive: tenant.isActive !== false,
        });
      }
    } catch (error) {
      console.error("Failed to load tenant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Business name is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      newErrors.commissionRate = "Commission rate must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        phone: formData.phone || undefined,
        commissionRate: formData.commissionRate,
        stripeAccountId: formData.stripeAccountId || undefined,
        isActive: formData.isActive,
      };

      // Use direct fetch for now since Express routes exist but aren't fully in ts-rest
      const token = localStorage.getItem("adminToken");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      let response;
      if (isEditing) {
        // Update existing tenant
        response = await fetch(`http://localhost:3001/v1/admin/tenants/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        // Create new tenant
        response = await fetch(`http://localhost:3001/v1/admin/tenants`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            slug: formData.slug,
            name: formData.name,
            email: formData.email || undefined,
            commission: formData.commissionRate,
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();

        // If this is a new tenant, show the secret key
        if (!isEditing && result.secretKey) {
          toast.success("Tenant created successfully!", {
            description: `IMPORTANT - Save this secret key: ${result.secretKey}\n\nThis will only be shown once.`,
            duration: 10000,
          });
        } else {
          toast.success("Tenant updated successfully!");
        }

        navigate("/admin/dashboard");
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to save tenant" }));
        setErrors({ submit: error.error || "Failed to save tenant" });
      }
    } catch (error: any) {
      console.error("Failed to save tenant:", error);
      setErrors({
        submit: error.body?.message || "Failed to save tenant. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = () => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData({ ...formData, slug });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-macon-navy-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/dashboard")}
              className="mb-4 text-macon-navy-200 hover:text-macon-navy-100"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-macon-navy-50">Edit Tenant</h1>
          </div>
          <Card className="bg-macon-navy-800 border-macon-navy-600">
            <CardHeader>
              <CardTitle className="text-macon-navy-50">Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSkeleton fields={7} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-macon-navy-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 text-macon-navy-200 hover:text-macon-navy-100"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-macon-navy-50">
            {isEditing ? "Edit Tenant" : "Add New Tenant"}
          </h1>
          <p className="text-macon-navy-200 mt-2">
            {isEditing
              ? "Update tenant information and settings"
              : "Create a new tenant account for the platform"
            }
          </p>
        </div>

        {/* Form */}
        <Card className="bg-macon-navy-800 border-macon-navy-600">
          <CardHeader>
            <CardTitle className="text-macon-navy-50">
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {errors.submit && (
                <div className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>{errors.submit}</div>
                </div>
              )}

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-macon-navy-100">
                  Business Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={generateSlug}
                  className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50"
                  placeholder="e.g., Bella Weddings"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-macon-navy-100">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50"
                  placeholder="e.g., bella-weddings"
                  disabled={isSubmitting}
                />
                <p className="text-macon-navy-300 text-sm">
                  This will be used in URLs and API keys
                </p>
                {errors.slug && (
                  <p className="text-red-400 text-sm">{errors.slug}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-macon-navy-100">
                  Admin Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50"
                  placeholder="admin@bellaweddings.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-macon-navy-100">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50"
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <Label htmlFor="commissionRate" className="text-macon-navy-100">
                  Commission Rate (%) *
                </Label>
                <select
                  id="commissionRate"
                  value={formData.commissionRate.toString()}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseInt(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-macon-navy-900 border border-macon-navy-600 text-macon-navy-50 rounded-md focus:outline-none focus:ring-2 focus:ring-macon-navy-500"
                >
                  <option value="10">10%</option>
                  <option value="12">12%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                </select>
                {errors.commissionRate && (
                  <p className="text-red-400 text-sm">{errors.commissionRate}</p>
                )}
              </div>

              {/* Stripe Account ID */}
              <div className="space-y-2">
                <Label htmlFor="stripeAccountId" className="text-macon-navy-100">
                  Stripe Account ID
                </Label>
                <Input
                  id="stripeAccountId"
                  value={formData.stripeAccountId}
                  onChange={(e) => setFormData({ ...formData, stripeAccountId: e.target.value })}
                  className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50"
                  placeholder="acct_1234567890"
                  disabled={isSubmitting}
                />
                <p className="text-macon-navy-300 text-sm">
                  Leave empty to set up later
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-macon-navy-100">
                    Active Status
                  </Label>
                  <p className="text-sm text-macon-navy-300">
                    Active tenants can accept bookings
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={isSubmitting}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-macon-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-macon-navy-300 dark:peer-focus:ring-macon-navy-800 rounded-full peer dark:bg-macon-navy-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lavender-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex-1 border-macon-navy-600 text-macon-navy-200 hover:bg-macon-navy-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-lavender-600 hover:bg-lavender-700 text-white"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : (isEditing ? "Update Tenant" : "Create Tenant")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}