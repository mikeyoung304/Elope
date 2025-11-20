import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "../../lib/api";

type BlackoutDto = {
  id: string;
  tenantId: string;
  date: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

interface BlackoutsManagerProps {
  blackouts: BlackoutDto[];
  isLoading: boolean;
  onBlackoutsChange: () => void;
}

export function BlackoutsManager({ blackouts, isLoading, onBlackoutsChange }: BlackoutsManagerProps) {
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleAddBlackout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;

    setIsAdding(true);

    try {
      const result = await api.tenantAdminCreateBlackout({
        body: {
          date: newBlackoutDate,
          reason: newBlackoutReason || undefined,
        },
      });

      if (result.status === 201) {
        setNewBlackoutDate("");
        setNewBlackoutReason("");
        showSuccess("Blackout date added successfully");
        onBlackoutsChange();
      } else {
        toast.error("Failed to create blackout date", {
          description: "Please try again or contact support.",
        });
      }
    } catch (error) {
      console.error("Failed to create blackout:", error);
      toast.error("An error occurred while creating the blackout date", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsAdding(false);
    }
  }, [newBlackoutDate, newBlackoutReason, showSuccess, onBlackoutsChange]);

  const handleDeleteBlackout = useCallback(async (blackoutId: string) => {
    if (!window.confirm("Are you sure you want to delete this blackout date?")) {
      return;
    }

    try {
      const result = await api.tenantAdminDeleteBlackout({
        params: { id: blackoutId },
        body: undefined,
      });

      if (result.status === 204) {
        showSuccess("Blackout date deleted successfully");
        onBlackoutsChange();
      } else {
        toast.error("Failed to delete blackout date", {
          description: "Please try again or contact support.",
        });
      }
    } catch (error) {
      console.error("Failed to delete blackout:", error);
      toast.error("An error occurred while deleting the blackout date", {
        description: "Please try again or contact support.",
      });
    }
  }, [showSuccess, onBlackoutsChange]);

  // Sort blackouts by date (most recent first)
  const sortedBlackouts = [...blackouts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 border border-macon-navy-600 bg-macon-navy-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-macon-navy-300" />
          <span className="text-lg font-medium text-macon-navy-100">{successMessage}</span>
        </div>
      )}

      {/* Add Blackout Form */}
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-4 text-macon-navy-50">Add Blackout Date</h2>
        <form onSubmit={handleAddBlackout} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="blackoutDate" className="text-macon-navy-100 text-lg">
              Date
            </Label>
            <Input
              id="blackoutDate"
              type="date"
              value={newBlackoutDate}
              onChange={(e) => setNewBlackoutDate(e.target.value)}
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 focus:border-macon-navy-500 text-lg h-12"
              required
              disabled={isAdding}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="blackoutReason" className="text-macon-navy-100 text-lg">
              Reason (optional)
            </Label>
            <Input
              id="blackoutReason"
              type="text"
              value={newBlackoutReason}
              onChange={(e) => setNewBlackoutReason(e.target.value)}
              placeholder="Holiday, maintenance, etc."
              className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 text-lg h-12"
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

      {/* Calendar View - Simple list for now, can be enhanced with a calendar library */}
      <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
        <h2 className="text-2xl font-semibold mb-6 text-macon-navy-50">Blackout Dates</h2>

        {/* Future Enhancement: Add a calendar view here */}
        <div className="mb-4 p-3 bg-macon-navy-700 border border-macon-navy-600 rounded text-base text-macon-navy-200">
          Calendar view coming soon. For now, all blackout dates are listed below.
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-macon-navy-600 hover:bg-macon-navy-700">
              <TableHead className="text-macon-navy-100 text-lg">Date</TableHead>
              <TableHead className="text-macon-navy-100 text-lg">Reason</TableHead>
              <TableHead className="text-macon-navy-100 text-lg w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-macon-navy-700">
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-macon-navy-300" />
                </TableCell>
              </TableRow>
            ) : sortedBlackouts.length === 0 ? (
              <TableRow className="hover:bg-macon-navy-700">
                <TableCell colSpan={3} className="text-center py-8 text-macon-navy-100 text-lg">
                  No blackout dates set
                </TableCell>
              </TableRow>
            ) : (
              sortedBlackouts.map((blackout) => (
                <TableRow key={blackout.id} className="border-macon-navy-600 hover:bg-macon-navy-700">
                  <TableCell className="font-medium">
                    <Badge
                      variant="outline"
                      className="border-macon-navy-500 bg-macon-navy-700 text-macon-navy-200 text-base"
                    >
                      {new Date(blackout.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-macon-navy-100 text-base">
                    {blackout.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDeleteBlackout(blackout.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-700 text-red-300 hover:bg-red-900/20"
                      aria-label={`Delete blackout date: ${new Date(blackout.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                      title="Delete blackout date"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
