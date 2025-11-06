import type { AddOnDto } from "@elope/contracts";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface AddOnListProps {
  addOns: AddOnDto[];
  selected: Set<string>;
  onToggle: (addOnId: string) => void;
}

export function AddOnList({ addOns, selected, onToggle }: AddOnListProps) {
  return (
    <div className="space-y-3">
      {addOns.map((addOn) => {
        const isSelected = selected.has(addOn.id);

        return (
          <Card
            key={addOn.id}
            className={cn(
              "cursor-pointer transition-all bg-navy-900 border-navy-600",
              isSelected && "border-lavender-500 shadow-elegant bg-navy-800"
            )}
            onClick={() => onToggle(addOn.id)}
          >
            <label className="flex items-start gap-4 p-4 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(addOn.id)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "h-5 w-5 rounded border-2 transition-all flex items-center justify-center",
                    isSelected
                      ? "bg-lavender-500 border-lavender-500"
                      : "bg-navy-800 border-navy-600 hover:border-lavender-500/50"
                  )}
                >
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className={cn(
                    "font-medium transition-colors text-xl",
                    isSelected ? "text-lavender-50" : "text-lavender-100"
                  )}>
                    {addOn.title}
                  </h3>
                  <span className={cn(
                    "font-semibold transition-colors shrink-0 text-2xl",
                    isSelected ? "text-lavender-200" : "text-lavender-300"
                  )}>
                    {formatCurrency(addOn.priceCents)}
                  </span>
                </div>
              </div>
            </label>
          </Card>
        );
      })}
    </div>
  );
}
