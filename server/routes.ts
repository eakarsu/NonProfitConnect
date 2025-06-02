import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMultiAuth, isAuthenticated as multiAuthIsAuthenticated } from "./multiAuth";
import { insertProjectSchema, insertReviewSchema, insertInvestmentSchema } from "@shared/schema";
import { z } from "zod";

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

  // Project routes
  app.post('/api/projects', unifiedAuth, async (req: any, res) => {
    try {
      // Get user ID from either multi-provider auth or Replit auth
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData, userId);
      
      // Create notification for reviewers
      await storage.createNotification({
        userId: userId, // Will need to be updated to notify all reviewers
        title: "New Application Submitted",
        message: `Your application "${project.title}" has been submitted for review.`,
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/user', unifiedAuth, async (req: any, res) => {
    try {
      // Get user ID from either multi-provider auth or Replit auth
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
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
      
      // Get funding status for each project
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
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Review routes
  app.post('/api/reviews', unifiedAuth, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims ? req.user.claims.sub : req.user.id;
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData, reviewerId);
      
      // Get project details for notification
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
  app.post('/api/investments', unifiedAuth, async (req: any, res) => {
    try {
      const investorId = req.user.claims ? req.user.claims.sub : req.user.id;
      const validatedData = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment(validatedData, investorId);
      
      // Get project details for notification
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

  app.get('/api/investments/user', unifiedAuth, async (req: any, res) => {
    try {
      const investorId = req.user.claims ? req.user.claims.sub : req.user.id;
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
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/stats/reviewer', unifiedAuth, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims ? req.user.claims.sub : req.user.id;
      const stats = await storage.getReviewerStats(reviewerId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reviewer stats:", error);
      res.status(500).json({ message: "Failed to fetch reviewer stats" });
    }
  });

  app.get('/api/stats/investor', unifiedAuth, async (req: any, res) => {
    try {
      const investorId = req.user.claims ? req.user.claims.sub : req.user.id;
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
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
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

  const httpServer = createServer(app);
  return httpServer;
}
