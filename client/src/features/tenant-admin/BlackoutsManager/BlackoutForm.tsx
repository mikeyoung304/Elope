import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BlackoutFormProps {
  newBlackoutDate: string;
  setNewBlackoutDate: (date: string) => void;
  newBlackoutReason: string;
  setNewBlackoutReason: (reason: string) => void;
  isAdding: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * BlackoutForm Component
 *
 * Form for adding new blackout dates with optional reason
 */
export function BlackoutForm({
  newBlackoutDate,
  setNewBlackoutDate,
  newBlackoutReason,
  setNewBlackoutReason,
  isAdding,
  onSubmit
}: BlackoutFormProps) {
  return (
    <Card className="p-6 bg-macon-navy-800 border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Add Blackout Date</h2>
      <form onSubmit={onSubmit} className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="blackoutDate" className="text-white/90 text-lg">
            Date
          </Label>
          <Input
            id="blackoutDate"
            type="date"
            value={newBlackoutDate}
            onChange={(e) => setNewBlackoutDate(e.target.value)}
            className="bg-macon-navy-900 border-white/20 text-white focus:border-white/30 text-lg h-12"
            required
            disabled={isAdding}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="blackoutReason" className="text-white/90 text-lg">
            Reason (optional)
          </Label>
          <Input
            id="blackoutReason"
            type="text"
            value={newBlackoutReason}
            onChange={(e) => setNewBlackoutReason(e.target.value)}
            placeholder="Holiday, maintenance, etc."
            className="bg-macon-navy-900 border-white/20 text-white placeholder:text-white/50 focus:border-white/30 text-lg h-12"
            disabled={isAdding}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            className="bg-macon-navy hover:bg-macon-navy-dark text-lg h-12 px-6"
            disabled={isAdding}
          >
            {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAdding ? "Adding..." : <><Plus className="w-5 h-5 mr-2" />Add</>}
          </Button>
        </div>
      </form>
    </Card>
  );
}