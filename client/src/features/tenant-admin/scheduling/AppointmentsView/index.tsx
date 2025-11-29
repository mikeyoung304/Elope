/**
 * AppointmentsView Component
 * Main component for viewing and filtering tenant appointments
 * Fetches appointments, services, and customer data and enriches the display
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { baseUrl } from '@/lib/api';
import type { AppointmentDto, ServiceDto } from '@macon/contracts';
import type { AppointmentFilters, EnrichedAppointment, Customer } from './types';
import { AppointmentFilters as Filters } from './AppointmentFilters';
import { AppointmentsList } from './AppointmentsList';

/**
 * Get authentication token, handling impersonation
 */
function getAuthToken(): string | null {
  const isImpersonating = localStorage.getItem('impersonationTenantKey');
  if (isImpersonating) {
    return localStorage.getItem('adminToken');
  }
  return localStorage.getItem('tenantToken');
}

/**
 * Initial filter state
 */
const initialFilters: AppointmentFilters = {
  status: 'all',
  serviceId: 'all',
  startDate: '',
  endDate: '',
};

/**
 * AppointmentsView - Main appointments management component
 * Displays filterable list of appointments with enriched customer and service data
 */
export function AppointmentsView() {
  const [filters, setFilters] = useState<AppointmentFilters>(initialFilters);

  // Fetch appointments from API
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery<AppointmentDto[]>({
    queryKey: ['tenant-admin', 'appointments', filters],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.serviceId !== 'all') params.append('serviceId', filters.serviceId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${baseUrl}/v1/tenant-admin/appointments${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
      }

      return response.json();
    },
  });

  // Fetch services to display service names
  const {
    data: services = [],
    isLoading: servicesLoading,
  } = useQuery<ServiceDto[]>({
    queryKey: ['tenant-admin', 'services'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${baseUrl}/v1/tenant-admin/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      return response.json();
    },
  });

  // Fetch customers to display customer details
  // Note: This is a workaround since appointments only return customerId
  // In a production app, the API should return enriched data or we should use a join
  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useQuery<Customer[]>({
    queryKey: ['tenant-admin', 'customers'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        return []; // Return empty array if no token, customers are optional enrichment
      }

      // Note: This endpoint might not exist yet, so we'll handle errors gracefully
      const response = await fetch(`${baseUrl}/v1/tenant-admin/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // If customers endpoint doesn't exist, just return empty array
        // The UI will still work, just without customer details
        return [];
      }

      return response.json();
    },
    // Don't show error toast for customers endpoint since it's optional
    retry: false,
  });

  // Enrich appointments with service and customer data
  const enrichedAppointments: EnrichedAppointment[] = useMemo(() => {
    return appointments.map((appointment) => {
      const service = services.find((s) => s.id === appointment.serviceId);
      const customer = customers.find((c) => c.id === appointment.customerId);

      return {
        ...appointment,
        serviceName: service?.name,
        customerName: customer?.name,
        customerEmail: customer?.email ?? undefined,
        customerPhone: customer?.phone ?? undefined,
      };
    });
  }, [appointments, services, customers]);

  const isLoading = appointmentsLoading || servicesLoading || customersLoading;

  const handleFilterChange = (newFilters: AppointmentFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Handle error state
  if (appointmentsError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            Error Loading Appointments
          </h2>
          <p className="text-red-200">
            {appointmentsError instanceof Error
              ? appointmentsError.message
              : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Filters
        filters={filters}
        services={services.filter((s) => s.active)}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <AppointmentsList
        appointments={enrichedAppointments}
        isLoading={isLoading}
        totalCount={appointments.length}
      />
    </div>
  );
}
