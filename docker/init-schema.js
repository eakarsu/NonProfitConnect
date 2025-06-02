// Database schema initialization and sample data insertion
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const bcrypt = require('bcryptjs');

// Schema definitions
const { 
  users, 
  projects, 
  reviews, 
  investments, 
  notifications,
  sessions
} = require('../shared/schema');

async function initializeDatabase() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/nonprofit_connect'
  });
  
  const db = drizzle({ client: pool });

  try {
    console.log('🔧 Initializing database schema...');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const sampleUsers = [
      {
        id: 'demo_applicant_001',
        email: 'applicant@demo.com',
        firstName: 'John',
        lastName: 'Applicant',
        profileImageUrl: null
      },
      {
        id: 'demo_reviewer_001', 
        email: 'reviewer@demo.com',
        firstName: 'Sarah',
        lastName: 'Reviewer',
        profileImageUrl: null
      },
      {
        id: 'demo_investor_001',
        email: 'investor@demo.com', 
        firstName: 'Michael',
        lastName: 'Investor',
        profileImageUrl: null
      }
    ];

    // Insert users
    for (const user of sampleUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Create sample projects
    const sampleProjects = [
      {
        userId: 'demo_applicant_001',
        title: 'Community Garden Initiative',
        description: 'Creating sustainable community gardens to provide fresh produce to local families and teach sustainable farming practices.',
        category: 'environment',
        requestedAmount: '25000.00',
        timeline: '18 months',
        priority: 'high',
        status: 'approved'
      },
      {
        userId: 'demo_applicant_001',
        title: 'Youth Education Program',
        description: 'After-school tutoring and mentorship program for underprivileged youth in the community.',
        category: 'education', 
        requestedAmount: '15000.00',
        timeline: '12 months',
        priority: 'medium',
        status: 'pending'
      },
      {
        userId: 'demo_applicant_001',
        title: 'Mobile Health Clinic',
        description: 'Bringing healthcare services to rural communities through a mobile medical unit.',
        category: 'healthcare',
        requestedAmount: '75000.00', 
        timeline: '24 months',
        priority: 'high',
        status: 'approved'
      }
    ];

    // Insert projects
    const insertedProjects = [];
    for (const project of sampleProjects) {
      const [inserted] = await db.insert(projects).values(project).returning();
      insertedProjects.push(inserted);
    }

    // Create sample reviews for approved projects
    const approvedProjects = insertedProjects.filter(p => p.status === 'approved');
    for (const project of approvedProjects) {
      await db.insert(reviews).values({
        projectId: project.id,
        reviewerId: 'demo_reviewer_001',
        decision: 'approved',
        comments: 'Excellent project proposal with clear objectives and realistic timeline.'
      });
    }

    // Create sample investments
    const sampleInvestments = [
      {
        projectId: approvedProjects[0]?.id,
        investorId: 'demo_investor_001',
        amount: '5000.00'
      },
      {
        projectId: approvedProjects[1]?.id, 
        investorId: 'demo_investor_001',
        amount: '10000.00'
      }
    ];

    for (const investment of sampleInvestments) {
      if (investment.projectId) {
        await db.insert(investments).values(investment);
      }
    }

    // Create sample notifications
    await db.insert(notifications).values({
      userId: 'demo_applicant_001',
      title: 'Project Approved',
      message: 'Your Community Garden Initiative has been approved for funding!',
      read: false
    });

    await db.insert(notifications).values({
      userId: 'demo_investor_001', 
      title: 'Investment Confirmed',
      message: 'Your investment in Community Garden Initiative has been processed.',
      read: false
    });

    console.log('✅ Database initialized successfully with sample data');
    console.log('👤 Demo users created:');
    console.log('   - Applicant: applicant@demo.com');
    console.log('   - Reviewer: reviewer@demo.com'); 
    console.log('   - Investor: investor@demo.com');
    console.log('🏗️ Sample projects and investments created');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };