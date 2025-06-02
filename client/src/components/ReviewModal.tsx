import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ReviewModalProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
}

export default function ReviewModal({ isOpen, project, onClose }: ReviewModalProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (data: { projectId: number; decision: string; comments: string }) => {
      await apiRequest("POST", "/api/reviews", data);
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: `Application has been ${decision}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/reviewer"] });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Review Failed",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!decision) {
      toast({
        title: "Decision Required",
        description: "Please select approve or reject before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments for your decision.",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      projectId: project.id,
      decision,
      comments: comments.trim(),
    });
  };

  const handleClose = () => {
    setComments("");
    setDecision(null);
    onClose();
  };

  if (!project) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-error text-white";
      case "medium":
        return "bg-warning text-white";
      case "low":
        return "bg-neutral-200 text-neutral-900";
      default:
        return "bg-neutral-200 text-neutral-900";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Application</DialogTitle>
          <DialogDescription>
            Review the project details and provide your decision with comments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{project.title}</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <Badge className={`capitalize ${getPriorityColor(project.priority)}`}>
                    {project.priority} Priority
                  </Badge>
                  <span className="text-sm text-neutral-600">
                    Category: {project.category}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-neutral-700 mb-4">{project.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                <p className="font-medium">{new Date(project.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Your Decision</Label>
            <div className="flex space-x-4">
              <Button
                variant={decision === "approved" ? "default" : "outline"}
                onClick={() => setDecision("approved")}
                className={`flex items-center ${
                  decision === "approved" ? "bg-success hover:bg-success/90" : ""
                }`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={decision === "rejected" ? "default" : "outline"}
                onClick={() => setDecision("rejected")}
                className={`flex items-center ${
                  decision === "rejected" ? "bg-error hover:bg-error/90" : ""
                }`}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium">
              Review Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Provide detailed feedback about your decision..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
