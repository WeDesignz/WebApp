"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: number | string;
  type?: "success" | "error" | "info" | "warning";
  notification_type?: string;
  title: string;
  message: string;
  content?: string;
  timestamp?: string;
  created_at?: string;
  read: boolean;
  is_read?: boolean;
  action_url?: string;
  actionUrl?: string;
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
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getNotificationType = (type?: string): "success" | "error" | "info" | "warning" => {
  if (!type) return "info";
  const lowerType = type.toLowerCase();
  if (lowerType.includes("success") || lowerType.includes("approved") || lowerType.includes("completed")) return "success";
  if (lowerType.includes("error") || lowerType.includes("failed") || lowerType.includes("rejected")) return "error";
  if (lowerType.includes("warning") || lowerType.includes("pending")) return "warning";
  return "info";
};

export default function NotificationsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Fetch notifications
  const { data: notificationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['customerNotifications', filter],
    queryFn: async () => {
      const response = await apiClient.getCustomerNotifications({
        status: filter === "all" ? undefined : filter,
      });
      if (response.error) {
        console.error('❌ [NOTIFICATIONS] API Error:', response.error);
        throw new Error(response.error);
      }
      console.log('🔔 [NOTIFICATIONS] API Response:', response);
      console.log('🔔 [NOTIFICATIONS] Response data:', response.data);
      console.log('🔔 [NOTIFICATIONS] Notifications array:', response.data?.notifications);
      if (response.data?.notifications?.length > 0) {
        console.log('🔔 [NOTIFICATIONS] First notification structure:', JSON.stringify(response.data.notifications[0], null, 2));
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.markAllCustomerNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['customerNotificationCount'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const notifications: Notification[] = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unread_count || 0;
  
  // Debug logging
  console.log('🔔 [NOTIFICATIONS] Component state:', {
    notificationsData,
    notificationsCount: notifications.length,
    unreadCount,
    filter
  });

  // Filter notifications based on read status
  const filteredNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    
    return notifications.filter((notif) => {
      // Check both read and is_read fields
      const isRead = notif.read === true || notif.is_read === true;
      
      console.log('🔔 [FILTER] Checking notification:', {
        id: notif.id,
        title: notif.title,
        isRead,
        read: notif.read,
        is_read: notif.is_read,
        filter,
        willInclude: filter === "all" ? true : (filter === "unread" ? !isRead : isRead)
      });
      
      if (filter === "unread") return !isRead;
      if (filter === "read") return isRead;
      return true; // "all" filter - include all notifications
    });
  }, [notifications, filter]);
  
  console.log('🔔 [FILTER] Filter result:', {
    originalCount: notifications.length,
    filteredCount: filteredNotifications.length,
    filter,
    notifications: notifications.map(n => ({ 
      id: n.id, 
      title: n.title, 
      is_read: n.is_read, 
      read: n.read,
      readValue: n.read,
      is_readValue: n.is_read
    }))
  });

  const handleMarkAsRead = (notification: Notification) => {
    if (typeof notification.id === 'number') {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "from-green-500/10 to-emerald-500/10 border-green-500/20";
      case "error":
        return "from-red-500/10 to-rose-500/10 border-red-500/20";
      case "warning":
        return "from-yellow-500/10 to-amber-500/10 border-yellow-500/20";
      case "info":
      default:
        return "from-blue-500/10 to-cyan-500/10 border-blue-500/20";
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Authentication required</h3>
            <p className="text-muted-foreground">
              Please log in to view your notifications
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Error loading notifications</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load notifications'}
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your orders and activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllAsRead} 
              variant="outline" 
              size="sm"
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark all as read"
              )}
            </Button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {console.log('🔔 [RENDER] About to render notifications list. filteredNotifications.length:', filteredNotifications.length, 'filteredNotifications:', filteredNotifications)}
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Debug: Total notifications: {notifications.length}, Filtered: {filteredNotifications.length}, Filter: {filter}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              console.log('🔔 [RENDER] Rendering notification:', notification.id, notification.title);
              
              const isRead = notification.read || notification.is_read || false;
              const type = getNotificationType(notification.type || notification.notification_type);
              const timestamp = notification.timestamp || notification.created_at;
              const actionUrl = notification.action_url || notification.actionUrl;
              const message = notification.message || notification.content || "";

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`p-4 bg-gradient-to-br ${getTypeColor(type)} hover:shadow-lg transition-all ${
                      !isRead ? "border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!isRead && (
                                <Badge variant="default" className="bg-primary text-xs">
                                  New
                                </Badge>
                              )}
                              {/* Debug: Show customer name to verify ownership */}
                              {notification.customer_name && (
                                <Badge variant="outline" className="text-xs">
                                  For: {notification.customer_name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(timestamp)}
                            </div>
                          </div>
                          {!isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification)}
                              className="h-8 w-8 p-0"
                              disabled={markAsReadMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              handleMarkAsRead(notification);
                              window.location.href = actionUrl;
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
