"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, XCircle, Info, AlertCircle, Clock, Loader2, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number;
  notification_type?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const formatTimestamp = (dateString?: string): string => {
  if (!dateString) return "Just now";
  
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
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getNotificationType = (type?: string): "success" | "error" | "info" | "warning" => {
  if (!type) return "info";
  const lowerType = type.toLowerCase();
  if (lowerType.includes("success") || lowerType.includes("approved") || lowerType.includes("completed") || lowerType.includes("payment_successful")) return "success";
  if (lowerType.includes("error") || lowerType.includes("failed") || lowerType.includes("rejected") || lowerType.includes("payment_failed")) return "error";
  if (lowerType.includes("warning") || lowerType.includes("pending")) return "warning";
  return "info";
};

const getIcon = (type: "success" | "error" | "info" | "warning") => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "error":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case "info":
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification count
  const { data: countData } = useQuery({
    queryKey: ['customerNotificationCount'],
    queryFn: async () => {
      try {
        const response = await apiClient.getCustomerNotificationCount();
        if (response.error) {
          // Log error but don't throw - return default value instead
          console.warn('Failed to fetch notification count:', response.error);
          return { unread_count: 0 };
        }
        return response.data || { unread_count: 0 };
      } catch (error) {
        // Handle any unexpected errors gracefully
        console.warn('Error fetching notification count:', error);
        return { unread_count: 0 };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  // Fetch latest 5 notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['customerNotifications', 'latest'],
    queryFn: async () => {
      try {
        const response = await apiClient.getCustomerNotifications({
          status: 'all',
          limit: 5,
        });
        if (response.error) {
          // Log error but don't throw - return empty array instead
          console.warn('Failed to fetch notifications:', response.error);
          return { notifications: [], unread_count: 0, total_count: 0 };
        }
        return response.data || { notifications: [], unread_count: 0, total_count: 0 };
      } catch (error) {
        // Handle any unexpected errors gracefully
        console.warn('Error fetching notifications:', error);
        return { notifications: [], unread_count: 0, total_count: 0 };
      }
    },
    enabled: !!user && isOpen,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiClient.markCustomerNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['customerNotificationCount'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = countData?.unread_count || 0;
  const notifications: Notification[] = notificationsData?.notifications || [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/customer-dashboard?view=notifications');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const type = getNotificationType(notification.notification_type);
                  const isRead = notification.is_read || false;
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        !isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(notification.created_at)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={handleViewAll}
              >
                <span>View all notifications</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

