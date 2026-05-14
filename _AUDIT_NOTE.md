# Audit Note - NonProfitConnect

Source: `_AUDIT/reports/batch_11.md` (lines 97-132).

## Original Audit Recommendations

### Missing AI Counterparts (audit reported "0 AI endpoints" — actually several already exist in routes.ts/newRoutes.ts)
- Donation-matching or impact-prediction AI.
- Proposal-writing assistant.
- Donor segmentation or personalized outreach.

### Missing Non-AI Features
- Payment processing (Stripe).
- Recurring donation/subscription support.
- Volunteer management or time-tracking.
- Document/grant management.
- Reporting/tax receipt generation.

### Custom Feature Suggestions
1. Impact Storytelling Agent.
2. Grant Opportunity Matcher.
3. Donor Lifetime Value Prediction.
4. Fraud Detection.
5. Multi-currency Support & 1099 Filing.
6. Community Leaderboard Gamification.

## Implementations Applied

Added 3 AI helper functions in `server/openrouter.ts` and 3 endpoints in `server/routes.ts` matching the existing OpenRouter+JSON pattern:
- `POST /api/ai/proposal-draft`
- `POST /api/ai/segment-donors`
- `POST /api/ai/match-donation`

All reuse the existing `callOpenRouter` helper and `unifiedAuth` middleware. No new dependencies. (Note: contrary to the audit's "0 AI endpoints" claim, several `/api/ai/*` routes already exist; the new endpoints add the gaps the audit identified.)

## Backlog (Prioritized)

### High
- Stripe payment processing + recurring donations.
- Document/grant management system.
- Tax receipt generation.

### Medium
- Volunteer management.
- Donor LTV prediction model.
- Fraud detection on applications/donations.

### Low / Product Decisions
- Impact storytelling agent (multi-modal).
- Multi-currency / 1099 filing.
- Community leaderboard gamification.

## Apply pass 3 (frontend)

LEFT-AS-IS. `client/src/pages/ai-tools.tsx` (342 lines) already wires all three pass-2 endpoints (`/api/ai/proposal-draft`, `/api/ai/segment-donors`, `/api/ai/match-donation`) using the shared `apiRequest` helper (which carries the session cookie / Bearer per the project's `multiAuth` scheme). Route `/ai-tools` registered in `client/src/App.tsx` inside the authenticated section. Idempotent — no changes.
