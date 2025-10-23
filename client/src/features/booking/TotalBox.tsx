import { Card } from "../../ui/Card";

interface TotalBoxProps {
  total: number;
}

export function TotalBox({ total }: TotalBoxProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600">Total</span>
        <span className="text-3xl font-bold text-blue-600">
          ${total.toFixed(2)}
        </span>
      </div>
      <p className="text-sm text-gray-500">All-inclusive pricing</p>
    </Card>
  );
}
