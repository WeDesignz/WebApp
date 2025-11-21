"use client";

import { Bell, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutModal from "./LogoutModal";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface DesignerTopBarProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function DesignerTopBar({ 
  title = "Designer Console",
  subtitle = "Manage your designs and track performance",
  breadcrumb = "Console"
}: DesignerTopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  
  // Fetch notification count
  const { data: notificationCountData } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const response = await apiClient.getNotificationCount();
      if (response.error) {
        return { unread_count: 0 };
      }
      return response.data || { unread_count: 0 };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch recent notifications for dropdown
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await apiClient.getNotifications({
        status: 'all',
        page: 1,
      });
      if (response.error) {
        return { notifications: [] };
      }
      return response.data || { notifications: [] };
    },
    enabled: !!user && notificationsOpen,
    staleTime: 10 * 1000,
  });

  const unreadCount = notificationCountData?.unread_count || 0;
  const recentNotifications = (notificationsData?.notifications || []).slice(0, 5);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/designer-console" className="hover:text-foreground cursor-pointer">Dashboard</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{breadcrumb}</span>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              onBlur={() => setTimeout(() => setNotificationsOpen(false), 200)}
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : recentNotifications.length > 0 ? (
                  <>
                    {recentNotifications.map((notif: any) => (
                      <div 
                        key={notif.id} 
                        className={`p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer ${
                          !notif.is_read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                        onClick={() => {
                          router.push('/designer-console/notifications');
                          setNotificationsOpen(false);
                        }}
                      >
                        <p className="text-sm font-medium">{notif.title || 'Notification'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notif.message || ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                      </div>
                    ))}
                    <Link href="/designer-console/notifications">
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm" 
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View All Notifications
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
              className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-lg transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                V
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl p-2">
                <button
                  onClick={() => {
                    router.push("/designer-console/profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setLogoutModalOpen(true);
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-destructive"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </header>
  );
}
