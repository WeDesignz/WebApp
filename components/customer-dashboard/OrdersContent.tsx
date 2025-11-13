"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MessageCircle,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SupportChat from "@/components/customer-dashboard/SupportChat";
import CustomOrderModal from "@/components/customer-dashboard/CustomOrderModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Order {
  id: number | string;
  title?: string;
  order_number?: string;
  type?: "custom" | "product";
  status: "pending" | "success" | "failed" | "processing" | "cancelled" | "in_progress" | "completed" | string;
  created_at: string;
  total_amount?: number | string;
  deliveryTime?: number;
  price?: number;
  budget?: number;
  description?: string;
}

interface CustomRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  budget: number;
  created_at: string;
  updated_at: string;
}

export default function OrdersContent() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomRequest, setSelectedCustomRequest] = useState<CustomRequest | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
  const [customRequestDetailOpen, setCustomRequestDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders from API
  const { data: ordersData, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiClient.getOrders();
      if (response.error) {
        throw new Error(response.error);
      }
      // Transform the data to match Order interface
      const orders = response.data?.orders || [];
      return orders.map((order: any) => ({
        ...order,
        total_amount: typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : order.total_amount,
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch custom requests from API
  const { data: customRequestsData, isLoading: isLoadingCustomRequests, error: customRequestsError } = useQuery({
    queryKey: ['customRequests'],
    queryFn: async () => {
      const response = await apiClient.getCustomRequests();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.custom_requests || [];
    },
    staleTime: 30 * 1000,
  });

  const orders: Order[] = ordersData || [];
  const customRequests: CustomRequest[] = customRequestsData || [];

  const handleOrderPlaced = async (orderId: string) => {
    await queryClient.invalidateQueries({ queryKey: ['customRequests'] });
    setCustomOrderModalOpen(false);
    toast({
      title: "Order placed successfully!",
      description: "Your custom order has been placed.",
    });
  };

  const handleViewCustomRequest = async (request: CustomRequest) => {
    // Fetch full details
    const response = await apiClient.getCustomRequestDetail(request.id);
    if (response.error) {
      toast({
        title: "Error",
        description: response.error,
        variant: "destructive",
      });
      return;
    }
    setSelectedCustomRequest(response.data?.custom_request || request);
    setCustomRequestDetailOpen(true);
  };

  const handleCancelCustomRequest = async (requestId: number) => {
    const response = await apiClient.cancelCustomRequest(requestId);
    if (response.error) {
      toast({
        title: "Error",
        description: response.error,
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['customRequests'] });
    toast({
      title: "Request cancelled",
      description: "Your custom request has been cancelled.",
    });
    setCustomRequestDetailOpen(false);
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your orders and custom design requests
            </p>
          </div>
          <Button onClick={() => setCustomOrderModalOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            New Custom Order
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="products">Product Orders</TabsTrigger>
            <TabsTrigger value="custom">Custom Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Regular Orders */}
            {orders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Product Orders</h2>
                {orders.map((order, index) => (
                  <motion.div
                    key={`order-${order.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <OrderCard
                      order={order}
                      onOpenChat={() => {
                        setSelectedOrder(order);
                        setChatOpen(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Custom Requests */}
            {customRequests.length > 0 && (
              <div className="space-y-4 mt-6">
                <h2 className="text-xl font-semibold">Custom Requests</h2>
                {customRequests.map((request, index) => (
                  <motion.div
                    key={`custom-${request.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (orders.length + index) * 0.1 }}
                  >
                    <CustomRequestCard
                      request={request}
                      onView={() => handleViewCustomRequest(request)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {orders.length === 0 && customRequests.length === 0 && (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your orders and custom requests will appear here
                </p>
                <Button onClick={() => setCustomOrderModalOpen(true)}>
                  Create Custom Order
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ordersError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading orders</h3>
                <p className="text-muted-foreground">
                  {ordersError instanceof Error ? ordersError.message : 'Failed to load orders'}
                </p>
              </Card>
            ) : orders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No product orders yet</h3>
                <p className="text-muted-foreground">
                  Your product orders will appear here
                </p>
              </Card>
            ) : (
              orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <OrderCard
                    order={order}
                    onOpenChat={() => {
                      setSelectedOrder(order);
                      setChatOpen(true);
                    }}
                  />
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {isLoadingCustomRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : customRequestsError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading custom requests</h3>
                <p className="text-muted-foreground">
                  {customRequestsError instanceof Error ? customRequestsError.message : 'Failed to load custom requests'}
                </p>
              </Card>
            ) : customRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No custom requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a custom design request to get started
                </p>
                <Button onClick={() => setCustomOrderModalOpen(true)}>
                  Create Custom Order
                </Button>
              </Card>
            ) : (
              customRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CustomRequestCard
                    request={request}
                    onView={() => handleViewCustomRequest(request)}
                  />
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrder && (
        <SupportChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          orderId={selectedOrder.id}
          orderTitle={selectedOrder.title}
        />
      )}

      <CustomOrderModal
        open={customOrderModalOpen}
        onClose={() => setCustomOrderModalOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Custom Request Detail Dialog */}
      {selectedCustomRequest && (
        <Dialog open={customRequestDetailOpen} onOpenChange={setCustomRequestDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCustomRequest.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedCustomRequest.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status: </span>
                  <Badge>{selectedCustomRequest.status}</Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Budget: </span>
                  <span className="font-semibold">₹{selectedCustomRequest.budget}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(selectedCustomRequest.created_at).toLocaleString()}
              </div>
              {selectedCustomRequest.status === 'pending' && (
                <Button
                  variant="destructive"
                  onClick={() => handleCancelCustomRequest(selectedCustomRequest.id)}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function OrderCard({ order, onOpenChat }: { order: Order; onOpenChat: () => void }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Calculate delivery time for custom orders (1 hour = 3600000 ms)
  const deliveryTime = order.deliveryTime || 60 * 60 * 1000; // Default 1 hour
  const createdAt = order.created_at || new Date().toISOString();

  useEffect(() => {
    // Show timer for pending/processing orders
    if (order.status === "pending" || order.status === "processing") {
      const calculateTimeRemaining = () => {
        const createdTime = new Date(createdAt).getTime();
        const deadline = createdTime + deliveryTime;
        const now = Date.now();
        const remaining = Math.max(0, deadline - now);
        setTimeRemaining(remaining);
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [order, createdAt, deliveryTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusConfig = () => {
    switch (order.status) {
      case "pending":
        return {
          icon: AlertCircle,
          color: "from-yellow-500 to-orange-500",
          bgColor: "from-yellow-500/10 to-orange-500/10",
          borderColor: "border-yellow-500/20",
          label: "Pending",
          badgeVariant: "secondary" as const,
        };
      case "processing":
      case "in_progress":
        return {
          icon: Clock,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/20",
          label: "Processing",
          badgeVariant: "default" as const,
        };
      case "success":
      case "completed":
        return {
          icon: CheckCircle2,
          color: "from-green-500 to-emerald-500",
          bgColor: "from-green-500/10 to-emerald-500/10",
          borderColor: "border-green-500/20",
          label: "Completed",
          badgeVariant: "secondary" as const,
        };
      case "failed":
        return {
          icon: AlertCircle,
          color: "from-red-500 to-rose-500",
          bgColor: "from-red-500/10 to-rose-500/10",
          borderColor: "border-red-500/20",
          label: "Failed",
          badgeVariant: "destructive" as const,
        };
      case "cancelled":
        return {
          icon: AlertCircle,
          color: "from-gray-500 to-slate-500",
          bgColor: "from-gray-500/10 to-slate-500/10",
          borderColor: "border-gray-500/20",
          label: "Cancelled",
          badgeVariant: "secondary" as const,
        };
      default:
        return {
          icon: Package,
          color: "from-gray-500 to-slate-500",
          bgColor: "from-gray-500/10 to-slate-500/10",
          borderColor: "border-gray-500/20",
          label: order.status || "Unknown",
          badgeVariant: "secondary" as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`p-6 bg-gradient-to-br ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`p-3 bg-gradient-to-br ${config.color} rounded-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">
                {order.title || `Order #${order.order_number || order.id}`}
              </h3>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>
                  Order ID: <span className="font-mono">{order.order_number || order.id}</span>
                </span>
                {(order.total_amount !== undefined || order.price !== undefined) && (
                  <>
                    <span>•</span>
                    <span>₹{order.total_amount || order.price || 0}</span>
                  </>
                )}
                <span>•</span>
                <span>
                  {new Date(createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {(order.status === "pending" || order.status === "processing" || order.status === "in_progress") && timeRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-lg font-bold text-blue-500">
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="text-sm text-muted-foreground">remaining</span>
                </div>
              )}

              {order.status === "success" || order.status === "completed" ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your order has been completed! Check your downloads.
                </p>
              ) : order.status === "failed" ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Order processing failed. Please contact support.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenChat}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          {(order.status === "success" || order.status === "completed") && (
            <Button size="sm">
              View Design
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CustomRequestCard({ request, onView }: { request: CustomRequest; onView: () => void }) {
  const getStatusConfig = () => {
    switch (request.status) {
      case "pending":
        return {
          icon: AlertCircle,
          color: "from-yellow-500 to-orange-500",
          bgColor: "from-yellow-500/10 to-orange-500/10",
          borderColor: "border-yellow-500/20",
          label: "Pending",
          badgeVariant: "secondary" as const,
        };
      case "in_progress":
        return {
          icon: Clock,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/20",
          label: "In Progress",
          badgeVariant: "default" as const,
        };
      case "completed":
        return {
          icon: CheckCircle2,
          color: "from-green-500 to-emerald-500",
          bgColor: "from-green-500/10 to-emerald-500/10",
          borderColor: "border-green-500/20",
          label: "Completed",
          badgeVariant: "secondary" as const,
        };
      case "cancelled":
        return {
          icon: X,
          color: "from-gray-500 to-slate-500",
          bgColor: "from-gray-500/10 to-slate-500/10",
          borderColor: "border-gray-500/20",
          label: "Cancelled",
          badgeVariant: "secondary" as const,
        };
      default:
        return {
          icon: FileText,
          color: "from-gray-500 to-slate-500",
          bgColor: "from-gray-500/10 to-slate-500/10",
          borderColor: "border-gray-500/20",
          label: request.status || "Unknown",
          badgeVariant: "secondary" as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`p-6 bg-gradient-to-br ${config.bgColor} ${config.borderColor} cursor-pointer hover:shadow-lg transition-shadow`} onClick={onView}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`p-3 bg-gradient-to-br ${config.color} rounded-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{request.title}</h3>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {request.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>
                Request ID: <span className="font-mono">#{request.id}</span>
              </span>
              <span>•</span>
              <span>Budget: ₹{request.budget}</span>
              <span>•</span>
              <span>
                {new Date(request.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
          View Details
        </Button>
      </div>
    </Card>
  );
}
