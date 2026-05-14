const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  maxTokens: number = 1024
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

  if (!apiKey || apiKey === "your-openrouter-api-key-here") {
    throw new Error("OPENROUTER_API_KEY not configured. Please set it in .env file.");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3001",
      "X-Title": "NonProfit Connect",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function generateProjectDescription(title: string, category: string): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are an expert grant writer for nonprofit organizations. Generate a compelling, professional project description. Return a JSON object with these fields: description (string, 2-3 paragraphs), keyObjectives (array of 3-4 strings), targetBeneficiaries (string), expectedOutcomes (array of 3-4 strings), suggestedTimeline (string), suggestedBudget (string with dollar amount). Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Generate a project description for a nonprofit project titled "${title}" in the "${category}" category.`
    }
  ]);
  return JSON.parse(content);
}

export async function analyzeProject(project: any): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are a nonprofit project analyst. Analyze the given project and provide insights. Return a JSON object with: overallScore (number 1-100), strengths (array of 3-4 strings), weaknesses (array of 2-3 strings), recommendations (array of 3-4 strings), riskLevel (string: "Low", "Medium", or "High"), fundingViability (string: one sentence), impactAssessment (string: one paragraph). Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Analyze this nonprofit project:\nTitle: ${project.title}\nCategory: ${project.category}\nDescription: ${project.description}\nRequested Amount: $${project.requestedAmount}\nTimeline: ${project.timeline}\nPriority: ${project.priority}\nStatus: ${project.status}`
    }
  ]);
  return JSON.parse(content);
}

export async function generateReviewSuggestion(project: any): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are an experienced nonprofit grant reviewer. Provide a thorough review suggestion. Return a JSON object with: recommendation (string: "approve" or "reject"), confidence (number 1-100), summary (string: 2-3 sentences), detailedFeedback (array of 3-5 strings with specific feedback points), suggestedConditions (array of 2-3 strings, conditions for approval), questionsForApplicant (array of 2-3 strings). Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Review this project application:\nTitle: ${project.title}\nCategory: ${project.category}\nDescription: ${project.description}\nRequested Amount: $${project.requestedAmount}\nTimeline: ${project.timeline}\nPriority: ${project.priority}`
    }
  ]);
  return JSON.parse(content);
}

export async function analyzeInvestmentOpportunity(project: any, fundingStatus: any): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are a social impact investment advisor. Analyze this investment opportunity. Return a JSON object with: investmentRating (string: "Strong Buy", "Buy", "Hold", or "Pass"), socialImpactScore (number 1-100), riskAssessment (string: "Low", "Medium", or "High"), keyHighlights (array of 3-4 strings), concerns (array of 2-3 strings), suggestedInvestmentRange (object with min and max as numbers), impactMetrics (array of 3 strings describing expected impact), verdict (string: one paragraph summary). Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Analyze this investment opportunity:\nProject: ${project.title}\nCategory: ${project.category}\nDescription: ${project.description}\nFunding Goal: $${project.requestedAmount}\nRaised So Far: $${fundingStatus.total}\nProgress: ${Math.round((fundingStatus.total / fundingStatus.goal) * 100)}%\nTimeline: ${project.timeline}`
    }
  ]);
  return JSON.parse(content);
}

export async function generateProposalDraft(input: { title: string; category: string; targetFunders?: string; budget?: string; timeline?: string; goals?: string }): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are an experienced grant proposal writer for nonprofits. Generate a complete grant proposal draft. Return JSON: { executiveSummary, statementOfNeed, projectDescription, goalsAndObjectives, methodology, evaluationPlan, sustainability, budgetNarrative, organizationCapacity, conclusion }. Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Draft a grant proposal.\nTitle: ${input.title}\nCategory: ${input.category}\nTarget Funders: ${input.targetFunders || 'general foundations'}\nBudget: ${input.budget || 'unspecified'}\nTimeline: ${input.timeline || 'unspecified'}\nGoals: ${input.goals || 'unspecified'}`
    }
  ]);
  return JSON.parse(content);
}

export async function segmentDonors(donors: any[]): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are a fundraising data analyst. Segment the supplied donor list and produce engagement strategies per segment. Return JSON: { segments: [{ name, criteria, count, avgGiftEstimate, recommendedOutreach }], notes }. Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Donor sample (${donors.length}):\n${JSON.stringify(donors.slice(0, 50))}`
    }
  ]);
  return JSON.parse(content);
}

export async function matchDonation(donor: any, projects: any[]): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are a donor matching engine. Given a donor profile and a list of projects, rank the top matches and explain reasoning. Return JSON: { matches: [{ projectId, score, reasons }], notes }. Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Donor:\n${JSON.stringify(donor)}\nProjects (${projects.length}):\n${JSON.stringify(projects.slice(0, 30))}`
    }
  ]);
  return JSON.parse(content);
}

export async function generateProjectSummary(project: any, reviews: any[], investments: any[]): Promise<any> {
  const content = await callOpenRouter([
    {
      role: "system",
      content: `You are a nonprofit project reporting specialist. Generate a comprehensive executive summary. Return a JSON object with: executiveSummary (string: 2-3 paragraphs), keyMetrics (array of objects with label and value), statusOverview (string), stakeholderImpact (string), nextSteps (array of 3-4 strings), riskFactors (array of 2-3 strings). Return ONLY valid JSON, no markdown.`
    },
    {
      role: "user",
      content: `Generate a summary for:\nProject: ${project.title}\nStatus: ${project.status}\nCategory: ${project.category}\nDescription: ${project.description}\nRequested: $${project.requestedAmount}\nTimeline: ${project.timeline}\nReviews: ${reviews.length} (${reviews.filter(r => r.decision === 'approved').length} approved)\nInvestments: ${investments.length} totaling $${investments.reduce((s: number, i: any) => s + Number(i.amount), 0)}`
    }
  ]);
  return JSON.parse(content);
}
