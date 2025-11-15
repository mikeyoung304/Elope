import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatePackageButtonProps {
  onClick: () => void;
}

export function CreatePackageButton({ onClick }: CreatePackageButtonProps) {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onClick}
        className="bg-lavender-500 hover:bg-lavender-600 text-lg h-12 px-6"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Package
      </Button>
    </div>
  );
}
