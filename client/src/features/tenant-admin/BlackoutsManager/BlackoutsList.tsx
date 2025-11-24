import { Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BlackoutDto } from "./types";

interface BlackoutsListProps {
  blackouts: BlackoutDto[];
  isLoading: boolean;
  onDeleteClick: (blackout: BlackoutDto) => void;
}

/**
 * BlackoutsList Component
 *
 * Displays a table of blackout dates with delete actions
 */
export function BlackoutsList({ blackouts, isLoading, onDeleteClick }: BlackoutsListProps) {
  // Sort blackouts by date (most recent first)
  const sortedBlackouts = [...blackouts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="p-6 bg-macon-navy-800 border-macon-navy-600">
      <h2 className="text-2xl font-semibold mb-6 text-macon-navy-50">Blackout Dates</h2>

      {/* Future Enhancement Note */}
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
                    onClick={() => onDeleteClick(blackout)}
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
  );
}