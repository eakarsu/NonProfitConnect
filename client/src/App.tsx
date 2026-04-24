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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
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
