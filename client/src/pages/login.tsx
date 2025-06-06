import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Chrome, Github, Mail, Lock, User, UserCheck } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roles: ["applicant"]
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocalAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const error = await response.json();
        toast({
          title: "Authentication Failed",
          description: error.message || "Please check your credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Welcome back" : "Create account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to your account to continue" 
              : "Sign up to start your funding journey"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Social Login Options */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/login"}
              className="w-full flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
              Continue with Replit
            </Button>
            
            <Button
              variant="outline"
              disabled
              className="w-full flex items-center justify-center gap-2 opacity-50"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google (Coming Soon)
            </Button>
            
            <Button
              variant="outline"
              disabled
              className="w-full flex items-center justify-center gap-2 opacity-50"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub (Coming Soon)
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLocalAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-3">
                <Label>I want to join as (select all that apply)</Label>
                <div className="space-y-3">
                  {[
                    { value: "applicant", label: "Project Applicant", description: "Submit funding requests" },
                    { value: "reviewer", label: "Project Reviewer", description: "Evaluate applications" },
                    { value: "investor", label: "Investor", description: "Fund approved projects" }
                  ].map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.value}
                        checked={formData.roles.includes(role.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              roles: [...prev.roles, role.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              roles: prev.roles.filter(r => r !== role.value)
                            }));
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={role.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {role.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}