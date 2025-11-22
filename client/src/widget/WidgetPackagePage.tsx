import { useState } from "react";
import { toUtcMidnight } from "@macon/shared";
import { usePackage } from "../features/catalog/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../features/booking/DatePicker";
import { AddOnList } from "../features/booking/AddOnList";
import { TotalBox } from "../features/booking/TotalBox";
import { useBookingTotal } from "../features/booking/hooks";
import { api } from "../lib/api";
import { formatCurrency } from "@/lib/utils";

interface Props {
  packageSlug: string;
  onBack: () => void;
  onBookingComplete: (bookingId: string) => void;
}

/**
 * Widget version of PackagePage
 *
 * Differences from main app:
 * - Uses callback instead of router navigation
 * - Notifies parent of booking completion
 * - No router dependency
 */
export function WidgetPackagePage({ packageSlug, onBack, onBookingComplete }: Props) {
  const { data: pkg, isLoading, error } = usePackage(packageSlug);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [coupleName, setCoupleName] = useState('');
  const [email, setEmail] = useState('');

  const packageData = pkg;
  const total = useBookingTotal(packageData?.priceCents || 0, packageData?.addOns || [], selectedAddOns);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-macon-navy-100 text-xl">
        Loading package...
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="text-center py-12 text-macon-navy-50 text-xl">
        Package not found
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!selectedDate || !packageData || !coupleName.trim() || !email.trim()) return;

    try {
      // Format date as YYYY-MM-DD using toUtcMidnight
      const eventDate = toUtcMidnight(selectedDate);

      // Call createCheckout API
      const response = await api.createCheckout({
        body: {
          packageId: packageData.id,
          eventDate,
          email: email.trim(),
          coupleName: coupleName.trim(),
          addOnIds: Array.from(selectedAddOns),
        },
      });

      if (response.status === 200) {
        // Redirect to Stripe checkout
        window.location.href = response.body.checkoutUrl;

        // Note: onBookingComplete will be called after successful payment
        // when user returns from Stripe (handled by parent page)
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout. Please try again.');
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(addOnId)) {
        newSet.delete(addOnId);
      } else {
        newSet.add(addOnId);
      }
      return newSet;
    });
  };

  return (
    <div>
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 text-macon-navy-200 hover:text-macon-navy-50"
      >
        ← Back to Packages
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden bg-macon-navy-800 border-macon-navy-600">
            {packageData.photoUrl && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={packageData.photoUrl}
                  alt={packageData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-8">
              <h1 className="font-heading text-5xl font-bold mb-4 text-macon-navy-50">
                {packageData.title}
              </h1>
              <p className="text-macon-navy-100 mb-6 leading-relaxed text-xl">
                {packageData.description}
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-macon-navy-600">
                <span className="text-lg text-macon-navy-200">Base Price:</span>
                <span className="text-4xl font-heading font-semibold text-macon-navy-300">
                  {formatCurrency(packageData.priceCents)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-macon-navy-800 border-macon-navy-600">
            <CardHeader>
              <CardTitle className="text-macon-navy-50 text-3xl">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <DatePicker
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
            </CardContent>
          </Card>

          <Card className="bg-macon-navy-800 border-macon-navy-600">
            <CardHeader>
              <CardTitle className="text-macon-navy-50 text-3xl">Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="coupleName" className="text-macon-navy-100 text-lg">Your Names</Label>
                  <Input
                    id="coupleName"
                    type="text"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    placeholder="e.g., Sarah & Alex"
                    required
                    className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 focus:ring-macon-navy-500 text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-macon-navy-100 text-lg">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 focus:ring-macon-navy-500 text-lg h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {packageData.addOns && packageData.addOns.length > 0 && (
            <Card className="bg-macon-navy-800 border-macon-navy-600">
              <CardHeader>
                <CardTitle className="text-macon-navy-50 text-3xl">Add-Ons</CardTitle>
              </CardHeader>
              <CardContent>
                <AddOnList
                  addOns={packageData.addOns}
                  selected={selectedAddOns}
                  onToggle={toggleAddOn}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <TotalBox total={total} />
            <Button
              onClick={handleCheckout}
              disabled={!selectedDate || !coupleName.trim() || !email.trim()}
              className="w-full text-xl h-14"
              size="lg"
              data-testid="checkout"
            >
              {!selectedDate
                ? "Select a date"
                : !coupleName.trim() || !email.trim()
                ? "Enter your details"
                : "Proceed to Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
