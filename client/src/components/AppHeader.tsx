import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Bell, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useLocation } from "wouter";

interface AppHeaderProps {
  currentRole: string;
}

export default function AppHeader({ currentRole }: AppHeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">NonProfit Connect</h1>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className={`px-1 pb-4 text-sm font-medium ${
                isActive("/") 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}>
                Dashboard
              </Link>
              <Link href="/projects" className={`px-1 pb-4 text-sm font-medium ${
                isActive("/projects") 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}>
                Projects
              </Link>
              <Link href="/applications" className={`px-1 pb-4 text-sm font-medium ${
                isActive("/applications") 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}>
                Applications
              </Link>
              <Link href="/investments" className={`px-1 pb-4 text-sm font-medium ${
                isActive("/investments") 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}>
                Investments
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5 text-neutral-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-error text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b border-neutral-200 p-4">
                  <h3 className="font-semibold text-neutral-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-neutral-600">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-200">
                      {notifications.map((notification: any) => (
                        <div key={notification.id} className="p-4 hover:bg-neutral-50">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {notification.read ? (
                                <CheckCircle className="h-4 w-4 text-neutral-400" />
                              ) : (
                                <Clock className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.read ? 'text-neutral-600' : 'text-neutral-900 font-medium'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-primary text-white capitalize">
                {currentRole}
              </Badge>
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl}
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium text-neutral-900">
                {user?.firstName} {user?.lastName}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
