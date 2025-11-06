import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface TotalBoxProps {
  total: number;
}

export function TotalBox({ total }: TotalBoxProps) {
  // Convert total from dollars to cents for formatCurrency
  const totalCents = Math.round(total * 100);

  return (
    <Card className="bg-navy-800 border-navy-600">
      <CardContent className="p-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-medium text-lavender-200 uppercase tracking-wide">
            Total
          </span>
          <span className="text-5xl font-bold text-lavender-50 tracking-tight">
            {formatCurrency(totalCents)}
          </span>
        </div>
        <p className="text-base text-lavender-100">
          All-inclusive pricing
        </p>
      </CardContent>
    </Card>
  );
}
