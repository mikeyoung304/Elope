import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toUtcMidnight } from "@elope/shared";
import { usePackage } from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../booking/DatePicker";
import { AddOnList } from "../booking/AddOnList";
import { TotalBox } from "../booking/TotalBox";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useBookingTotal } from "../booking/hooks";
import { api } from "../../lib/api";
import { formatCurrency } from "@/lib/utils";
import type { LastCheckout } from "../../lib/types";

export function PackagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: pkg, isLoading, error } = usePackage(slug || "");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [coupleName, setCoupleName] = useState('');
  const [email, setEmail] = useState('');

  const packageData = pkg;
  const total = useBookingTotal(packageData?.priceCents || 0, packageData?.addOns || [], selectedAddOns);

  // Progress steps for booking flow
  const bookingSteps = useMemo(() => [
    { label: "Package", description: "Choose your package" },
    { label: "Date", description: "Select ceremony date" },
    { label: "Extras", description: "Add-ons & details" },
    { label: "Checkout", description: "Complete booking" }
  ], []);

  // Determine current step based on completion
  const currentStep = useMemo(() => {
    if (!packageData) return 0;
    if (!selectedDate) return 1;
    if (!coupleName.trim() || !email.trim()) return 2;
    return 3;
  }, [packageData, selectedDate, coupleName, email]);

  // Get selected add-on objects for TotalBox
  const selectedAddOnObjects = useMemo(() => {
    if (!packageData?.addOns) return [];
    return packageData.addOns.filter(addOn => selectedAddOns.has(addOn.id));
  }, [packageData, selectedAddOns]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-700 text-xl">
        Loading package...
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="text-center py-12 text-gray-900 text-xl">
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
        // Persist checkout data to localStorage
        const checkoutData: LastCheckout = {
          packageId: packageData.id,
          eventDate,
          email: email.trim(),
          coupleName: coupleName.trim(),
          addOnIds: Array.from(selectedAddOns),
        };
        localStorage.setItem('lastCheckout', JSON.stringify(checkoutData));

        // Redirect to Stripe checkout
        window.location.href = response.body.checkoutUrl;
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
    <div className="space-y-8">
      {/* Progress Steps */}
      <ProgressSteps steps={bookingSteps} currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
        <Card className="overflow-hidden bg-white border-gray-200 shadow-elevation-1">
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
            <h1 className="font-heading text-5xl font-bold mb-4 text-gray-900">
              {packageData.title}
            </h1>
            <p className="text-gray-700 mb-6 leading-relaxed text-xl">
              {packageData.description}
            </p>
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-lg text-gray-600">Base Price:</span>
              <span className="text-4xl font-heading font-semibold text-macon-navy">
                {formatCurrency(packageData.priceCents)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-elevation-1">
          <CardHeader>
            <CardTitle className="text-gray-900 text-3xl">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePicker
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-elevation-1">
          <CardHeader>
            <CardTitle className="text-gray-900 text-3xl">Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="coupleName" className="text-gray-700 text-lg">Your Names</Label>
                <Input
                  id="coupleName"
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  placeholder="e.g., Sarah & Alex"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-macon-orange focus:ring-macon-orange text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-lg">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-macon-orange focus:ring-macon-orange text-lg h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {packageData.addOns && packageData.addOns.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-elevation-1">
            <CardHeader>
              <CardTitle className="text-gray-900 text-3xl">Add-Ons</CardTitle>
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
          <div className="space-y-4">
            <TotalBox
              total={total}
              packagePrice={packageData?.priceCents}
              packageName={packageData?.title}
              selectedAddOns={selectedAddOnObjects}
            />
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
