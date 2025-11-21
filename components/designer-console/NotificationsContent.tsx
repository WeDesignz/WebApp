"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Filter,
  Circle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Package,
  Award,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type NotificationType = "success" | "info" | "warning" | "achievement" | "sale" | "message" | "system";

interface Notification {
  id: string | number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  actionLink?: string;
  actionLabel?: string;
  designId?: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "info":
      return <Bell className="w-5 h-5 text-blue-500" />;
    case "warning":
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case "achievement":
      return <Award className="w-5 h-5 text-purple-500" />;
    case "sale":
      return <DollarSign className="w-5 h-5 text-emerald-500" />;
    case "message":
      return <MessageSquare className="w-5 h-5 text-cyan-500" />;
    case "system":
      return <Package className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationBgColor = (type: NotificationType) => {
  switch (type) {
    case "success":
      return "bg-green-500/10 border-green-500/20";
    case "info":
      return "bg-blue-500/10 border-blue-500/20";
    case "warning":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "achievement":
      return "bg-purple-500/10 border-purple-500/20";
    case "sale":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "message":
      return "bg-cyan-500/10 border-cyan-500/20";
    case "system":
      return "bg-orange-500/10 border-orange-500/20";
    default:
      return "bg-gray-500/10 border-gray-500/20";
  }
};

// Transform API notification to UI notification
const transformNotification = (apiNotif: any): Notification => {
  // Map backend notification types to frontend types
  const typeMap: Record<string, NotificationType> = {
    // Backend notification types
    'onboarding_approved': 'success',
    'onboarding_rejected': 'warning',
    'payout_processed': 'sale',
    'payout_failed': 'warning',
    'account_suspended': 'warning',
    'account_deleted': 'warning',
    'system_update': 'system',
    'other': 'info',
    // Generic types
    'sale': 'sale',
    'purchase': 'sale',
    'achievement': 'achievement',
    'success': 'success',
    'approved': 'success',
    'message': 'message',
    'info': 'info',
    'warning': 'warning',
    'system': 'system',
  };

  const notificationType = apiNotif.notification_type || apiNotif.type || '';
  const type = typeMap[notificationType?.toLowerCase() || ''] || 'info';
  const timestamp = apiNotif.timestamp || apiNotif.created_at || new Date().toISOString();
  const isRead = apiNotif.read || apiNotif.is_read || false;

  return {
    id: apiNotif.id,
    type,
    title: apiNotif.title || 'Notification',
    message: apiNotif.message || apiNotif.content || '',
    timestamp: typeof timestamp === 'string' ? new Date(timestamp) : timestamp,
    read: isRead,
    actionLink: apiNotif.action_url || apiNotif.actionLink,
    actionLabel: apiNotif.action_label || apiNotif.actionLabel,
    designId: apiNotif.design_id || apiNotif.designId,
  };
};

const formatTimestamp = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const groupNotifications = (notifications: Notification[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);

  const groups = {
    today: [] as Notification[],
    thisWeek: [] as Notification[],
    older: [] as Notification[],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.timestamp);
    if (notifDate >= today) {
      groups.today.push(notification);
    } else if (notifDate >= thisWeekStart) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

export default function NotificationsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch notifications
  const { data: notificationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', filterType],
    queryFn: async () => {
      const response = await apiClient.getNotifications({
        status: 'all',
        type: filterType === 'all' ? undefined : filterType,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute for new notifications
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiClient.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
      toast.success("Notification marked as read");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark notification as read");
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
      toast.success("All notifications marked as read");
      setSelectedIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark all notifications as read");
    },
  });

  const apiNotifications = notificationsData?.notifications || [];
  const notifications: Notification[] = apiNotifications.map(transformNotification);
  const unreadCount = notificationsData?.unread_count || notifications.filter(n => !n.read).length;

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const grouped = groupNotifications(filteredNotifications);

  const handleSelectAll = (group: Notification[]) => {
    const newSelected = new Set(selectedIds);
    const allSelected = group.every(n => newSelected.has(n.id));
    
    if (allSelected) {
      group.forEach(n => newSelected.delete(n.id));
    } else {
      group.forEach(n => newSelected.add(n.id));
    }
    
    setSelectedIds(newSelected);
  };

  const handleToggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkAsRead = (id: string | number) => {
    if (typeof id === 'number') {
      markAsReadMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string | number) => {
    // Note: Backend doesn't have delete endpoint yet, so we'll just mark as read
    // In a real implementation, you'd call a delete API
    if (typeof id === 'number') {
      markAsReadMutation.mutate(id);
    }
    toast.success("Notification removed");
  };

  const handleBulkDelete = () => {
    // Note: Backend doesn't have bulk delete endpoint yet
    // For now, mark selected as read
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      if (!isNaN(numId)) {
        markAsReadMutation.mutate(numId);
      }
    });
    setSelectedIds(new Set());
  };

  const renderNotificationGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    const allSelected = notifications.every(n => selectedIds.has(n.id));

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => handleSelectAll(notifications)}
            />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <span className="text-sm text-muted-foreground">
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 ${
                  notification.read
                    ? 'bg-card/50 border-border/50'
                    : `${getNotificationBgColor(notification.type)} border`
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedIds.has(notification.id)}
                    onCheckedChange={() => handleToggleSelect(notification.id)}
                    className="mt-1"
                  />

                  <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {notification.title}
                        {!notification.read && (
                          <Circle className="w-2 h-2 fill-primary text-primary" />
                        )}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(notification.actionLink || notification.designId) && (
                        notification.actionLink ? (
                          <Link href={notification.actionLink}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {notification.actionLabel || "View"}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/designer-console/designs?id=${notification.designId}`)}
                            className="h-8 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {notification.actionLabel || "View"}
                          </Button>
                        )
                      )}
                      
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={markAsReadMutation.isPending}
                        >
                          {markAsReadMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark as read
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">Authentication required</h3>
          <p className="text-muted-foreground">Please log in to view your notifications</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold mb-2">Error loading notifications</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load notifications'}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Notifications</p>
              <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Unread</p>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Circle className="w-6 h-6 text-orange-500 fill-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Selected</p>
              <p className="text-2xl font-bold text-foreground">{selectedIds.size}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={(selectedIds.size === 0 && unreadCount === 0) || markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  {selectedIds.size > 0 ? `Mark ${selectedIds.size} as read` : 'Mark all as read'}
                </>
              )}
            </Button>

            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="w-4 h-4" />
              Delete selected ({selectedIds.size})
            </Button>

            {selectedIds.size > 0 && (
              <Button
                onClick={() => setSelectedIds(new Set())}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                Clear selection
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="achievement">Achievements</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="success">Approvals</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {renderNotificationGroup("Today", grouped.today)}
        {renderNotificationGroup("This Week", grouped.thisWeek)}
        {renderNotificationGroup("Older", grouped.older)}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              {filterType !== "all" 
                ? "Try changing the filter to see more notifications"
                : "You're all caught up! Check back later for updates"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
