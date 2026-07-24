import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, projects, reviews, investments, notifications, messages, milestones, comments, bookmarks, projectUpdates, activityLog, documents } from "@shared/schema";

const PASSWORD = process.env.DEMO_PASSWORD;
if (!PASSWORD || PASSWORD.length < 12) {
  throw new Error("DEMO_PASSWORD must be at least 12 characters");
}

async function seed() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  // Clear existing data
  await db.delete(documents);
  await db.delete(activityLog);
  await db.delete(projectUpdates);
  await db.delete(bookmarks);
  await db.delete(comments);
  await db.delete(milestones);
  await db.delete(messages);
  await db.delete(notifications);
  await db.delete(investments);
  await db.delete(reviews);
  await db.delete(projects);
  await db.delete(users);

  console.log("Cleared existing data.");

  // --- Users ---
  const seedUsers = [
    { id: "local_alice", email: "alice@example.com", firstName: "Alice", lastName: "Johnson", roles: ["applicant"], provider: "local", bio: "Community organizer passionate about education.", organization: "EduFirst Foundation", phone: "555-0101" },
    { id: "local_bob", email: "bob@example.com", firstName: "Bob", lastName: "Smith", roles: ["applicant"], provider: "local", bio: "Environmental activist and grant writer.", organization: "Green Earth Alliance", phone: "555-0102" },
    { id: "local_carol", email: "carol@example.com", firstName: "Carol", lastName: "Davis", roles: ["applicant", "reviewer"], provider: "local", bio: "Healthcare professional and nonprofit leader.", organization: "HealthBridge Corp", phone: "555-0103" },
    { id: "local_david", email: "david@example.com", firstName: "David", lastName: "Wilson", roles: ["reviewer"], provider: "local", bio: "Former grant officer with 10 years experience.", organization: "Grant Reviewers Inc", phone: "555-0104" },
    { id: "local_emma", email: "emma@example.com", firstName: "Emma", lastName: "Brown", roles: ["reviewer"], provider: "local", bio: "Program evaluator specializing in social impact.", organization: "Impact Metrics LLC", phone: "555-0105" },
    { id: "local_frank", email: "frank@example.com", firstName: "Frank", lastName: "Garcia", roles: ["investor"], provider: "local", bio: "Angel investor focused on social enterprises.", organization: "Garcia Ventures", phone: "555-0106" },
    { id: "local_grace", email: "grace@example.com", firstName: "Grace", lastName: "Martinez", roles: ["investor"], provider: "local", bio: "Philanthropist supporting community projects.", organization: "Martinez Family Fund", phone: "555-0107" },
    { id: "local_henry", email: "henry@example.com", firstName: "Henry", lastName: "Anderson", roles: ["investor"], provider: "local", bio: "Tech entrepreneur giving back to communities.", organization: "Anderson Tech", phone: "555-0108" },
    { id: "local_iris", email: "iris@example.com", firstName: "Iris", lastName: "Thomas", roles: ["applicant", "investor"], provider: "local", bio: "Social worker and community investor.", organization: "Community First", phone: "555-0109" },
    { id: "local_jack", email: "jack@example.com", firstName: "Jack", lastName: "Taylor", roles: ["applicant"], provider: "local", bio: "Youth program director.", organization: "Youth Forward", phone: "555-0110" },
    { id: "local_kate", email: "kate@example.com", firstName: "Kate", lastName: "Moore", roles: ["applicant"], provider: "local", bio: "Arts educator and cultural advocate.", organization: "Arts for All", phone: "555-0111" },
    { id: "local_leo", email: "leo@example.com", firstName: "Leo", lastName: "Jackson", roles: ["reviewer", "investor"], provider: "local", bio: "Former nonprofit CEO turned consultant.", organization: "Jackson Advisory", phone: "555-0112" },
    { id: "local_mia", email: "mia@example.com", firstName: "Mia", lastName: "White", roles: ["applicant"], provider: "local", bio: "Environmental scientist.", organization: "CleanWater Initiative", phone: "555-0113" },
    { id: "local_noah", email: "noah@example.com", firstName: "Noah", lastName: "Harris", roles: ["applicant", "reviewer", "investor", "admin"], provider: "local", bio: "Versatile nonprofit professional.", organization: "MultiRole Foundation", phone: "555-0114" },
    { id: "local_olivia", email: "olivia@example.com", firstName: "Olivia", lastName: "Clark", roles: ["applicant"], provider: "local", bio: "Technology educator for underserved communities.", organization: "TechBridge", phone: "555-0115" },
    { id: "local_peter", email: "peter@example.com", firstName: "Peter", lastName: "Lewis", roles: ["investor"], provider: "local", bio: "Real estate investor supporting housing projects.", organization: "Lewis Properties", phone: "555-0116" },
  ];

  for (const u of seedUsers) {
    await db.insert(users).values({
      ...u,
      password: hashedPassword,
      emailVerified: true,
    });
  }
  console.log(`Seeded ${seedUsers.length} users.`);

  // --- Projects ---
  const seedProjects = [
    { userId: "local_alice", title: "Rural School Library Program", description: "Building mobile libraries for 15 rural schools lacking access to books. Each library will serve 200+ students and include digital reading tablets.", category: "education", requestedAmount: "25000.00", timeline: "12 months", status: "approved", priority: "high" },
    { userId: "local_alice", title: "STEM Workshops for Girls", description: "Weekly STEM workshops for girls aged 10-16 in underserved neighborhoods, covering coding, robotics, and environmental science.", category: "education", requestedAmount: "15000.00", timeline: "6 months", status: "pending", priority: "medium" },
    { userId: "local_bob", title: "Community Garden Network", description: "Establishing 10 community gardens across food desert neighborhoods, providing fresh produce and gardening education.", category: "environment", requestedAmount: "35000.00", timeline: "18 months", status: "approved", priority: "high" },
    { userId: "local_bob", title: "River Cleanup Initiative", description: "Organizing monthly river cleanup events with water quality monitoring and community education about watershed protection.", category: "environment", requestedAmount: "12000.00", timeline: "12 months", status: "funded", priority: "medium" },
    { userId: "local_carol", title: "Mobile Health Clinic", description: "Operating a mobile health clinic providing free basic healthcare, vaccinations, and health screenings in rural communities.", category: "healthcare", requestedAmount: "75000.00", timeline: "24 months", status: "approved", priority: "high" },
    { userId: "local_carol", title: "Mental Health First Aid Training", description: "Training 500 community members in Mental Health First Aid to better support neighbors experiencing mental health challenges.", category: "healthcare", requestedAmount: "18000.00", timeline: "8 months", status: "pending", priority: "medium" },
    { userId: "local_jack", title: "After-School Coding Academy", description: "Free after-school coding classes for middle and high school students, with mentorship from local tech professionals.", category: "technology", requestedAmount: "22000.00", timeline: "10 months", status: "approved", priority: "medium" },
    { userId: "local_jack", title: "Youth Leadership Camp", description: "Summer leadership development camp for at-risk youth featuring workshops on communication, teamwork, and civic engagement.", category: "community", requestedAmount: "30000.00", timeline: "3 months", status: "rejected", priority: "low" },
    { userId: "local_kate", title: "Public Art Installation", description: "Creating 5 interactive public art installations in downtown area to celebrate local cultural heritage and attract tourism.", category: "arts", requestedAmount: "45000.00", timeline: "14 months", status: "pending", priority: "low" },
    { userId: "local_kate", title: "Community Theater Revival", description: "Renovating abandoned community theater and producing 4 original plays featuring local stories and performers.", category: "arts", requestedAmount: "55000.00", timeline: "18 months", status: "approved", priority: "medium" },
    { userId: "local_mia", title: "Clean Water Access Project", description: "Installing water purification systems in 20 homes affected by contaminated well water in rural districts.", category: "environment", requestedAmount: "40000.00", timeline: "6 months", status: "funded", priority: "high" },
    { userId: "local_mia", title: "Wetland Restoration Initiative", description: "Restoring 50 acres of degraded wetland habitat to improve biodiversity and natural flood control.", category: "environment", requestedAmount: "60000.00", timeline: "24 months", status: "pending", priority: "medium" },
    { userId: "local_olivia", title: "Digital Literacy for Seniors", description: "Teaching basic computer and internet skills to 200 senior citizens, including online safety and telehealth access.", category: "technology", requestedAmount: "10000.00", timeline: "6 months", status: "completed", priority: "low" },
    { userId: "local_olivia", title: "Coding Bootcamp Scholarships", description: "Providing full scholarships for 25 low-income adults to attend an intensive 12-week coding bootcamp.", category: "technology", requestedAmount: "50000.00", timeline: "4 months", status: "approved", priority: "high" },
    { userId: "local_iris", title: "Neighborhood Watch Enhancement", description: "Upgrading neighborhood watch programs with modern communication tools, training, and community engagement events.", category: "community", requestedAmount: "8000.00", timeline: "6 months", status: "pending", priority: "low" },
    { userId: "local_noah", title: "Food Bank Expansion", description: "Expanding food bank operations to serve 500 additional families per month with nutritious meals and groceries.", category: "community", requestedAmount: "28000.00", timeline: "9 months", status: "approved", priority: "high" },
    { userId: "local_iris", title: "Refugee Integration Program", description: "Comprehensive support program helping newly arrived refugees with language classes, job training, and cultural orientation.", category: "community", requestedAmount: "42000.00", timeline: "12 months", status: "pending", priority: "high" },
  ];

  const insertedProjects = [];
  for (const p of seedProjects) {
    const [inserted] = await db.insert(projects).values({
      ...p,
      submittedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      reviewedAt: ["approved", "rejected", "funded", "completed"].includes(p.status)
        ? new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
        : null,
      completedAt: p.status === "completed"
        ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        : null,
    } as any).returning();
    insertedProjects.push(inserted);
  }
  console.log(`Seeded ${insertedProjects.length} projects.`);

  // --- Reviews ---
  const approvedProjectIds = insertedProjects.filter(p => ["approved", "funded", "completed"].includes(p.status)).map(p => p.id);
  const rejectedProjectIds = insertedProjects.filter(p => p.status === "rejected").map(p => p.id);
  const reviewerIds = ["local_david", "local_emma", "local_carol", "local_leo", "local_noah"];

  const approvalComments = [
    "Excellent proposal with clear impact metrics and realistic timeline.",
    "Strong community support and well-defined objectives. Approved.",
    "This project addresses a critical need. Budget is reasonable and well-justified.",
    "Impressive track record of the applicant. Project is well-structured.",
    "Aligns well with our funding priorities. Recommended for approval.",
    "Well-researched proposal with strong evidence of community demand.",
    "Clear deliverables and measurable outcomes. Fully endorsed.",
    "Outstanding collaboration plan with local organizations. Strongly recommended.",
  ];

  const rejectionComments = [
    "Budget needs more detailed justification. Please resubmit with revised financial plan.",
    "Timeline is unrealistic for the scope proposed. Consider phasing the project.",
    "Insufficient evidence of community engagement. More stakeholder input needed.",
    "Overlap with existing funded initiatives. Please differentiate your approach.",
  ];

  const seedReviews = [];
  // Primary reviews
  for (let i = 0; i < approvedProjectIds.length; i++) {
    seedReviews.push({
      projectId: approvedProjectIds[i],
      reviewerId: reviewerIds[i % reviewerIds.length],
      decision: "approved" as const,
      comments: approvalComments[i % approvalComments.length],
      reviewedAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }
  // Secondary reviews for some approved projects (ensures 15+ total reviews)
  for (let i = 0; i < Math.min(approvedProjectIds.length, 5); i++) {
    seedReviews.push({
      projectId: approvedProjectIds[i],
      reviewerId: reviewerIds[(i + 2) % reviewerIds.length],
      decision: "approved" as const,
      comments: approvalComments[(i + 3) % approvalComments.length],
      reviewedAt: new Date(Date.now() - Math.floor(Math.random() * 50) * 24 * 60 * 60 * 1000),
    });
  }
  for (let i = 0; i < rejectedProjectIds.length; i++) {
    seedReviews.push({
      projectId: rejectedProjectIds[i],
      reviewerId: reviewerIds[(i + 2) % reviewerIds.length],
      decision: "rejected" as const,
      comments: rejectionComments[i % rejectionComments.length],
      reviewedAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }

  for (const r of seedReviews) {
    await db.insert(reviews).values(r);
  }
  console.log(`Seeded ${seedReviews.length} reviews.`);

  // --- Investments (ensure 15+) ---
  const investableProjects = insertedProjects.filter(p => ["approved", "funded"].includes(p.status));
  const investorIds = ["local_frank", "local_grace", "local_henry", "local_iris", "local_leo", "local_peter", "local_noah"];

  const seedInvestments: Array<{
    projectId: number;
    investorId: string;
    amount: string;
    investedAt: Date;
  }> = [];
  for (const project of investableProjects) {
    // Ensure at least 2 investors per investable project to get 15+
    const numInvestors = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numInvestors; i++) {
      const investorId: string = investorIds[(seedInvestments.length + i) % investorIds.length]!;
      const goal = Number(project.requestedAmount);
      const amount = Math.round((goal * (Math.random() * 0.3 + 0.1)) * 100) / 100;
      seedInvestments.push({
        projectId: project.id,
        investorId,
        amount: String(amount),
        investedAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000),
      });
    }
  }

  for (const inv of seedInvestments) {
    await db.insert(investments).values(inv);
  }
  console.log(`Seeded ${seedInvestments.length} investments.`);

  // --- Notifications ---
  const seedNotifications = [
    { userId: "local_alice", title: "Welcome to NonProfit Connect!", message: "Thank you for joining our platform. Start by submitting your first project application." },
    { userId: "local_alice", title: "Application Approved", message: 'Your application "Rural School Library Program" has been approved.' },
    { userId: "local_bob", title: "Welcome to NonProfit Connect!", message: "Thank you for joining. Browse available projects or submit your own application." },
    { userId: "local_bob", title: "Application Approved", message: 'Your application "Community Garden Network" has been approved.' },
    { userId: "local_bob", title: "Project Fully Funded", message: 'Your project "River Cleanup Initiative" has been fully funded!' },
    { userId: "local_carol", title: "Welcome to NonProfit Connect!", message: "You have reviewer and applicant access. Check your dashboard for pending reviews." },
    { userId: "local_david", title: "New Applications to Review", message: "There are 5 new applications waiting for your review." },
    { userId: "local_emma", title: "New Applications to Review", message: "3 high-priority applications need your attention." },
    { userId: "local_frank", title: "Investment Confirmation", message: "Your investment has been confirmed and credited to the project." },
    { userId: "local_grace", title: "New Investment Opportunities", message: "4 new approved projects are seeking funding. Check them out!" },
    { userId: "local_henry", title: "Welcome to NonProfit Connect!", message: "Thank you for joining as an investor. Explore approved projects to make an impact." },
    { userId: "local_iris", title: "Application Submitted", message: 'Your application "Neighborhood Watch Enhancement" has been submitted for review.' },
    { userId: "local_jack", title: "Application Rejected", message: 'Your application "Youth Leadership Camp" has been rejected. See reviewer comments for details.' },
    { userId: "local_kate", title: "Application Approved", message: 'Your application "Community Theater Revival" has been approved.' },
    { userId: "local_mia", title: "Project Fully Funded", message: 'Your project "Clean Water Access Project" has been fully funded! Congratulations.' },
    { userId: "local_noah", title: "Welcome to NonProfit Connect!", message: "You have full access as applicant, reviewer, and investor." },
    { userId: "local_olivia", title: "Project Completed", message: 'Your project "Digital Literacy for Seniors" has been marked as completed.' },
    { userId: "local_peter", title: "New Investment Opportunities", message: "6 approved projects are seeking investment. Browse the opportunities." },
  ];

  for (const n of seedNotifications) {
    await db.insert(notifications).values({
      ...n,
      read: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`Seeded ${seedNotifications.length} notifications.`);

  // --- Messages ---
  const seedMessages = [
    { senderId: "local_alice", receiverId: "local_frank", subject: "Thank you for your investment!", content: "Hi Frank, I wanted to personally thank you for investing in the Rural School Library Program. Your support means the world to our community." },
    { senderId: "local_frank", receiverId: "local_alice", subject: "Re: Thank you for your investment!", content: "Alice, it's my pleasure! The proposal was compelling and I believe in the impact this project will have. Keep me posted on progress." },
    { senderId: "local_bob", receiverId: "local_grace", subject: "Community Garden Update", content: "Grace, I wanted to share that we've secured all 10 garden plots. Construction begins next month!" },
    { senderId: "local_grace", receiverId: "local_bob", subject: "Re: Community Garden Update", content: "That's wonderful news, Bob! I'd love to visit one of the sites once they're up and running." },
    { senderId: "local_david", receiverId: "local_carol", subject: "Review Feedback", content: "Carol, I reviewed your Mobile Health Clinic proposal. Outstanding work on the needs assessment section." },
    { senderId: "local_carol", receiverId: "local_david", subject: "Re: Review Feedback", content: "Thanks David! We spent months surveying rural communities to build that data. Glad it came through in the proposal." },
    { senderId: "local_emma", receiverId: "local_jack", subject: "Coding Academy Collaboration", content: "Jack, would your After-School Coding Academy be interested in partnering with our evaluation team for impact measurement?" },
    { senderId: "local_jack", receiverId: "local_emma", subject: "Re: Coding Academy Collaboration", content: "Absolutely, Emma! We've been looking for ways to better measure student outcomes. Let's set up a meeting." },
    { senderId: "local_henry", receiverId: "local_olivia", subject: "Digital Literacy Success", content: "Olivia, congratulations on completing the Digital Literacy for Seniors project! I saw the final report and the outcomes exceeded expectations." },
    { senderId: "local_olivia", receiverId: "local_henry", subject: "Re: Digital Literacy Success", content: "Thank you Henry! 92% of participants now use telehealth services independently. We're thrilled with the results." },
    { senderId: "local_mia", receiverId: "local_leo", subject: "Clean Water Project Progress", content: "Leo, we've installed purification systems in 12 of 20 homes so far. Water quality tests are coming back excellent." },
    { senderId: "local_leo", receiverId: "local_mia", subject: "Re: Clean Water Project Progress", content: "Great progress, Mia! The water quality data will be important for the mid-term evaluation. Can you share the test results?" },
    { senderId: "local_noah", receiverId: "local_peter", subject: "Food Bank Expansion Plans", content: "Peter, we're looking at a new warehouse space for the food bank expansion. Would you be interested in advising on the real estate side?" },
    { senderId: "local_peter", receiverId: "local_noah", subject: "Re: Food Bank Expansion Plans", content: "Happy to help, Noah. I know a few properties that could work. Let me pull together some options for you." },
    { senderId: "local_iris", receiverId: "local_noah", subject: "Refugee Program Question", content: "Noah, do you have any contacts at local language schools? We need instructors for the refugee integration program." },
    { senderId: "local_kate", receiverId: "local_grace", subject: "Theater Renovation Update", content: "Grace, the architect just delivered the final renovation plans for the community theater. It's going to be beautiful!" },
  ];

  for (const m of seedMessages) {
    await db.insert(messages).values({
      ...m,
      read: Math.random() > 0.4,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`Seeded ${seedMessages.length} messages.`);

  // --- Milestones ---
  // Only for approved/funded/completed projects
  const milestoneProjects = insertedProjects.filter(p => ["approved", "funded", "completed"].includes(p.status));
  const milestoneTemplates = [
    { title: "Community Needs Assessment", description: "Conduct surveys and interviews to validate community needs and refine project scope." },
    { title: "Site Selection", description: "Identify and secure locations for project implementation." },
    { title: "Volunteer Recruitment", description: "Recruit and onboard volunteers to support project activities." },
    { title: "Pilot Program Launch", description: "Launch a small-scale pilot to test the approach before full rollout." },
    { title: "Mid-term Evaluation", description: "Assess progress against goals and make adjustments as needed." },
    { title: "Partnership Agreements", description: "Formalize partnerships with local organizations and stakeholders." },
    { title: "Resource Procurement", description: "Purchase equipment, materials, and supplies needed for the project." },
    { title: "Staff Training", description: "Train staff and volunteers on project procedures and best practices." },
    { title: "Community Outreach Campaign", description: "Launch marketing and outreach efforts to engage the target community." },
    { title: "Full Program Rollout", description: "Expand from pilot to full-scale implementation across all target areas." },
    { title: "Data Collection Phase", description: "Gather baseline and ongoing data to measure project impact." },
    { title: "Stakeholder Report", description: "Prepare and distribute progress reports to all stakeholders and funders." },
    { title: "Final Impact Assessment", description: "Comprehensive evaluation of project outcomes and community impact." },
    { title: "Budget Reconciliation", description: "Finalize all financial records and prepare final budget report." },
    { title: "Sustainability Planning", description: "Develop a plan for long-term sustainability beyond the funding period." },
  ];

  const statuses: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];
  let milestoneCount = 0;
  for (const project of milestoneProjects) {
    const numMilestones = Math.min(3 + Math.floor(Math.random() * 3), milestoneTemplates.length);
    for (let i = 0; i < numMilestones; i++) {
      const template = milestoneTemplates[(milestoneCount + i) % milestoneTemplates.length];
      let status: "pending" | "in_progress" | "completed";
      if (project.status === "completed") {
        status = "completed";
      } else {
        status = statuses[Math.min(i, 2)];
      }
      await db.insert(milestones).values({
        projectId: project.id,
        title: template.title,
        description: template.description,
        targetDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        completedAt: status === "completed" ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
        status,
        sortOrder: i,
      });
      milestoneCount++;
    }
  }
  console.log(`Seeded ${milestoneCount} milestones.`);

  // --- Comments ---
  const commentUsers = ["local_alice", "local_bob", "local_carol", "local_david", "local_emma", "local_frank", "local_grace", "local_noah", "local_iris", "local_jack"];
  const commentTexts = [
    "This is a fantastic initiative! I've seen similar programs work well in neighboring communities.",
    "Have you considered partnering with the local university for volunteer support?",
    "The budget breakdown looks solid. One suggestion: allocate a small contingency fund.",
    "I visited a similar project last year and the impact was incredible. Excited to see this move forward.",
    "Would it be possible to expand the target area in phase two?",
    "The timeline seems ambitious but achievable. Make sure to build in buffer time.",
    "Great progress so far! The community feedback has been overwhelmingly positive.",
    "I have contacts at organizations doing related work. Happy to make introductions.",
    "The needs assessment data is very compelling. This clearly fills a gap in services.",
    "How will you measure long-term outcomes after the project period ends?",
    "Impressive collaboration plan. The multi-stakeholder approach will strengthen the project.",
    "I recommend adding a communication plan to keep the community informed throughout.",
    "The sustainability plan is well thought out. This should continue to deliver impact.",
    "Could you share more details about the volunteer training curriculum?",
    "This aligns perfectly with our community's strategic priorities.",
    "Excellent use of evidence-based approaches. The methodology is sound.",
  ];

  const insertedComments = [];
  for (let i = 0; i < 16; i++) {
    const project = insertedProjects[i % insertedProjects.length];
    const userId = commentUsers[i % commentUsers.length];
    const [inserted] = await db.insert(comments).values({
      projectId: project.id,
      userId,
      parentId: null,
      content: commentTexts[i],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000),
    }).returning();
    insertedComments.push(inserted);
  }

  // Add some replies to existing comments
  const replyTexts = [
    "Great point! We'll definitely look into that.",
    "Thanks for the suggestion. We've added it to our planning document.",
    "Agreed. We're already in talks with potential partners about this.",
    "We appreciate the feedback. The team is working on addressing this.",
  ];
  for (let i = 0; i < 4; i++) {
    const parentComment = insertedComments[i];
    const replyUser = commentUsers[(i + 3) % commentUsers.length];
    await db.insert(comments).values({
      projectId: parentComment.projectId,
      userId: replyUser,
      parentId: parentComment.id,
      content: replyTexts[i],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`Seeded ${insertedComments.length + 4} comments.`);

  // --- Bookmarks ---
  const bookmarkUsers = [
    "local_frank", "local_grace", "local_henry", "local_peter", "local_leo",
    "local_iris", "local_noah", "local_emma", "local_david", "local_carol",
    "local_alice", "local_bob", "local_jack", "local_kate", "local_mia", "local_olivia",
  ];
  const bookmarkedProjects = insertedProjects.slice(0, 12);
  let bookmarkCount = 0;
  for (let i = 0; i < 16; i++) {
    const userId = bookmarkUsers[i % bookmarkUsers.length];
    const project = bookmarkedProjects[i % bookmarkedProjects.length];
    await db.insert(bookmarks).values({
      userId,
      projectId: project.id,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
    bookmarkCount++;
  }
  console.log(`Seeded ${bookmarkCount} bookmarks.`);

  // --- Project Updates ---
  const updateProjects = insertedProjects.filter(p => ["approved", "funded", "completed"].includes(p.status));
  const updateTemplates = [
    { title: "Project Kickoff Complete", content: "We officially kicked off the project this week. The team is in place and initial planning is underway. We've established timelines and assigned responsibilities." },
    { title: "First Month Progress Report", content: "Great progress in the first month! We've completed the initial assessments and begun community outreach. Response has been overwhelmingly positive." },
    { title: "Partnership Secured", content: "We're excited to announce a new partnership that will expand our reach. This collaboration brings additional expertise and resources to the project." },
    { title: "Milestone Achieved: Pilot Launch", content: "The pilot program launched successfully this week. Early feedback from participants has been very encouraging and we're on track with our timeline." },
    { title: "Volunteer Team Growing", content: "Our volunteer team has grown to over 30 members! Their dedication and enthusiasm are making a real difference in the community." },
    { title: "Mid-Project Evaluation Results", content: "The mid-term evaluation shows we're meeting or exceeding all key performance indicators. Participant satisfaction is at 94%." },
    { title: "Community Impact Report", content: "We've compiled data showing significant positive impact on the community. Key metrics include increased participation and improved outcomes across all target areas." },
    { title: "Funding Milestone Reached", content: "Thanks to generous investors, we've reached our funding milestone. This allows us to proceed with the next phase of the project." },
    { title: "Program Expansion Update", content: "Based on the success of our initial rollout, we're expanding to serve additional communities. This will double our impact." },
    { title: "Quarter Three Review", content: "The third quarter brought steady progress. We've resolved early challenges and the program is running smoothly." },
    { title: "New Equipment Deployed", content: "All new equipment has been procured and deployed. Training sessions for staff and volunteers are complete." },
    { title: "Stakeholder Feedback Summary", content: "We surveyed all stakeholders and the feedback is very positive. Key themes include appreciation for communication and visible community impact." },
    { title: "Sustainability Plan Finalized", content: "We've finalized our sustainability plan to ensure the project continues to deliver impact beyond the initial funding period." },
    { title: "Year-End Progress Summary", content: "As we close out the year, we're proud to report that all major objectives have been met. The community has embraced the program wholeheartedly." },
    { title: "Final Report Submitted", content: "The comprehensive final report has been submitted. It documents all outcomes, financial expenditures, and lessons learned for future projects." },
  ];

  let updateCount = 0;
  for (const project of updateProjects) {
    const numUpdates = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numUpdates; i++) {
      const template = updateTemplates[(updateCount + i) % updateTemplates.length];
      await db.insert(projectUpdates).values({
        projectId: project.id,
        userId: project.userId,
        title: template.title,
        content: template.content,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
      });
      updateCount++;
    }
  }
  console.log(`Seeded ${updateCount} project updates.`);

  // --- Activity Log ---
  const seedActivities = [
    { userId: "local_alice", action: "created_project", entityType: "project", entityId: insertedProjects[0].id, details: "Created project: Rural School Library Program" },
    { userId: "local_alice", action: "created_project", entityType: "project", entityId: insertedProjects[1].id, details: "Created project: STEM Workshops for Girls" },
    { userId: "local_bob", action: "created_project", entityType: "project", entityId: insertedProjects[2].id, details: "Created project: Community Garden Network" },
    { userId: "local_bob", action: "created_project", entityType: "project", entityId: insertedProjects[3].id, details: "Created project: River Cleanup Initiative" },
    { userId: "local_david", action: "submitted_review", entityType: "review", entityId: insertedProjects[0].id, details: "Approved: Rural School Library Program" },
    { userId: "local_emma", action: "submitted_review", entityType: "review", entityId: insertedProjects[2].id, details: "Approved: Community Garden Network" },
    { userId: "local_carol", action: "submitted_review", entityType: "review", entityId: insertedProjects[4].id, details: "Approved: Mobile Health Clinic" },
    { userId: "local_frank", action: "made_investment", entityType: "investment", entityId: insertedProjects[0].id, details: "Invested in Rural School Library Program" },
    { userId: "local_grace", action: "made_investment", entityType: "investment", entityId: insertedProjects[2].id, details: "Invested in Community Garden Network" },
    { userId: "local_henry", action: "made_investment", entityType: "investment", entityId: insertedProjects[3].id, details: "Invested in River Cleanup Initiative" },
    { userId: "local_peter", action: "made_investment", entityType: "investment", entityId: insertedProjects[4].id, details: "Invested in Mobile Health Clinic" },
    { userId: "local_alice", action: "updated_milestone", entityType: "milestone", entityId: insertedProjects[0].id, details: "Completed milestone: Community Needs Assessment" },
    { userId: "local_bob", action: "updated_milestone", entityType: "milestone", entityId: insertedProjects[2].id, details: "Started milestone: Site Selection" },
    { userId: "local_mia", action: "created_project", entityType: "project", entityId: insertedProjects[10].id, details: "Created project: Clean Water Access Project" },
    { userId: "local_noah", action: "created_project", entityType: "project", entityId: insertedProjects[15].id, details: "Created project: Food Bank Expansion" },
    { userId: "local_olivia", action: "updated_milestone", entityType: "milestone", entityId: insertedProjects[12].id, details: "Completed milestone: Final Impact Assessment" },
    { userId: "local_leo", action: "submitted_review", entityType: "review", entityId: insertedProjects[6].id, details: "Approved: After-School Coding Academy" },
  ];

  for (const a of seedActivities) {
    await db.insert(activityLog).values({
      ...a,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`Seeded ${seedActivities.length} activity log entries.`);

  // --- Documents ---
  const seedDocuments = [
    { projectId: insertedProjects[0].id, userId: "local_alice", name: "Budget Breakdown.pdf", url: "/docs/budget-breakdown-library.pdf", type: "pdf" },
    { projectId: insertedProjects[0].id, userId: "local_alice", name: "Community Survey Results", url: "/docs/survey-results-library.pdf", type: "pdf" },
    { projectId: insertedProjects[0].id, userId: "local_alice", name: "School Partnership Letters", url: "/docs/partnership-letters.pdf", type: "pdf" },
    { projectId: insertedProjects[2].id, userId: "local_bob", name: "Garden Plot Maps", url: "https://maps.example.com/garden-plots", type: "link" },
    { projectId: insertedProjects[2].id, userId: "local_bob", name: "Environmental Impact Assessment Report", url: "/docs/env-impact-garden.pdf", type: "report" },
    { projectId: insertedProjects[3].id, userId: "local_bob", name: "Water Quality Baseline Report", url: "/docs/water-quality-baseline.pdf", type: "report" },
    { projectId: insertedProjects[4].id, userId: "local_carol", name: "Mobile Clinic Route Plan", url: "/docs/clinic-route-plan.pdf", type: "pdf" },
    { projectId: insertedProjects[4].id, userId: "local_carol", name: "Healthcare Needs Assessment", url: "/docs/healthcare-needs.pdf", type: "report" },
    { projectId: insertedProjects[6].id, userId: "local_jack", name: "Coding Curriculum Overview", url: "https://curriculum.example.com/coding-academy", type: "link" },
    { projectId: insertedProjects[6].id, userId: "local_jack", name: "Mentor Application Form", url: "/docs/mentor-application.pdf", type: "pdf" },
    { projectId: insertedProjects[9].id, userId: "local_kate", name: "Theater Renovation Plans.pdf", url: "/docs/theater-renovation.pdf", type: "pdf" },
    { projectId: insertedProjects[9].id, userId: "local_kate", name: "Community Arts Grant Reference", url: "https://arts-grants.example.com/reference", type: "link" },
    { projectId: insertedProjects[10].id, userId: "local_mia", name: "Water Purification Specs", url: "/docs/purification-specs.pdf", type: "pdf" },
    { projectId: insertedProjects[10].id, userId: "local_mia", name: "Contamination Test Results", url: "/docs/contamination-tests.pdf", type: "report" },
    { projectId: insertedProjects[12].id, userId: "local_olivia", name: "Digital Literacy Final Report", url: "/docs/digital-literacy-final.pdf", type: "report" },
    { projectId: insertedProjects[12].id, userId: "local_olivia", name: "Participant Feedback Summary", url: "/docs/participant-feedback.pdf", type: "pdf" },
    { projectId: insertedProjects[15].id, userId: "local_noah", name: "Food Bank Expansion Budget.pdf", url: "/docs/food-bank-budget.pdf", type: "pdf" },
    { projectId: insertedProjects[15].id, userId: "local_noah", name: "Warehouse Location Options", url: "https://properties.example.com/warehouse-options", type: "link" },
  ];

  for (const doc of seedDocuments) {
    await db.insert(documents).values({
      ...doc,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }
  console.log(`Seeded ${seedDocuments.length} documents.`);

  console.log("\nSeeding complete!");
  console.log("Demo login users provisioned.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
