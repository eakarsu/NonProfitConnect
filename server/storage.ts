import {
  users,
  projects,
  reviews,
  investments,
  notifications,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Review,
  type InsertReview,
  type Investment,
  type InsertInvestment,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject, userId: string): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  getPendingReviews(): Promise<Project[]>;
  getApprovedProjects(): Promise<Project[]>;
  updateProjectStatus(id: number, status: string): Promise<void>;
  
  // Review operations
  createReview(review: InsertReview, reviewerId: string): Promise<Review>;
  getReviewsByProject(projectId: number): Promise<Review[]>;
  
  // Investment operations
  createInvestment(investment: InsertInvestment, investorId: string): Promise<Investment>;
  getInvestmentsByProject(projectId: number): Promise<Investment[]>;
  getInvestmentsByInvestor(investorId: string): Promise<Investment[]>;
  getProjectFundingStatus(projectId: number): Promise<{ total: number; goal: number }>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Stats operations
  getUserStats(userId: string): Promise<any>;
  getReviewerStats(reviewerId: string): Promise<any>;
  getInvestorStats(investorId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.submittedAt));
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.status, status as any))
      .orderBy(desc(projects.submittedAt));
  }

  async getPendingReviews(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.status, "pending"))
      .orderBy(desc(projects.submittedAt));
  }

  async getApprovedProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.status, "approved"))
      .orderBy(desc(projects.submittedAt));
  }

  async updateProjectStatus(id: number, status: string): Promise<void> {
    await db
      .update(projects)
      .set({ status: status as any, reviewedAt: new Date() })
      .where(eq(projects.id, id));
  }

  // Review operations
  async createReview(review: InsertReview, reviewerId: string): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({ ...review, reviewerId })
      .returning();
    
    // Update project status
    await this.updateProjectStatus(review.projectId, review.decision);
    
    return newReview;
  }

  async getReviewsByProject(projectId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.projectId, projectId));
  }

  // Investment operations
  async createInvestment(investment: InsertInvestment, investorId: string): Promise<Investment> {
    const [newInvestment] = await db
      .insert(investments)
      .values({ ...investment, investorId })
      .returning();
    
    // Check if project is fully funded
    const fundingStatus = await this.getProjectFundingStatus(investment.projectId);
    if (fundingStatus.total >= fundingStatus.goal) {
      await this.updateProjectStatus(investment.projectId, "funded");
    }
    
    return newInvestment;
  }

  async getInvestmentsByProject(projectId: number): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.projectId, projectId));
  }

  async getInvestmentsByInvestor(investorId: string): Promise<Investment[]> {
    return await db
      .select({
        id: investments.id,
        projectId: investments.projectId,
        investorId: investments.investorId,
        amount: investments.amount,
        investedAt: investments.investedAt,
        projectTitle: projects.title,
        projectStatus: projects.status,
      })
      .from(investments)
      .innerJoin(projects, eq(investments.projectId, projects.id))
      .where(eq(investments.investorId, investorId))
      .orderBy(desc(investments.investedAt));
  }

  async getProjectFundingStatus(projectId: number): Promise<{ total: number; goal: number }> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${investments.amount}), 0)` })
      .from(investments)
      .where(eq(investments.projectId, projectId));
    
    return {
      total: Number(result.total || 0),
      goal: Number(project?.requestedAmount || 0),
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  // Stats operations
  async getUserStats(userId: string): Promise<any> {
    const totalApplications = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));

    const pendingApplications = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "pending")));

    const approvedApplications = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "approved")));

    const fundedApplications = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "funded")));

    return {
      totalApplications: Number(totalApplications[0]?.count || 0),
      pendingApplications: Number(pendingApplications[0]?.count || 0),
      approvedApplications: Number(approvedApplications[0]?.count || 0),
      fundedApplications: Number(fundedApplications[0]?.count || 0),
    };
  }

  async getReviewerStats(reviewerId: string): Promise<any> {
    const pendingReviews = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "pending"));

    const approvedThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, reviewerId),
        eq(reviews.decision, "approved"),
        sql`${reviews.reviewedAt} >= date_trunc('month', current_date)`
      ));

    const rejectedThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, reviewerId),
        eq(reviews.decision, "rejected"),
        sql`${reviews.reviewedAt} >= date_trunc('month', current_date)`
      ));

    return {
      pendingReviews: Number(pendingReviews[0]?.count || 0),
      approvedThisMonth: Number(approvedThisMonth[0]?.count || 0),
      rejectedThisMonth: Number(rejectedThisMonth[0]?.count || 0),
      avgReviewTime: "2.3 days", // Placeholder for now
    };
  }

  async getInvestorStats(investorId: string): Promise<any> {
    const totalInvested = await db
      .select({ total: sql<number>`coalesce(sum(${investments.amount}), 0)` })
      .from(investments)
      .where(eq(investments.investorId, investorId));

    const activeProjects = await db
      .select({ count: sql<number>`count(distinct ${investments.projectId})` })
      .from(investments)
      .innerJoin(projects, eq(investments.projectId, projects.id))
      .where(and(
        eq(investments.investorId, investorId),
        eq(projects.status, "funded")
      ));

    const availableProjects = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "approved"));

    return {
      totalInvested: Number(totalInvested[0]?.total || 0),
      activeProjects: Number(activeProjects[0]?.count || 0),
      availableProjects: Number(availableProjects[0]?.count || 0),
      communitiesImpacted: 23, // Placeholder for now
    };
  }
}

export const storage = new DatabaseStorage();
