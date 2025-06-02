import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import ApplicantDashboard from "@/components/ApplicantDashboard";
import ReviewerDashboard from "@/components/ReviewerDashboard";
import InvestorDashboard from "@/components/InvestorDashboard";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/authUtils";

type UserRole = "applicant" | "reviewer" | "investor";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>("applicant");

  // Set initial role based on user's roles
  useEffect(() => {
    if (user?.roles?.length > 0) {
      setCurrentRole(user.roles[0] as UserRole);
    }
  }, [user]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole={currentRole} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Switcher - Only show if user has multiple roles */}
        {user?.roles && user.roles.length > 1 && (
          <div className="mb-8">
            <div className="sm:hidden">
              <select 
                value={`${currentRole}-view`}
                onChange={(e) => {
                  const role = e.target.value.replace('-view', '') as UserRole;
                  handleRoleChange(role);
                }}
                className="block w-full rounded-lg border-neutral-200 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary"
              >
                {user.roles.includes("applicant") && <option value="applicant-view">Applicant View</option>}
                {user.roles.includes("reviewer") && <option value="reviewer-view">Reviewer View</option>}
                {user.roles.includes("investor") && <option value="investor-view">Investor View</option>}
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-neutral-200">
                <nav className="-mb-px flex space-x-8">
                  {user.roles.includes("applicant") && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRoleChange("applicant")}
                      className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                        currentRole === "applicant"
                          ? "border-primary text-primary"
                          : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                      }`}
                    >
                      Applicant View
                    </Button>
                  )}
                  {user.roles.includes("reviewer") && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRoleChange("reviewer")}
                      className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                        currentRole === "reviewer"
                          ? "border-primary text-primary"
                          : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                      }`}
                    >
                      Reviewer View
                    </Button>
                  )}
                  {user.roles.includes("investor") && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRoleChange("investor")}
                      className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                        currentRole === "investor"
                          ? "border-primary text-primary"
                          : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                      }`}
                    >
                      Investor View
                    </Button>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {currentRole === "applicant" && user?.roles?.includes("applicant") && <ApplicantDashboard />}
        {currentRole === "reviewer" && user?.roles?.includes("reviewer") && <ReviewerDashboard />}
        {currentRole === "investor" && user?.roles?.includes("investor") && <InvestorDashboard />}
      </div>
    </div>
  );
}
