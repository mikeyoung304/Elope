import type { AddOnDto } from "@elope/contracts";

interface AddOnListProps {
  addOns: AddOnDto[];
  selected: Set<string>;
  onToggle: (addOnId: string) => void;
}

export function AddOnList({ addOns, selected, onToggle }: AddOnListProps) {
  return (
    <div className="space-y-3">
      {addOns.map((addOn) => (
        <label
          key={addOn.id}
          className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.has(addOn.id)}
            onChange={() => onToggle(addOn.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{addOn.title}</h3>
              </div>
              <span className="font-semibold text-blue-600 ml-4">
                +${(addOn.priceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
