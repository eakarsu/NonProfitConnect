import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, Clock, CheckCircle, Settings, MessageSquare, BarChart3,
  Bookmark, Trophy, Shield, Menu, X, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface AppHeaderProps {
  currentRole: string;
}

export default function AppHeader({ currentRole }: AppHeaderProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.read).length;

  const isActive = (path: string) => location === path;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      queryClient.clear();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const primaryLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/applications", label: "Applications" },
    { href: "/investments", label: "Investments" },
  ];

  const moreLinks = [
    { href: "/messaging", label: "Messages", icon: MessageSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...((user as any)?.roles?.includes("admin")
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  const allLinks = [...primaryLinks, ...moreLinks.map(l => ({ href: l.href, label: l.label }))];

  const navLinkClass = (path: string) =>
    `px-1 pt-1 pb-4 text-sm font-medium whitespace-nowrap ${
      isActive(path)
        ? "text-primary border-b-2 border-primary"
        : "text-neutral-600 hover:text-neutral-900"
    }`;

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex-shrink-0 mr-6">
              <h1 className="text-lg font-bold text-primary">NonProfit Connect</h1>
            </Link>

            {/* Primary nav links */}
            <nav className="hidden lg:flex items-center space-x-6">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}

              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`px-1 pt-1 pb-4 text-sm font-medium whitespace-nowrap text-neutral-600 hover:text-neutral-900 flex items-center gap-1 ${
                    moreLinks.some(l => isActive(l.href)) ? "text-primary border-b-2 border-primary" : ""
                  }`}>
                    More
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {moreLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.href}
                      onClick={() => navigate(link.href)}
                      className={`cursor-pointer ${isActive(link.href) ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Right: Bell + Profile + Mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4.5 w-4.5 text-neutral-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b border-neutral-200 px-4 py-3">
                  <h3 className="font-semibold text-sm text-neutral-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {(notifications as any[]).length === 0 ? (
                    <div className="p-4 text-center text-neutral-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {(notifications as any[]).slice(0, 10).map((notification: any) => (
                        <div key={notification.id} className={`px-4 py-3 hover:bg-neutral-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {notification.read ? (
                                <CheckCircle className="h-3.5 w-3.5 text-neutral-400" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${notification.read ? 'text-neutral-600' : 'text-neutral-900 font-medium'}`}>
                                {notification.title}
                              </p>
                              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                                {notification.message}
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

            {/* Profile area */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Profile
                </Button>
              </Link>
              <Badge variant="default" className="bg-primary text-white capitalize text-[11px] px-2 py-0.5">
                {currentRole}
              </Badge>
              <span className="text-xs font-medium text-neutral-700 max-w-[100px] truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 px-2 text-xs">
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Logout
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-neutral-200 pt-2 mt-2 flex items-center justify-between">
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 text-sm text-neutral-700">
                Profile
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
                <LogOut className="h-3.5 w-3.5 mr-1" /> Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
