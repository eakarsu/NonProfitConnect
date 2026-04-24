import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, DollarSign, Target, User, CheckCircle, Download, Pencil, Trash2, Save, X, Milestone, MessageCircle, FileText, Send, Plus, BookmarkPlus, BookmarkCheck, Share2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import ProjectDetailSkeleton from "@/components/skeletons/ProjectDetailSkeleton";
import AIInsightPanel from "@/components/AIInsightPanel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportProjectToPDF } from "@/lib/exportUtils";
import { useState } from "react";

export default function ProjectDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: [`/api/investments/project/${id}`],
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/reviews/project/${id}`],
    enabled: !!id,
  });

  const { data: milestonesData = [] } = useQuery({
    queryKey: [`/api/milestones/${id}`],
    enabled: !!id,
  });

  const { data: commentsData = [] } = useQuery({
    queryKey: [`/api/comments/${id}`],
    enabled: !!id,
  });

  const { data: documentsData = [] } = useQuery({
    queryKey: [`/api/documents/${id}`],
    enabled: !!id,
  });

  const { data: updatesData = [] } = useQuery({
    queryKey: [`/api/project-updates/${id}`],
    enabled: !!id,
  });

  const { data: bookmarksData = [] } = useQuery({
    queryKey: ['/api/bookmarks'],
    enabled: !!user,
  });

  const isBookmarked = (bookmarksData as any[]).some?.((b: any) => b.projectId === parseInt(id!));

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        return await apiRequest('DELETE', `/api/bookmarks/${id}`);
      }
      return await apiRequest('POST', '/api/bookmarks', { userId: user?.id, projectId: parseInt(id!) });
    },
    onSuccess: () => {
      toast({ title: isBookmarked ? "Removed" : "Bookmarked", description: isBookmarked ? "Bookmark removed." : "Project bookmarked!" });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      return await apiRequest('POST', '/api/comments', { projectId: parseInt(id!), content, parentId });
    },
    onSuccess: () => {
      setNewComment('');
      setReplyTo(null);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${id}`] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ decision, comments }: { decision: 'approved' | 'rejected'; comments?: string }) => {
      return await apiRequest('POST', '/api/reviews', {
        projectId: parseInt(id!),
        decision,
        comments: comments || ''
      });
    },
    onSuccess: () => {
      toast({ title: "Review Submitted", description: "Your review has been submitted successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/project/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/approved'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
    },
  });

  const investmentMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return await apiRequest('POST', '/api/investments', {
        projectId: parseInt(id!),
        amount
      });
    },
    onSuccess: () => {
      toast({ title: "Investment Successful", description: "Your investment has been submitted successfully." });
      setIsInvestmentModalOpen(false);
      setInvestmentAmount('');
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/investments/project/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Investment Failed", description: error.message || "Failed to submit investment", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Project updated successfully." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update project.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Project deleted successfully." });
      navigate('/projects');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (!project) return;
    setEditData({
      title: project.title,
      description: project.description,
      category: project.category,
      requestedAmount: project.requestedAmount,
      timeline: project.timeline,
      priority: project.priority,
    });
    setIsEditing(true);
  };

  const handleInvestment = () => {
    const amount = parseFloat(investmentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid investment amount.", variant: "destructive" });
      return;
    }
    investmentMutation.mutate({ amount });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="project-details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProjectDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="project-details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Project Not Found</h1>
            <p className="text-neutral-600 mt-2">The project you're looking for doesn't exist.</p>
            <Link href="/projects">
              <Button className="mt-4">Back to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const totalInvestment = project.fundingStatus?.total || investments.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  const goalAmount = project.fundingStatus?.goal || Number(project.requestedAmount);
  const progressPercentage = Math.min((totalInvestment / goalAmount) * 100, 100);
  const userInvestment = investments.find((inv: any) => inv.investorId === user?.id);
  const hasInvested = !!userInvestment;
  const isFullyFunded = totalInvestment >= goalAmount;
  const isOwner = project.userId === user?.id;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="project-details" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
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
                  <Label>Priority</Label>
                  <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Requested Amount</Label>
                  <Input value={editData.requestedAmount} onChange={(e) => setEditData({ ...editData, requestedAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Timeline</Label>
                  <Input value={editData.timeline} onChange={(e) => setEditData({ ...editData, timeline: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="project-details" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/projects">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <Button variant="outline" onClick={startEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={deleteMutation.isPending}>
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
                </>
              )}
              <Button
                variant="outline"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-2 text-primary" /> : <BookmarkPlus className="h-4 w-4 mr-2" />}
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link Copied", description: "Project link copied to clipboard." });
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={() => exportProjectToPDF(project).catch(() =>
                  toast({ title: "Error", description: "PDF export failed.", variant: "destructive" })
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{project.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className={`capitalize ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
                {project.priority === "high" && (
                  <Badge className="bg-error text-white">High Priority</Badge>
                )}
                <span className="text-neutral-600 text-sm">
                  Project #{project.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            {(project.status === "approved" || project.status === "funded") && (
              <Card>
                <CardHeader>
                  <CardTitle>Funding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Goal:</span>
                      <span className="font-medium">${goalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Raised:</span>
                      <span className="font-medium text-success">${totalInvestment.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Progress:</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {investments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Investments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments.slice(0, 5).map((investment: any) => (
                      <div key={investment.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm text-neutral-600">
                            Investment on {new Date(investment.investedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-medium text-success">
                          ${Number(investment.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-l-4 border-primary pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={review.decision === "approved" ? "bg-success text-white" : "bg-error text-white"}>
                            {review.decision}
                          </Badge>
                          <span className="text-sm text-neutral-600">
                            {new Date(review.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-700 text-sm">{review.comments}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Milestones */}
            {milestonesData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Milestone className="h-5 w-5" />
                    Project Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestonesData.map((ms: any) => (
                      <div key={ms.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
                          ms.status === 'completed' ? 'bg-green-500' :
                          ms.status === 'in_progress' ? 'bg-yellow-500' : 'bg-neutral-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ms.title}</p>
                          {ms.description && <p className="text-xs text-neutral-500 truncate">{ms.description}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {ms.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Updates */}
            {updatesData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {updatesData.map((update: any) => (
                      <div key={update.id} className="border-l-2 border-primary/30 pl-4">
                        <h4 className="font-medium text-sm">{update.title}</h4>
                        <p className="text-sm text-neutral-600 mt-1">{update.content}</p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments / Discussion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Discussion ({commentsData.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commentsData.map((comment: any) => (
                    <div key={comment.id} className={`p-3 rounded-lg bg-neutral-50 ${comment.parentId ? 'ml-6 border-l-2 border-neutral-200' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700">{comment.content}</p>
                      <Button variant="ghost" size="sm" className="text-xs mt-1 h-6 px-2"
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                        Reply
                      </Button>
                      {replyTo === comment.id && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="text-sm"
                          />
                          <Button size="sm" disabled={!replyContent.trim() || commentMutation.isPending}
                            onClick={() => commentMutation.mutate({ content: replyContent, parentId: comment.id })}>
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button disabled={!newComment.trim() || commentMutation.isPending}
                      onClick={() => commentMutation.mutate({ content: newComment })}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            {documentsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documentsData.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-neutral-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-neutral-400 capitalize">{doc.type}</p>
                          </div>
                        </div>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insight Panels */}
            <AIInsightPanel projectId={parseInt(id!)} type="analysis" />
            <AIInsightPanel projectId={parseInt(id!)} type="summary" />
            {project.status === "pending" && user?.roles?.includes("reviewer") && (
              <AIInsightPanel projectId={parseInt(id!)} type="review" />
            )}
            {(project.status === "approved" || project.status === "funded") && user?.roles?.includes("investor") && (
              <AIInsightPanel projectId={parseInt(id!)} type="investment" />
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Category</p>
                    <p className="font-medium capitalize">{project.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Requested Amount</p>
                    <p className="font-medium">${Number(project.requestedAmount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Timeline</p>
                    <p className="font-medium">{project.timeline}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Submitted</p>
                    <p className="font-medium">{new Date(project.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600 mb-4">
                      As a reviewer, you can approve or reject this project application.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        className="flex-1 bg-success hover:bg-success/90"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ decision: 'approved', comments: 'Project approved by reviewer' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {reviewMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ decision: 'rejected', comments: 'Project rejected by reviewer' })}
                      >
                        {reviewMutation.isPending ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.status === "approved" && (
              <Card>
                <CardHeader>
                  <CardTitle>Take Action</CardTitle>
                </CardHeader>
                <CardContent>
                  {isFullyFunded ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary mr-2" />
                        <span className="text-primary font-medium">Project Fully Funded</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-neutral-600">This project has reached its funding goal</p>
                        <p className="text-lg font-bold text-primary">
                          ${totalInvestment.toLocaleString()} / ${goalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : hasInvested ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-4 bg-success/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success mr-2" />
                        <span className="text-success font-medium">You've invested in this project</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-neutral-600">Your investment:</p>
                        <p className="text-lg font-bold text-success">
                          ${Number(userInvestment.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Invested on {new Date(userInvestment.investedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Dialog open={isInvestmentModalOpen} onOpenChange={setIsInvestmentModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Invest in Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invest in Project</DialogTitle>
                          <DialogDescription>
                            Enter the amount you would like to invest in this project.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Investment Amount ($)</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="Enter amount..."
                              value={investmentAmount}
                              onChange={(e) => setInvestmentAmount(e.target.value)}
                              min="1"
                              step="1"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1" onClick={() => setIsInvestmentModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleInvestment} disabled={investmentMutation.isPending}>
                              {investmentMutation.isPending ? 'Processing...' : 'Invest'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
