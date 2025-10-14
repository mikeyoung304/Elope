import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePackage } from "./hooks";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { DatePicker } from "../booking/DatePicker";
import { AddOnList } from "../booking/AddOnList";
import { TotalBox } from "../booking/TotalBox";
import { useBookingTotal } from "../booking/hooks";

export function PackagePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: pkg, isLoading, error } = usePackage(slug || "");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

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

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    navigate("/success");
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
            disabled={!selectedDate}
            className="w-full"
          >
            {selectedDate ? "Checkout" : "Select a date to continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
