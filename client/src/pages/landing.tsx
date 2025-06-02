import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, DollarSign } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">NonProfit Connect</h1>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
            Connecting Communities
            <span className="block text-primary">Through Funding</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-neutral-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A collaborative platform that brings together project applicants, expert reviewers, and passionate investors 
            to fund meaningful community initiatives.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/login'}
              className="w-full sm:w-auto"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>For Applicants</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Submit your community project proposals and track their progress through our streamlined application process.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle>For Reviewers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Evaluate project applications and help ensure funding goes to the most impactful community initiatives.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle>For Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Discover approved projects and invest in community initiatives that align with your values and interests.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-neutral-600 mb-6">
            Join our community of changemakers and help fund projects that matter.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
          >
            Join NonProfit Connect
          </Button>
        </div>
      </div>
    </div>
  );
}
