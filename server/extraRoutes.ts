// Extra Routes — Custom Feature Suggestions (batch 11)
// Implements: Impact Storytelling, Grant Matcher, Donor LTV, Fraud Detection,
// 1099 / Multi-currency, Leaderboard Gamification.

import type { Express, RequestHandler } from "express";
import { callOpenRouter } from "./openrouter";

export function registerExtraRoutes(
  app: Express,
  unifiedAuth: RequestHandler,
  getUserId: (req: any) => string,
) {
  // 1) Impact Storytelling Agent — turn project milestones into donor updates.
  app.post("/api/extras/impact-story", unifiedAuth, async (req: any, res) => {
    try {
      const { projectName, milestones = [], photos = [], tone = "warm" } = req.body || {};
      if (!projectName) return res.status(400).json({ message: "projectName required" });
      const messages = [
        { role: "system" as const, content: `You are a nonprofit storyteller. Tone: ${tone}. Produce: (1) a 200-word donor update, (2) a 3-line thank-you snippet, (3) a 15-second video script that references provided photos.` },
        { role: "user" as const, content: `Project: ${projectName}\nMilestones: ${JSON.stringify(milestones).slice(0, 3000)}\nPhotos: ${photos.length} attached.` },
      ];
      const content = await callOpenRouter(messages, 1500);
      res.json({ story: content, generatedAt: new Date().toISOString(), userId: getUserId(req) });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "impact-story failed" });
    }
  });

  // 2) Grant Opportunity Matcher — match nonprofits to funding sources.
  app.post("/api/extras/grant-match", unifiedAuth, async (req: any, res) => {
    try {
      const { mission, programArea, budgetNeeded, geography, grants = [] } = req.body || {};
      if (!mission) return res.status(400).json({ message: "mission required" });
      const messages = [
        { role: "system" as const, content: "You are a nonprofit grant strategist. From the candidate grants list, rank top 5 by fit. Output JSON: { ranked: [{ grantId, score, reasoning, suggestedAngle }], coverageGaps: [...] }." },
        { role: "user" as const, content: `Mission: ${mission}\nProgram: ${programArea}\nBudget: ${budgetNeeded}\nGeo: ${geography}\nGrants: ${JSON.stringify(grants).slice(0, 5000)}` },
      ];
      const content = await callOpenRouter(messages, 1500);
      res.json({ raw: content });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "grant-match failed" });
    }
  });

  // 3) Donor Lifetime Value Prediction
  app.post("/api/extras/donor-ltv", unifiedAuth, async (req: any, res) => {
    try {
      const { donorId, giftHistory = [], engagementSignals = {} } = req.body || {};
      if (!donorId || !giftHistory.length) return res.status(400).json({ message: "donorId and giftHistory required" });
      const totals = giftHistory.reduce((s: number, g: any) => s + Number(g.amount || 0), 0);
      const avg = totals / giftHistory.length;
      const messages = [
        { role: "system" as const, content: "You are a fundraising data scientist. Estimate donor LTV and churn risk. Output JSON: { ltvUSD, churnRisk: 0-1, reEngagementPlan: [...], rfmScore: { recency, frequency, monetary } }." },
        { role: "user" as const, content: `Donor: ${donorId}\nGifts (avg $${avg.toFixed(2)}): ${JSON.stringify(giftHistory).slice(0, 3000)}\nEngagement: ${JSON.stringify(engagementSignals).slice(0, 1500)}` },
      ];
      const content = await callOpenRouter(messages, 1200);
      res.json({ raw: content, observedTotal: totals, avgGift: avg });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "donor-ltv failed" });
    }
  });

  // 4) Fraud Detection — flag suspicious applications / donation patterns.
  app.post("/api/extras/fraud-scan", unifiedAuth, async (req: any, res) => {
    try {
      const { donations = [], applications = [] } = req.body || {};
      const messages = [
        { role: "system" as const, content: "You are a nonprofit fraud analyst. Flag anomalies: round-number bursts, mismatched geo, duplicate phone/IP, application impersonation. Output JSON: { flags: [{ recordId, type, severity, reason }], summary }." },
        { role: "user" as const, content: `Donations: ${JSON.stringify(donations).slice(0, 4000)}\nApplications: ${JSON.stringify(applications).slice(0, 4000)}` },
      ];
      const content = await callOpenRouter(messages, 1200);
      res.json({ raw: content });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "fraud-scan failed" });
    }
  });

  // 5) Multi-currency Support & 1099 Filing — emit a 1099-K stub for tax docs.
  // TODO: configure credentials — IRS_FILING_API_KEY, EXCHANGE_RATE_API_KEY.
  app.post("/api/extras/tax-1099", unifiedAuth, async (req: any, res) => {
    const { donorId, taxYear, donations = [], baseCurrency = "USD" } = req.body || {};
    if (!donorId || !taxYear) return res.status(400).json({ message: "donorId and taxYear required" });
    const fxKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!fxKey) {
      // emit lean fallback that assumes all amounts already in baseCurrency
    }
    const totalBase = donations.reduce((sum: number, d: any) => sum + Number(d.amountBase || d.amount || 0), 0);
    res.json({
      form: "1099-K",
      donorId,
      taxYear,
      baseCurrency,
      totalContributions: totalBase,
      lineItems: donations,
      filedExternally: false,
      note: fxKey ? null : "EXCHANGE_RATE_API_KEY not set — assuming amounts already in base currency.",
    });
  });

  // 6) Leaderboard Gamification — AI-driven badges and milestone celebrations.
  app.post("/api/extras/leaderboard-gamify", unifiedAuth, async (req: any, res) => {
    try {
      const { participants = [], season } = req.body || {};
      if (!participants.length) return res.status(400).json({ message: "participants required" });
      const messages = [
        { role: "system" as const, content: "You are a community engagement designer. Assign one badge per participant, propose 3 challenges to drive next-tier behavior, and write a celebratory blurb for top three. Output JSON." },
        { role: "user" as const, content: `Season: ${season || "current"}\nParticipants: ${JSON.stringify(participants).slice(0, 6000)}` },
      ];
      const content = await callOpenRouter(messages, 1500);
      res.json({ raw: content });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "leaderboard-gamify failed" });
    }
  });
}
