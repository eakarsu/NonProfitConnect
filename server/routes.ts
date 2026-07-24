import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMultiAuth, isAuthenticated as multiAuthIsAuthenticated } from "./multiAuth";
import { insertProjectSchema, insertReviewSchema, insertInvestmentSchema, updateProfileSchema, aiResults } from "@shared/schema";
import { db } from "./db";
import { z } from "zod";
import { sanitizeBody } from "./middleware/sanitize";
import { requireRole } from "./middleware/rbac";
import { exportLimiter } from "./middleware/rateLimiter";
import {
  generateProjectDescription,
  analyzeProject,
  generateReviewSuggestion,
  analyzeInvestmentOpportunity,
  generateProjectSummary,
  generateProposalDraft,
  segmentDonors,
  matchDonation,
} from "./openrouter";
import { registerNewRoutes } from "./newRoutes";
import { registerExtraRoutes } from "./extraRoutes";
import { registerNonprofitOperationsRoutes } from "./nonprofitOperationsRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Multi-provider auth setup
  await setupMultiAuth(app);

  // Keep Replit auth as fallback/additional option
  await setupAuth(app);

  // Auth routes - handle both multi-provider and Replit auth
  app.get('/api/auth/user', (req: any, res, next) => {
    // Try multi-provider auth first
    if (req.isAuthenticated() && req.user && !req.user.claims) {
      return next();
    }
    // Fall back to Replit auth
    return isAuthenticated(req, res, next);
  }, async (req: any, res) => {
    try {
      let userId;

      // Handle multi-provider auth user
      if (req.user && !req.user.claims) {
        userId = req.user.id;
      }
      // Handle Replit auth user
      else if (req.user && req.user.claims) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create a unified auth middleware that works with both systems
  const unifiedAuth: RequestHandler = (req: any, res: any, next: any) => {
    // Check if user is authenticated via multi-provider auth (passport session)
    if (req.isAuthenticated() && req.user && !req.user.claims) {
      return next();
    }
    // Fall back to Replit auth
    return isAuthenticated(req, res, next);
  };

  // Helper to get user ID from request
  const getUserId = (req: any): string => {
    return req.user.claims ? req.user.claims.sub : req.user.id;
  };

  // Project routes
  app.post('/api/projects', unifiedAuth, sanitizeBody, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData, userId);

      await storage.createNotification({
        userId: userId,
        title: "New Application Submitted",
        message: `Your application "${project.title}" has been submitted for review.`,
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  // Paginated projects listing
  app.get('/api/projects', unifiedAuth, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const category = req.query.category as string;
      const priority = req.query.priority as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as string;

      const result = await storage.getProjectsPaginated({
        page,
        limit,
        search,
        status,
        category,
        priority,
        sortBy,
        sortOrder,
      });

      // Add funding status
      const dataWithFunding = await Promise.all(
        result.data.map(async (project) => {
          const fundingStatus = await storage.getProjectFundingStatus(project.id);
          return { ...project, fundingStatus };
        })
      );

      res.json({
        data: dataWithFunding,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      console.error("Error fetching paginated projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/user', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/pending', unifiedAuth, async (req: any, res) => {
    try {
      const projects = await storage.getPendingReviews();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching pending projects:", error);
      res.status(500).json({ message: "Failed to fetch pending projects" });
    }
  });

  app.get('/api/projects/approved', unifiedAuth, async (req: any, res) => {
    try {
      const projects = await storage.getApprovedProjects();

      const projectsWithFunding = await Promise.all(
        projects.map(async (project) => {
          const fundingStatus = await storage.getProjectFundingStatus(project.id);
          return {
            ...project,
            fundingStatus,
          };
        })
      );

      res.json(projectsWithFunding);
    } catch (error) {
      console.error("Error fetching approved projects:", error);
      res.status(500).json({ message: "Failed to fetch approved projects" });
    }
  });

  app.get('/api/projects/:id', unifiedAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const fundingStatus = await storage.getProjectFundingStatus(projectId);
      const projectWithFunding = {
        ...project,
        fundingStatus,
      };

      res.json(projectWithFunding);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.get('/api/projects/:id/funding', unifiedAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const fundingStatus = await storage.getProjectFundingStatus(projectId);
      res.json(fundingStatus);
    } catch (error) {
      console.error("Error fetching project funding status:", error);
      res.status(500).json({ message: "Failed to fetch funding status" });
    }
  });

  // Update single project
  app.patch('/api/projects/:id', unifiedAuth, sanitizeBody, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getUserId(req);

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this project" });
      }

      const updated = await storage.updateProject(projectId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // Delete single project
  app.delete('/api/projects/:id', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getUserId(req);

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }

      await storage.deleteProject(projectId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Bulk delete projects
  app.delete('/api/projects/bulk', unifiedAuth, async (req: any, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid project IDs" });
      }

      const userId = getUserId(req);

      // Verify ownership of all projects
      for (const id of ids) {
        const project = await storage.getProject(id);
        if (!project || project.userId !== userId) {
          return res.status(403).json({ message: `Not authorized to delete project ${id}` });
        }
      }

      await storage.deleteProjects(ids);
      res.json({ success: true, deleted: ids.length });
    } catch (error) {
      console.error("Error bulk deleting projects:", error);
      res.status(500).json({ message: "Failed to delete projects" });
    }
  });

  // Bulk status update (reviewer role)
  app.patch('/api/projects/bulk-status', unifiedAuth, requireRole('reviewer'), sanitizeBody, async (req: any, res) => {
    try {
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ message: "Invalid request" });
      }

      await storage.updateProjectsStatus(ids, status);
      res.json({ success: true, updated: ids.length });
    } catch (error) {
      console.error("Error bulk updating projects:", error);
      res.status(500).json({ message: "Failed to update projects" });
    }
  });

  // Review routes
  app.post('/api/reviews', unifiedAuth, requireRole('reviewer'), sanitizeBody, async (req: any, res) => {
    try {
      const reviewerId = getUserId(req);
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData, reviewerId);

      const project = await storage.getProject(validatedData.projectId);
      if (project) {
        await storage.createNotification({
          userId: project.userId,
          title: `Application ${validatedData.decision}`,
          message: `Your application "${project.title}" has been ${validatedData.decision}.`,
        });
      }

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  // Investment routes
  app.post('/api/investments', unifiedAuth, requireRole('investor'), sanitizeBody, async (req: any, res) => {
    try {
      const investorId = getUserId(req);
      const validatedData = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment(validatedData, investorId);

      const project = await storage.getProject(validatedData.projectId);
      if (project) {
        await storage.createNotification({
          userId: project.userId,
          title: "New Investment Received",
          message: `Your project "${project.title}" received an investment of $${validatedData.amount}.`,
        });
      }

      res.json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(400).json({ message: "Failed to create investment" });
    }
  });

  app.get('/api/investments/user', unifiedAuth, requireRole('investor'), async (req: any, res) => {
    try {
      const investorId = getUserId(req);
      const investments = await storage.getInvestmentsByInvestor(investorId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching user investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  // Stats routes
  app.get('/api/stats/user', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/stats/reviewer', unifiedAuth, requireRole('reviewer'), async (req: any, res) => {
    try {
      const reviewerId = getUserId(req);
      const stats = await storage.getReviewerStats(reviewerId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reviewer stats:", error);
      res.status(500).json({ message: "Failed to fetch reviewer stats" });
    }
  });

  app.get('/api/stats/investor', unifiedAuth, requireRole('investor'), async (req: any, res) => {
    try {
      const investorId = getUserId(req);
      const stats = await storage.getInvestorStats(investorId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching investor stats:", error);
      res.status(500).json({ message: "Failed to fetch investor stats" });
    }
  });

  // Notification routes
  app.get('/api/notifications', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', unifiedAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // User profile
  app.patch('/api/user/profile', unifiedAuth, sanitizeBody, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(userId, validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Export routes
  app.get('/api/export/projects/csv', unifiedAuth, exportLimiter, async (req: any, res) => {
    try {
      const allProjects = await storage.getAllProjects();

      const headers = ["ID", "Title", "Description", "Category", "Requested Amount", "Timeline", "Status", "Priority", "Submitted At"];
      const rows = allProjects.map((p) => [
        p.id,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.category,
        p.requestedAmount,
        p.timeline,
        p.status,
        p.priority,
        p.submittedAt ? new Date(p.submittedAt).toISOString() : '',
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting projects:", error);
      res.status(500).json({ message: "Failed to export projects" });
    }
  });

  app.get('/api/export/investments/csv', unifiedAuth, exportLimiter, async (req: any, res) => {
    try {
      const investorId = getUserId(req);
      const userInvestments = await storage.getInvestmentsByInvestor(investorId);

      const headers = ["ID", "Project Title", "Amount", "Project Status", "Invested At"];
      const rows = userInvestments.map((inv: any) => [
        inv.id,
        `"${(inv.projectTitle || '').replace(/"/g, '""')}"`,
        inv.amount,
        inv.projectStatus,
        inv.investedAt ? new Date(inv.investedAt).toISOString() : '',
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=investments.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting investments:", error);
      res.status(500).json({ message: "Failed to export investments" });
    }
  });

  // Register all new feature routes
  registerNewRoutes(app, unifiedAuth, getUserId);
  registerExtraRoutes(app, unifiedAuth, getUserId);

  // ==========================================
  // AI Routes (OpenRouter)
  // ==========================================

  // Generate project description with AI
  app.post('/api/ai/generate-description', unifiedAuth, async (req: any, res) => {
    try {
      const { title, category } = req.body;
      if (!title || !category) {
        return res.status(400).json({ message: "Title and category are required" });
      }
      const result = await generateProjectDescription(title, category);
      res.json(result);
    } catch (error: any) {
      console.error("AI generate description error:", error);
      res.status(500).json({ message: error.message || "AI generation failed" });
    }
  });

  // Analyze a project with AI
  app.get('/api/ai/analyze-project/:id', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const result = await analyzeProject(project);
      res.json(result);
    } catch (error: any) {
      console.error("AI analyze project error:", error);
      res.status(500).json({ message: error.message || "AI analysis failed" });
    }
  });

  // AI review suggestion
  app.get('/api/ai/review-suggestion/:id', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const result = await generateReviewSuggestion(project);
      res.json(result);
    } catch (error: any) {
      console.error("AI review suggestion error:", error);
      res.status(500).json({ message: error.message || "AI review suggestion failed" });
    }
  });

  // AI investment analysis
  app.get('/api/ai/investment-analysis/:id', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const fundingStatus = await storage.getProjectFundingStatus(projectId);
      const result = await analyzeInvestmentOpportunity(project, fundingStatus);
      res.json(result);
    } catch (error: any) {
      console.error("AI investment analysis error:", error);
      res.status(500).json({ message: error.message || "AI investment analysis failed" });
    }
  });

  // AI proposal-writing assistant
  app.post('/api/ai/proposal-draft', unifiedAuth, async (req: any, res) => {
    try {
      const { title, category, targetFunders, budget, timeline, goals } = req.body || {};
      if (!title || !category) {
        return res.status(400).json({ message: "title and category are required" });
      }
      const result = await generateProposalDraft({ title, category, targetFunders, budget, timeline, goals });
      const [persisted] = await db.insert(aiResults).values({
        userId: getUserId(req),
        feature: 'proposal-draft',
        input: { title, category, targetFunders, budget, timeline, goals },
        output: result,
        model: process.env.OPENROUTER_MODEL || '',
      }).returning({ id: aiResults.id });
      res.json({ id: persisted.id, result, model: process.env.OPENROUTER_MODEL });
    } catch (error: any) {
      console.error("AI proposal draft error:", error);
      res.status(500).json({ message: error.message || "AI proposal draft failed" });
    }
  });

  // AI donor segmentation
  app.post('/api/ai/segment-donors', unifiedAuth, async (req: any, res) => {
    try {
      const { donors } = req.body || {};
      if (!Array.isArray(donors) || donors.length === 0) {
        return res.status(400).json({ message: "donors (non-empty array) is required" });
      }
      const result = await segmentDonors(donors);
      res.json(result);
    } catch (error: any) {
      console.error("AI segment donors error:", error);
      res.status(500).json({ message: error.message || "AI donor segmentation failed" });
    }
  });

  // AI donation matching
  app.post('/api/ai/match-donation', unifiedAuth, async (req: any, res) => {
    try {
      const { donor, projects } = req.body || {};
      if (!donor || !Array.isArray(projects)) {
        return res.status(400).json({ message: "donor (object) and projects (array) are required" });
      }
      const result = await matchDonation(donor, projects);
      res.json(result);
    } catch (error: any) {
      console.error("AI match donation error:", error);
      res.status(500).json({ message: error.message || "AI donation matching failed" });
    }
  });

  // AI project summary
  app.get('/api/ai/project-summary/:id', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const projectReviews = await storage.getReviewsByProject(projectId);
      const projectInvestments = await storage.getInvestmentsByProject(projectId);
      const result = await generateProjectSummary(project, projectReviews, projectInvestments);
      res.json(result);
    } catch (error: any) {
      console.error("AI project summary error:", error);
      res.status(500).json({ message: error.message || "AI summary generation failed" });
    }
  });

  // Review routes for getting reviews by project (needed by project details page)
  app.get('/api/reviews/project/:id', unifiedAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const projectReviews = await storage.getReviewsByProject(projectId);
      res.json(projectReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Investment routes for getting investments by project
  app.get('/api/investments/project/:id', unifiedAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const projectInvestments = await storage.getInvestmentsByProject(projectId);
      res.json(projectInvestments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  registerNonprofitOperationsRoutes(app, unifiedAuth, getUserId);

  const httpServer = createServer(app);
  return httpServer;
}
