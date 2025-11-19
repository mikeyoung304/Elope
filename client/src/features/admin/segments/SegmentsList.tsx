import { Edit, Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SegmentDto } from "@elope/contracts";

interface SegmentsListProps {
  segments: SegmentDto[];
  onEdit: (segment: SegmentDto) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SegmentsList({
  segments,
  onEdit,
  onDelete,
  isLoading = false,
}: SegmentsListProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-macon-navy-600 hover:bg-macon-navy-700">
            <TableHead className="text-macon-navy-100 text-lg">Name</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Slug</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Hero Title</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Status</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Sort Order</TableHead>
            <TableHead className="text-macon-navy-100 text-lg">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-macon-navy-300" />
              </TableCell>
            </TableRow>
          )}

          {!isLoading && segments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-macon-navy-100">
                No segments found. Create your first segment to get started.
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            segments.map((segment) => (
              <TableRow key={segment.id} className="border-macon-navy-600 hover:bg-macon-navy-700">
                <TableCell className="font-medium text-macon-navy-50 text-base">
                  {segment.name}
                </TableCell>
                <TableCell className="text-macon-navy-200 text-base font-mono">
                  {segment.slug}
                </TableCell>
                <TableCell className="text-macon-navy-200 text-base">
                  {truncateText(segment.heroTitle, 50)}
                </TableCell>
                <TableCell>
                  {segment.active ? (
                    <Badge className="bg-green-900 text-green-100 border-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-macon-navy-700 text-macon-navy-200 border-macon-navy-600">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-macon-navy-200 text-base">
                  {segment.sortOrder}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(segment)}
                      className="border-macon-navy-600 text-macon-navy-200 hover:bg-macon-navy-700"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(segment.id)}
                      className="text-destructive hover:bg-macon-navy-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
