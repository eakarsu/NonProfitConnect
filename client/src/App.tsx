// === Batch 11 Gaps & Frontend Mounts ===
import GapDonationMatchingPage from './pages/gap/GapDonationMatchingPage'
import GapGrantProposalWriterPage from './pages/gap/GapGrantProposalWriterPage'
import GapDonorSegmentationPage from './pages/gap/GapDonorSegmentationPage'
import GapContentModerationPage from './pages/gap/GapContentModerationPage'
import GapPaymentProcessingPage from './pages/gap/GapPaymentProcessingPage'
import GapRecurringDonationsPage from './pages/gap/GapRecurringDonationsPage'
import GapVolunteerManagementPage from './pages/gap/GapVolunteerManagementPage'
import GapGrantDocVersioningPage from './pages/gap/GapGrantDocVersioningPage'
import GapTaxReceiptGenerationPage from './pages/gap/GapTaxReceiptGenerationPage'
import GapMobileAppStubPage from './pages/gap/GapMobileAppStubPage'
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Applications from "@/pages/applications";
import Investments from "@/pages/investments";
import ProjectDetails from "@/pages/project-details";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Messaging from "@/pages/messaging";
import Analytics from "@/pages/analytics";
import Bookmarks from "@/pages/bookmarks";
import Activity from "@/pages/activity";
import PublicGallery from "@/pages/public-gallery";
import Leaderboard from "@/pages/leaderboard";
import AITools from "@/pages/ai-tools";

import CodexCustomVizFeature from "./pages/CodexCustomVizFeature";
import CodexOperationsFeature from "./pages/CodexOperationsFeature";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/codex/custom-viz" component={CodexCustomVizFeature} />
      <Route path="/codex/operations" component={CodexOperationsFeature} />
      <Route path="/gallery" component={PublicGallery} />
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/:id" component={ProjectDetails} />
          <Route path="/applications" component={Applications} />
          <Route path="/investments" component={Investments} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/messaging" component={Messaging} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/activity" component={Activity} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/ai-tools" component={AITools} />
          {/* === Batch 11 Gaps & Frontend Mounts === */}
          <Route path="/gap/donation-matching" component={GapDonationMatchingPage} />
          <Route path="/gap/grant-proposal-writer" component={GapGrantProposalWriterPage} />
          <Route path="/gap/donor-segmentation" component={GapDonorSegmentationPage} />
          <Route path="/gap/content-moderation" component={GapContentModerationPage} />
          <Route path="/gap/payment-processing" component={GapPaymentProcessingPage} />
          <Route path="/gap/recurring-donations" component={GapRecurringDonationsPage} />
          <Route path="/gap/volunteer-management" component={GapVolunteerManagementPage} />
          <Route path="/gap/grant-doc-versioning" component={GapGrantDocVersioningPage} />
          <Route path="/gap/tax-receipt-generation" component={GapTaxReceiptGenerationPage} />
          <Route path="/gap/mobile-app-stub" component={GapMobileAppStubPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
