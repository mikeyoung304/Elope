import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormSkeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LoadingState() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-macon-navy-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 text-macon-navy-200 hover:text-macon-navy-100"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-macon-navy-50">Edit Tenant</h1>
        </div>
        <Card className="bg-macon-navy-800 border-macon-navy-600">
          <CardHeader>
            <CardTitle className="text-macon-navy-50">Tenant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={7} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}