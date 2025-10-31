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

type NotificationType = "success" | "info" | "warning" | "achievement" | "sale" | "message" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
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

// Mock notification data
const generateMockNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: "1",
      type: "sale",
      title: "New Sale!",
      message: "Your design 'Modern Dashboard UI Kit' was purchased for ₹2,499",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
      read: false,
      designId: "design-123",
      actionLabel: "View Design",
    },
    {
      id: "2",
      type: "achievement",
      title: "Milestone Reached!",
      message: "Congratulations! You've reached 100 sales this month",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: "3",
      type: "success",
      title: "Design Approved",
      message: "Your design 'E-commerce Landing Page' has been approved and is now live",
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: true,
      designId: "design-456",
      actionLabel: "View Design",
    },
    {
      id: "4",
      type: "message",
      title: "New Message from Admin",
      message: "Please update your PAN details to continue receiving payouts",
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: false,
      actionLink: "/designer-console/settings",
      actionLabel: "Update Now",
    },
    {
      id: "5",
      type: "info",
      title: "Settlement Processed",
      message: "Your monthly settlement of ₹45,230 has been initiated",
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
      actionLink: "/designer-console/earnings",
      actionLabel: "View Details",
    },
    {
      id: "6",
      type: "warning",
      title: "Action Required",
      message: "Your Razorpay linked account verification is pending. Complete KYC to enable payouts",
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      read: false,
      actionLink: "/designer-console/settings",
      actionLabel: "Complete KYC",
    },
    {
      id: "7",
      type: "sale",
      title: "New Sale!",
      message: "Your design 'Mobile App UI Components' was purchased for ₹1,799",
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      read: true,
      designId: "design-789",
      actionLabel: "View Design",
    },
    {
      id: "8",
      type: "system",
      title: "Platform Update",
      message: "New analytics features are now available. Check out improved trend insights!",
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      read: true,
      actionLink: "/designer-console/analytics",
      actionLabel: "Explore Analytics",
    },
    {
      id: "9",
      type: "achievement",
      title: "Top Designer Badge",
      message: "You've earned the 'Top Designer' badge for outstanding performance!",
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      read: true,
    },
    {
      id: "10",
      type: "info",
      title: "Welcome to WeDesign!",
      message: "Your designer account has been successfully created. Start uploading your designs!",
      timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      read: true,
    },
  ];
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const grouped = groupNotifications(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    toast.success("Notification marked as read");
  };

  const handleMarkAllAsRead = () => {
    if (selectedIds.size === 0) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } else {
      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n)
      );
      toast.success(`${selectedIds.size} notifications marked as read`);
      setSelectedIds(new Set());
    }
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification deleted");
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    toast.success(`${selectedIds.size} notifications deleted`);
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
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark as read
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
              disabled={selectedIds.size === 0 && unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4" />
              {selectedIds.size > 0 ? `Mark ${selectedIds.size} as read` : 'Mark all as read'}
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
