import type { Express, RequestHandler } from "express";
import { db } from "./db";
import {
  users, projects, reviews, investments, notifications,
  messages, milestones, comments, bookmarks, projectUpdates,
  activityLog, documents
} from "@shared/schema";
import { eq, desc, sql, and, or, asc, inArray, count } from "drizzle-orm";
import { callOpenRouter } from "./openrouter";

export function registerNewRoutes(
  app: Express,
  unifiedAuth: RequestHandler,
  getUserId: (req: any) => string
) {
  // ==========================================
  // MESSAGES
  // ==========================================

  // List conversations (grouped by other user)
  app.get('/api/messages', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const conversations = await db.execute(sql`
        SELECT
          c.other_user_id AS "userId",
          u.first_name || ' ' || u.last_name AS "userName",
          u.email AS "userEmail",
          c.last_message_at AS "lastMessageAt",
          c.message_count AS "messageCount",
          c.unread_count AS "unreadCount"
        FROM (
          SELECT
            CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END AS other_user_id,
            MAX(created_at) AS last_message_at,
            COUNT(*) AS message_count,
            SUM(CASE WHEN receiver_id = ${userId} AND read = false THEN 1 ELSE 0 END) AS unread_count
          FROM messages
          WHERE sender_id = ${userId} OR receiver_id = ${userId}
          GROUP BY other_user_id
        ) c
        JOIN users u ON u.id = c.other_user_id
        ORDER BY c.last_message_at DESC
      `);
      res.json(conversations.rows);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation with specific user
  app.get('/api/messages/:userId', unifiedAuth, async (req: any, res) => {
    try {
      const currentUserId = getUserId(req);
      const otherUserId = req.params.userId;
      const result = await db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
          )
        )
        .orderBy(asc(messages.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post('/api/messages', unifiedAuth, async (req: any, res) => {
    try {
      const senderId = getUserId(req);
      const { receiverId, subject, content } = req.body;
      if (!receiverId || !content) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }
      const [msg] = await db
        .insert(messages)
        .values({ senderId, receiverId, subject, content })
        .returning();
      res.json(msg);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.patch('/api/messages/:id/read', unifiedAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // List all users (for picking message recipients)
  app.get('/api/users/list', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          roles: users.roles,
        })
        .from(users)
        .orderBy(asc(users.firstName));
      res.json(result);
    } catch (error) {
      console.error("Error fetching users list:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ==========================================
  // MILESTONES
  // ==========================================

  // Get milestones for a project
  app.get('/api/projects/:id/milestones', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await db
        .select()
        .from(milestones)
        .where(eq(milestones.projectId, projectId))
        .orderBy(asc(milestones.sortOrder));
      res.json(result);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Create milestone
  app.post('/api/projects/:id/milestones', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { title, description, targetDate, status, sortOrder } = req.body;
      if (!title) {
        return res.status(400).json({ message: "title is required" });
      }
      const [milestone] = await db
        .insert(milestones)
        .values({
          projectId,
          title,
          description: description || null,
          targetDate: targetDate ? new Date(targetDate) : null,
          status: status || "pending",
          sortOrder: sortOrder ?? 0,
        })
        .returning();
      res.json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Update milestone
  app.patch('/api/milestones/:id', unifiedAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates: any = {};
      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.targetDate !== undefined) updates.targetDate = req.body.targetDate ? new Date(req.body.targetDate) : null;
      if (req.body.status !== undefined) {
        updates.status = req.body.status;
        if (req.body.status === "completed") updates.completedAt = new Date();
      }
      if (req.body.sortOrder !== undefined) updates.sortOrder = req.body.sortOrder;

      const [updated] = await db
        .update(milestones)
        .set(updates)
        .where(eq(milestones.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  // Delete milestone
  app.delete('/api/milestones/:id', unifiedAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(milestones).where(eq(milestones.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // ==========================================
  // COMMENTS (threaded)
  // ==========================================

  // Get comments for a project
  app.get('/api/projects/:id/comments', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await db
        .select({
          id: comments.id,
          projectId: comments.projectId,
          userId: comments.userId,
          parentId: comments.parentId,
          content: comments.content,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.projectId, projectId))
        .orderBy(asc(comments.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create comment
  app.post('/api/projects/:id/comments', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { content, parentId } = req.body;
      if (!content) {
        return res.status(400).json({ message: "content is required" });
      }
      const [comment] = await db
        .insert(comments)
        .values({
          projectId,
          userId,
          content,
          parentId: parentId || null,
        })
        .returning();
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Delete comment
  app.delete('/api/comments/:id', unifiedAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const [comment] = await db.select().from(comments).where(eq(comments.id, id));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      // Delete replies first, then the comment
      await db.delete(comments).where(eq(comments.parentId, id));
      await db.delete(comments).where(eq(comments.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ==========================================
  // BOOKMARKS
  // ==========================================

  // Get user's bookmarks
  app.get('/api/bookmarks', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const result = await db
        .select({
          id: bookmarks.id,
          projectId: bookmarks.projectId,
          createdAt: bookmarks.createdAt,
          projectTitle: projects.title,
          projectDescription: projects.description,
          projectStatus: projects.status,
          projectCategory: projects.category,
          projectRequestedAmount: projects.requestedAmount,
        })
        .from(bookmarks)
        .innerJoin(projects, eq(bookmarks.projectId, projects.id))
        .where(eq(bookmarks.userId, userId))
        .orderBy(desc(bookmarks.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Create bookmark
  app.post('/api/bookmarks', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }
      // Check if already bookmarked
      const [existing] = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.projectId, projectId)));
      if (existing) {
        return res.status(409).json({ message: "Already bookmarked" });
      }
      const [bookmark] = await db
        .insert(bookmarks)
        .values({ userId, projectId })
        .returning();
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Delete bookmark
  app.delete('/api/bookmarks/:projectId', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const projectId = parseInt(req.params.projectId);
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.projectId, projectId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // ==========================================
  // PROJECT UPDATES
  // ==========================================

  // Get updates for a project
  app.get('/api/projects/:id/updates', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await db
        .select({
          id: projectUpdates.id,
          projectId: projectUpdates.projectId,
          userId: projectUpdates.userId,
          title: projectUpdates.title,
          content: projectUpdates.content,
          createdAt: projectUpdates.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(projectUpdates)
        .leftJoin(users, eq(projectUpdates.userId, users.id))
        .where(eq(projectUpdates.projectId, projectId))
        .orderBy(desc(projectUpdates.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching project updates:", error);
      res.status(500).json({ message: "Failed to fetch project updates" });
    }
  });

  // Create project update
  app.post('/api/projects/:id/updates', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "title and content are required" });
      }
      const [update] = await db
        .insert(projectUpdates)
        .values({ projectId, userId, title, content })
        .returning();
      res.json(update);
    } catch (error) {
      console.error("Error creating project update:", error);
      res.status(500).json({ message: "Failed to create project update" });
    }
  });

  // ==========================================
  // ACTIVITY LOG
  // ==========================================

  // Get activity log (paginated, limit 50)
  app.get('/api/activity', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
      const offset = (page - 1) * limit;

      const result = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityLog)
        .where(eq(activityLog.userId, userId));

      res.json({
        data: result,
        total: Number(totalResult?.count || 0),
        page,
        limit,
      });
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  // Log an activity (internal)
  app.post('/api/activity', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { action, entityType, entityId, details } = req.body;
      if (!action || !entityType) {
        return res.status(400).json({ message: "action and entityType are required" });
      }
      const [entry] = await db
        .insert(activityLog)
        .values({
          userId,
          action,
          entityType,
          entityId: entityId || null,
          details: details || null,
        })
        .returning();
      res.json(entry);
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  // ==========================================
  // DOCUMENTS
  // ==========================================

  // Get documents for a project
  app.get('/api/projects/:id/documents', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, projectId))
        .orderBy(desc(documents.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Create document
  app.post('/api/projects/:id/documents', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { name, url, type } = req.body;
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }
      const [doc] = await db
        .insert(documents)
        .values({
          projectId,
          userId,
          name,
          url: url || null,
          type: type || "link",
        })
        .returning();
      res.json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', unifiedAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (doc.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this document" });
      }
      await db.delete(documents).where(eq(documents.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // ==========================================
  // ANALYTICS
  // ==========================================

  // Platform overview
  app.get('/api/analytics/overview', unifiedAuth, async (req: any, res) => {
    try {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
      const [totalFunded] = await db
        .select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(investments);
      const [activeProjects] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(or(eq(projects.status, "approved"), eq(projects.status, "funded")));

      res.json({
        totalUsers: Number(userCount?.count || 0),
        totalProjects: Number(projectCount?.count || 0),
        totalFunded: Number(totalFunded?.total || 0),
        activeProjects: Number(activeProjects?.count || 0),
      });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // Funding by category
  app.get('/api/analytics/funding-by-category', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        SELECT p.category, COALESCE(SUM(i.amount), 0) AS total_funded, COUNT(DISTINCT p.id) AS project_count
        FROM projects p
        LEFT JOIN investments i ON i.project_id = p.id
        GROUP BY p.category
        ORDER BY total_funded DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching funding by category:", error);
      res.status(500).json({ message: "Failed to fetch funding by category" });
    }
  });

  // Funding over time (last 12 months)
  app.get('/api/analytics/funding-over-time', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', invested_at), 'YYYY-MM') AS month,
          COALESCE(SUM(amount), 0) AS total
        FROM investments
        WHERE invested_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', invested_at)
        ORDER BY month ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching funding over time:", error);
      res.status(500).json({ message: "Failed to fetch funding over time" });
    }
  });

  // Status distribution
  app.get('/api/analytics/status-distribution', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        SELECT status, COUNT(*) AS count
        FROM projects
        GROUP BY status
        ORDER BY count DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching status distribution:", error);
      res.status(500).json({ message: "Failed to fetch status distribution" });
    }
  });

  // Top investors
  app.get('/api/analytics/top-investors', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          u.id, u.first_name, u.last_name, u.email, u.profile_image_url,
          COALESCE(SUM(i.amount), 0) AS total_invested,
          COUNT(DISTINCT i.project_id) AS project_count
        FROM users u
        INNER JOIN investments i ON i.investor_id = u.id
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_image_url
        ORDER BY total_invested DESC
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching top investors:", error);
      res.status(500).json({ message: "Failed to fetch top investors" });
    }
  });

  // Top funded projects
  app.get('/api/analytics/top-projects', unifiedAuth, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          p.id, p.title, p.category, p.status, p.requested_amount,
          COALESCE(SUM(i.amount), 0) AS total_funded,
          COUNT(i.id) AS investor_count
        FROM projects p
        LEFT JOIN investments i ON i.project_id = p.id
        GROUP BY p.id, p.title, p.category, p.status, p.requested_amount
        ORDER BY total_funded DESC
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching top projects:", error);
      res.status(500).json({ message: "Failed to fetch top projects" });
    }
  });

  // ==========================================
  // ADMIN
  // ==========================================

  // Helper to check admin role
  const requireAdmin = async (req: any, res: any): Promise<boolean> => {
    const userId = getUserId(req);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.roles || !user.roles.includes("admin")) {
      res.status(403).json({ message: "Admin access required" });
      return false;
    }
    return true;
  };

  // List all users (admin only)
  app.get('/api/admin/users', unifiedAuth, async (req: any, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          roles: users.roles,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user roles (admin only)
  app.patch('/api/admin/users/:id/roles', unifiedAuth, async (req: any, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const userId = req.params.id;
      const { roles } = req.body;
      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ message: "roles must be a non-empty array" });
      }
      const [updated] = await db
        .update(users)
        .set({ roles, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating user roles:", error);
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/admin/users/:id', unifiedAuth, async (req: any, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const userId = req.params.id;
      // Clean up related data
      await db.delete(notifications).where(eq(notifications.userId, userId));
      await db.delete(bookmarks).where(eq(bookmarks.userId, userId));
      await db.delete(comments).where(eq(comments.userId, userId));
      await db.delete(activityLog).where(eq(activityLog.userId, userId));
      await db.delete(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
      await db.delete(users).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Platform stats (admin only)
  app.get('/api/admin/stats', unifiedAuth, async (req: any, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
      const [investmentCount] = await db.select({ count: sql<number>`count(*)` }).from(investments);
      const [totalFunded] = await db
        .select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(investments);
      const [reviewCount] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
      const [messageCount] = await db.select({ count: sql<number>`count(*)` }).from(messages);

      res.json({
        totalUsers: Number(userCount?.count || 0),
        totalProjects: Number(projectCount?.count || 0),
        totalInvestments: Number(investmentCount?.count || 0),
        totalFunded: Number(totalFunded?.total || 0),
        totalReviews: Number(reviewCount?.count || 0),
        totalMessages: Number(messageCount?.count || 0),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // ==========================================
  // PUBLIC
  // ==========================================

  // Public projects (no auth required)
  app.get('/api/public/projects', async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;

      const result = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          category: projects.category,
          requestedAmount: projects.requestedAmount,
          status: projects.status,
          imageUrl: projects.imageUrl,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .where(eq(projects.isPublic, true))
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.isPublic, true));

      res.json({
        data: result,
        total: Number(totalResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(totalResult?.count || 0) / limit),
      });
    } catch (error) {
      console.error("Error fetching public projects:", error);
      res.status(500).json({ message: "Failed to fetch public projects" });
    }
  });

  // ==========================================
  // LEADERBOARD
  // ==========================================

  // Top investors leaderboard
  app.get('/api/leaderboard/investors', unifiedAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await db.execute(sql`
        SELECT
          u.id, u.first_name, u.last_name, u.profile_image_url,
          COALESCE(SUM(i.amount), 0) AS total_invested,
          COUNT(DISTINCT i.project_id) AS projects_funded
        FROM users u
        INNER JOIN investments i ON i.investor_id = u.id
        GROUP BY u.id, u.first_name, u.last_name, u.profile_image_url
        ORDER BY total_invested DESC
        LIMIT ${limit}
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching investor leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch investor leaderboard" });
    }
  });

  // Most funded projects leaderboard
  app.get('/api/leaderboard/projects', unifiedAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await db.execute(sql`
        SELECT
          p.id, p.title, p.category, p.status, p.requested_amount,
          COALESCE(SUM(i.amount), 0) AS total_funded,
          COUNT(i.id) AS investor_count
        FROM projects p
        LEFT JOIN investments i ON i.project_id = p.id
        GROUP BY p.id, p.title, p.category, p.status, p.requested_amount
        HAVING COALESCE(SUM(i.amount), 0) > 0
        ORDER BY total_funded DESC
        LIMIT ${limit}
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching project leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch project leaderboard" });
    }
  });

  // ==========================================
  // DARK MODE
  // ==========================================

  // Toggle dark mode preference
  app.patch('/api/user/dark-mode', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { darkMode } = req.body;
      if (typeof darkMode !== "boolean") {
        return res.status(400).json({ message: "darkMode must be a boolean" });
      }
      const [updated] = await db
        .update(users)
        .set({ darkMode, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      res.json({ darkMode: updated.darkMode });
    } catch (error) {
      console.error("Error toggling dark mode:", error);
      res.status(500).json({ message: "Failed to toggle dark mode" });
    }
  });

  // ==========================================
  // AI ADVANCED
  // ==========================================

  // Match investors to a project
  app.post('/api/ai/match-investors/:projectId', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get investors with their investment history
      const investorData = await db.execute(sql`
        SELECT u.id, u.first_name, u.last_name, u.organization,
          COALESCE(SUM(i.amount), 0) AS total_invested,
          COUNT(i.id) AS investment_count,
          ARRAY_AGG(DISTINCT p.category) AS funded_categories
        FROM users u
        INNER JOIN investments i ON i.investor_id = u.id
        INNER JOIN projects p ON p.id = i.project_id
        WHERE 'investor' = ANY(u.roles)
        GROUP BY u.id, u.first_name, u.last_name, u.organization
      `);

      const prompt = `You are an investor matching assistant for a nonprofit funding platform.

Project details:
- Title: ${project.title}
- Category: ${project.category}
- Description: ${project.description}
- Requested Amount: $${project.requestedAmount}

Active investors on the platform:
${JSON.stringify(investorData.rows, null, 2)}

Analyze which investors would be the best match for this project based on their past investment categories, amounts, and patterns. Return a JSON array of objects with fields: investorId, name, matchScore (0-100), reason. Rank by matchScore descending. Return only valid JSON.`;

      const result = await callOpenRouter([
        { role: "system", content: "You are a helpful nonprofit investment matching assistant. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ]);
      res.json({ matches: result });
    } catch (error: any) {
      console.error("AI match investors error:", error);
      res.status(500).json({ message: error.message || "AI matching failed" });
    }
  });

  // Generate risk score
  app.post('/api/ai/risk-score/:projectId', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const prompt = `Analyze the risk level of this nonprofit project application and provide a risk score from 1-100 (1=very low risk, 100=very high risk).

Project:
- Title: ${project.title}
- Category: ${project.category}
- Description: ${project.description}
- Requested Amount: $${project.requestedAmount}
- Timeline: ${project.timeline}

Provide your response as JSON with fields: score (number 1-100), level (low/medium/high), factors (array of risk factor strings), recommendations (array of strings).`;

      const result = await callOpenRouter([
        { role: "system", content: "You are a nonprofit project risk assessment expert. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ]);
      res.json({ riskAssessment: result });
    } catch (error: any) {
      console.error("AI risk score error:", error);
      res.status(500).json({ message: error.message || "AI risk assessment failed" });
    }
  });

  // Generate report
  app.post('/api/ai/report/:projectId', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectInvestments = await db.select().from(investments).where(eq(investments.projectId, projectId));
      const projectReviews = await db.select().from(reviews).where(eq(reviews.projectId, projectId));
      const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, projectId));

      const prompt = `Generate a comprehensive report for this nonprofit project.

Project:
- Title: ${project.title}
- Category: ${project.category}
- Description: ${project.description}
- Status: ${project.status}
- Requested Amount: $${project.requestedAmount}
- Timeline: ${project.timeline}

Investments: ${projectInvestments.length} totaling $${projectInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0)}
Reviews: ${projectReviews.length} (${projectReviews.filter(r => r.decision === 'approved').length} approved, ${projectReviews.filter(r => r.decision === 'rejected').length} rejected)
Milestones: ${projectMilestones.length} (${projectMilestones.filter(m => m.status === 'completed').length} completed)

Generate a detailed report including: executive summary, funding analysis, progress assessment, risk factors, and recommendations. Format as structured text with clear sections.`;

      const result = await callOpenRouter([
        { role: "system", content: "You are a nonprofit project reporting specialist. Generate clear, structured reports." },
        { role: "user", content: prompt },
      ], 2048);
      res.json({ report: result });
    } catch (error: any) {
      console.error("AI report error:", error);
      res.status(500).json({ message: error.message || "AI report generation failed" });
    }
  });

  // Detect duplicate projects
  app.post('/api/ai/detect-duplicates/:projectId', unifiedAuth, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const allProjects = await db
        .select({ id: projects.id, title: projects.title, description: projects.description, category: projects.category })
        .from(projects)
        .where(sql`${projects.id} != ${projectId}`);

      const prompt = `Analyze if this project might be a duplicate of any existing projects on the platform.

Target Project:
- ID: ${project.id}
- Title: ${project.title}
- Category: ${project.category}
- Description: ${project.description}

Existing Projects:
${JSON.stringify(allProjects, null, 2)}

Identify any projects that appear to be duplicates or very similar. Return a JSON array of objects with fields: projectId, title, similarityScore (0-100), reason. Only include projects with similarityScore > 50. Return empty array if no duplicates found.`;

      const result = await callOpenRouter([
        { role: "system", content: "You are a duplicate detection specialist. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ]);
      res.json({ duplicates: result });
    } catch (error: any) {
      console.error("AI detect duplicates error:", error);
      res.status(500).json({ message: error.message || "AI duplicate detection failed" });
    }
  });

  // AI chatbot endpoint
  app.post('/api/ai/chat', unifiedAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ message: "message is required" });
      }

      // Gather user context
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const userProjects = await db
        .select({ id: projects.id, title: projects.title, status: projects.status })
        .from(projects)
        .where(eq(projects.userId, userId));

      const systemPrompt = `You are a helpful assistant for NonProfitConnect, a platform that connects nonprofit projects with investors and reviewers.

Current user: ${user?.firstName || "User"} ${user?.lastName || ""} (roles: ${user?.roles?.join(", ") || "applicant"})
Their projects: ${JSON.stringify(userProjects)}

Help the user with questions about the platform, their projects, funding process, or general nonprofit guidance. Be concise and helpful.${context ? `\n\nAdditional context: ${context}` : ""}`;

      const result = await callOpenRouter([
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ]);
      res.json({ reply: result });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: error.message || "AI chat failed" });
    }
  });
}
