import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onDeselectAll: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  isDeleting?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onDeselectAll,
  onDelete,
  onStatusChange,
  isDeleting,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg mb-4">
      <span className="text-sm font-medium">{selectedCount} item{selectedCount > 1 ? "s" : ""} selected</span>

      {onStatusChange && (
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Set Pending</SelectItem>
            <SelectItem value="approved">Set Approved</SelectItem>
            <SelectItem value="rejected">Set Rejected</SelectItem>
          </SelectContent>
        </Select>
      )}

      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount} selected item{selectedCount > 1 ? "s" : ""}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button variant="ghost" size="sm" onClick={onDeselectAll}>
        <X className="h-4 w-4 mr-1" />
        Deselect All
      </Button>
    </div>
  );
}
