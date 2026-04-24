import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, X, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetailSheetProps {
  project: any;
  open: boolean;
  onClose: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function DetailSheet({ project, open, onClose, canEdit = false, canDelete = false }: DetailSheetProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    requestedAmount: "",
    timeline: "",
    priority: "",
  });

  const startEditing = () => {
    setEditData({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "",
      requestedAmount: project.requestedAmount || "",
      timeline: project.timeline || "",
      priority: project.priority || "",
    });
    setIsEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Project updated successfully." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update project.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/projects/${project.id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Project deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/user"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-white";
      case "approved": return "bg-success text-white";
      case "rejected": return "bg-error text-white";
      case "funded": return "bg-primary text-white";
      case "completed": return "bg-success text-white";
      default: return "bg-neutral-200 text-neutral-900";
    }
  };

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setIsEditing(false); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Project" : project.title}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update the project details below." : `Project #${project.id}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={4} />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="arts">Arts & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-amount">Requested Amount</Label>
                <Input id="edit-amount" value={editData.requestedAmount} onChange={(e) => setEditData({ ...editData, requestedAmount: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-timeline">Timeline</Label>
                <Input id="edit-timeline" value={editData.timeline} onChange={(e) => setEditData({ ...editData, timeline: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge className={`capitalize ${getStatusColor(project.status)}`}>{project.status}</Badge>
                {project.priority === "high" && <Badge className="bg-error text-white">High Priority</Badge>}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-neutral-600">Category:</span>
                  <p className="font-medium capitalize">{project.category}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Requested Amount:</span>
                  <p className="font-medium">${Number(project.requestedAmount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Timeline:</span>
                  <p className="font-medium">{project.timeline}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Submitted:</span>
                  <p className="font-medium">{project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-neutral-600">Description:</span>
                <p className="text-sm mt-1">{project.description}</p>
              </div>

              {project.fundingStatus && (
                <div className="space-y-1 text-sm">
                  <span className="text-neutral-600">Funding:</span>
                  <p className="font-medium">
                    ${project.fundingStatus.total?.toLocaleString() || 0} / ${project.fundingStatus.goal?.toLocaleString() || Number(project.requestedAmount).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {canEdit && (
                  <Button variant="outline" onClick={startEditing} className="flex-1">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1" disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
