import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toUtcMidnight } from "@elope/shared";
import { usePackage } from "./hooks";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { DatePicker } from "../booking/DatePicker";
import { AddOnList } from "../booking/AddOnList";
import { TotalBox } from "../booking/TotalBox";
import { useBookingTotal } from "../booking/hooks";
import { api } from "../../lib/api";
import type { LastCheckout } from "../../lib/types";

export function PackagePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: pkg, isLoading, error } = usePackage(slug || "");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [coupleName, setCoupleName] = useState('');
  const [email, setEmail] = useState('');

  const packageData = pkg;
  const total = useBookingTotal(packageData?.priceCents || 0, packageData?.addOns || [], selectedAddOns);

  if (isLoading) {
    return <div className="text-center py-12">Loading package...</div>;
  }

  if (error || !packageData) {
    return (
      <div className="text-center py-12 text-red-600">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          {packageData.photoUrl && (
            <img
              src={packageData.photoUrl}
              alt={packageData.title}
              className="w-full h-96 object-cover"
            />
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{packageData.title}</h1>
            <p className="text-gray-700 mb-4">{packageData.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Base Price: ${(packageData.priceCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <DatePicker
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="coupleName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Names
              </label>
              <input
                id="coupleName"
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="e.g., Sarah & Alex"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </Card>

        {packageData.addOns && packageData.addOns.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add-Ons</h2>
            <AddOnList
              addOns={packageData.addOns}
              selected={selectedAddOns}
              onToggle={toggleAddOn}
            />
          </Card>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          <TotalBox total={total} />
          <Button
            onClick={handleCheckout}
            disabled={!selectedDate || !coupleName.trim() || !email.trim()}
            className="w-full"
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
  );
}
