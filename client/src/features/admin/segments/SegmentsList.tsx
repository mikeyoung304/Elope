import { Edit, Trash2, Loader2, Layers } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { SegmentDto } from "@macon/contracts";

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

  if (!isLoading && segments.length === 0) {
    return (
      <Card className="p-6 bg-macon-navy-800 border-white/20">
        <h2 className="text-2xl font-semibold mb-4 text-white">Segments</h2>
        <EmptyState
          icon={Layers}
          title="Ready to organize your services"
          description="Create your first segment to group related packages. Your segments will appear here."
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-macon-navy-800 border-white/20">
      <h2 className="text-2xl font-semibold mb-4 text-white">Segments</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-macon-navy-700">
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Name</TableHead>
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Slug</TableHead>
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Hero Title</TableHead>
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Status</TableHead>
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Sort Order</TableHead>
              <TableHead className="bg-macon-navy-700 text-white/90 text-lg">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/60" />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              segments.map((segment) => (
                <TableRow key={segment.id} className="border-white/20 hover:bg-macon-navy-700 bg-macon-navy-800">
                  <TableCell className="font-medium text-white text-base bg-transparent">
                    {segment.name}
                  </TableCell>
                  <TableCell className="text-white/70 text-base font-mono bg-transparent">
                    {segment.slug}
                  </TableCell>
                  <TableCell className="text-white/70 text-base bg-transparent">
                    {truncateText(segment.heroTitle, 50)}
                  </TableCell>
                  <TableCell className="bg-transparent">
                    {segment.active ? (
                      <Badge className="bg-green-900 text-green-100 border-green-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-macon-navy-700 text-white/70 border-white/20">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white/70 text-base bg-transparent">
                    {segment.sortOrder}
                  </TableCell>
                  <TableCell className="bg-transparent">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => onEdit(segment)}
                        className="border-white/30 text-white/90 hover:bg-macon-navy-600"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => onDelete(segment.id)}
                        className="border-red-700 text-red-300 hover:bg-red-900/20"
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
    </Card>
  );
}
