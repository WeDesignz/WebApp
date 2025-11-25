"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  MessageCircle,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  XCircle,
  FileText,
  Eye,
  Download,
  ExternalLink,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SupportChat from "@/components/customer-dashboard/SupportChat";
import CustomOrderModal from "@/components/customer-dashboard/CustomOrderModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: number | string;
  title?: string;
  order_number?: string;
  order_type?: "cart" | "subscription" | "custom" | "mock_pdf";
  type?: "custom" | "product";
  status: "pending" | "success" | "failed" | "processing" | "cancelled" | "in_progress" | "completed" | string;
  created_at: string;
  total_amount?: number | string;
  deliveryTime?: number;
  price?: number;
  budget?: number;
  description?: string;
  products_count?: number;
  custom_order_details?: any;
  subscription_details?: any;
  pdf_download?: any;
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomRequest, setSelectedCustomRequest] = useState<CustomRequest | null>(null);
  const [selectedCustomOrderForDetails, setSelectedCustomOrderForDetails] = useState<Order | null>(null);
  const [selectedCustomOrderForDeliverables, setSelectedCustomOrderForDeliverables] = useState<Order | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
  const [customRequestDetailOpen, setCustomRequestDetailOpen] = useState(false);
  const [customOrderDetailsOpen, setCustomOrderDetailsOpen] = useState(false);
  const [deliverablesModalOpen, setDeliverablesModalOpen] = useState(false);
  const [orderProductsModalOpen, setOrderProductsModalOpen] = useState(false);
  const [selectedOrderForProducts, setSelectedOrderForProducts] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get active tab from URL query parameter, default to "all"
  const activeTab = searchParams.get('tab') || 'all';
  const validTabs = ['all', 'products', 'subscription', 'custom', 'mock_pdf'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'all';

  // Handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      // Remove tab param for "all" (default)
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  };

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

  // Fetch custom order details when viewing details
  const { data: customOrderDetailsData, isLoading: isLoadingCustomOrderDetails } = useQuery({
    queryKey: ['customOrderDetails', selectedCustomOrderForDetails?.id],
    queryFn: async () => {
      if (!selectedCustomOrderForDetails) return null;
      // Try to get custom order request ID from various possible locations
      let customRequestId: number | null = null;
      if (selectedCustomOrderForDetails.custom_order_details?.id) {
        customRequestId = selectedCustomOrderForDetails.custom_order_details.id;
      } else if (typeof selectedCustomOrderForDetails.id === 'number') {
        // If the order ID matches, we can try using it
        // But first, check if we have the custom_request in the order data
        customRequestId = selectedCustomOrderForDetails.id;
      }
      if (!customRequestId) return null;
      const response = await apiClient.getCustomRequestDetail(customRequestId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!selectedCustomOrderForDetails && customOrderDetailsOpen,
    staleTime: 30 * 1000,
  });

  // Fetch order products when viewing order products modal
  const { data: orderProductsData, isLoading: isLoadingOrderProducts } = useQuery({
    queryKey: ['orderProducts', selectedOrderForProducts?.id],
    queryFn: async () => {
      if (!selectedOrderForProducts) return null;
      const response = await apiClient.getOrderDetail(Number(selectedOrderForProducts.id));
      if (response.error) {
        throw new Error(response.error);
      }
      // Response structure: { order: { products: [...] } }
      return response.data?.order || response.data;
    },
    enabled: !!selectedOrderForProducts && orderProductsModalOpen,
    staleTime: 30 * 1000,
  });

  // Fetch deliverables when viewing deliverables modal
  const { data: deliverablesData, isLoading: isLoadingDeliverables } = useQuery({
    queryKey: ['customOrderDeliverables', selectedCustomOrderForDeliverables?.id],
    queryFn: async () => {
      if (!selectedCustomOrderForDeliverables) return null;
      // Try to get custom order request ID from various possible locations
      let customRequestId: number | null = null;
      if (selectedCustomOrderForDeliverables.custom_order_details?.id) {
        customRequestId = selectedCustomOrderForDeliverables.custom_order_details.id;
      } else if (typeof selectedCustomOrderForDeliverables.id === 'number') {
        customRequestId = selectedCustomOrderForDeliverables.id;
      }
      if (!customRequestId) return null;
      const response = await apiClient.getCustomRequestDetail(customRequestId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Get deliverables from the serializer (already filtered by delivery_file type)
      const customRequest = response.data?.custom_request;
      const deliverables = customRequest?.deliverables || [];
      return {
        custom_request: customRequest,
        delivery_message: customRequest?.delivery_message,
        deliverables: deliverables,
      };
    },
    enabled: !!selectedCustomOrderForDeliverables && deliverablesModalOpen,
    staleTime: 30 * 1000,
  });

  // Handle download all deliverables as ZIP
  const handleDownloadAllDeliverables = async () => {
    if (!selectedCustomOrderForDeliverables || !deliverablesData?.deliverables || deliverablesData.deliverables.length === 0) return;
    
    let customRequestId: number | null = null;
    if (selectedCustomOrderForDeliverables.custom_order_details?.id) {
      customRequestId = selectedCustomOrderForDeliverables.custom_order_details.id;
    } else if (typeof selectedCustomOrderForDeliverables.id === 'number') {
      customRequestId = selectedCustomOrderForDeliverables.id;
    }
    
    if (!customRequestId) {
      toast({
        title: "Error",
        description: "Unable to identify custom order",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await apiClient.downloadCustomOrderDeliverablesZip(customRequestId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const orderTitle = selectedCustomOrderForDeliverables.title || `Custom_Order_${customRequestId}`;
      const safeTitle = orderTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      a.download = `${safeTitle}_deliverables.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your deliverable files are being downloaded as a ZIP file.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download deliverables",
        variant: "destructive",
      });
    }
  };

  // Handle individual file download
  const handleDownloadFile = (file: any) => {
    const fileUrl = file.url || file.file_url || file.file;
    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.fileName || file.name || 'file';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="products">Product Orders</TabsTrigger>
            <TabsTrigger value="subscription">Subscription Orders</TabsTrigger>
            <TabsTrigger value="custom">Custom Requests</TabsTrigger>
            <TabsTrigger value="mock_pdf">Mock PDF Downloads</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Group orders by order_type */}
            {(() => {
              const cartOrders = orders.filter(o => o.order_type === 'cart' || (!o.order_type && o.type !== 'custom'));
              const subscriptionOrders = orders.filter(o => o.order_type === 'subscription');
              const customOrders = orders.filter(o => o.order_type === 'custom' || o.type === 'custom');
              const mockPdfOrders = orders.filter(o => o.order_type === 'mock_pdf');
              
              return (
                <>
                  {/* Cart Orders */}
                  {cartOrders.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Cart Orders</h2>
                      {cartOrders.map((order, index) => {
                        const CartOrderCardWithUnread = () => {
                          const { user } = useAuth();
                          const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                          return (
                            <motion.div
                              key={`cart-order-${order.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <CartOrderCard
                                order={order}
                                onOpenChat={() => {
                                  setSelectedOrder(order);
                                  setChatOpen(true);
                                }}
                                onViewDesign={(order) => {
                                  setSelectedOrderForProducts(order);
                                  setOrderProductsModalOpen(true);
                                }}
                                unreadCount={unreadCount}
                              />
                            </motion.div>
                          );
                        };
                        return <CartOrderCardWithUnread key={`cart-order-${order.id}`} />;
                      })}
                    </div>
                  )}

                  {/* Subscription Orders */}
                  {subscriptionOrders.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h2 className="text-xl font-semibold">Subscription Orders</h2>
                      {subscriptionOrders.map((order, index) => {
                        const SubscriptionOrderCardWithUnread = () => {
                          const { user } = useAuth();
                          const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                          return (
                            <motion.div
                              key={`subscription-order-${order.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (cartOrders.length + index) * 0.1 }}
                            >
                              <SubscriptionOrderCard
                                order={order}
                                onOpenChat={() => {
                                  setSelectedOrder(order);
                                  setChatOpen(true);
                                }}
                                onViewDesign={(order) => {
                                  setSelectedOrderForProducts(order);
                                  setOrderProductsModalOpen(true);
                                }}
                                unreadCount={unreadCount}
                              />
                            </motion.div>
                          );
                        };
                        return <SubscriptionOrderCardWithUnread key={`subscription-order-${order.id}`} />;
                      })}
                    </div>
                  )}

                  {/* Custom Orders */}
                  {customOrders.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h2 className="text-xl font-semibold">Custom Orders</h2>
                      {customOrders.map((order, index) => {
                        const UnreadCounter = ({ orderId }: { orderId: string }) => {
                          const { user } = useAuth();
                          const unreadCount = useUnreadMessages(orderId, user?.id);
                          return null; // This component is just for the hook, we'll use the count in the card
                        };
                        return (
                          <CustomOrderCardWithUnread
                            key={`custom-order-${order.id}`}
                            order={order}
                            index={index}
                            totalPrevious={cartOrders.length + subscriptionOrders.length}
                            onOpenChat={() => {
                              setSelectedOrder(order);
                              setChatOpen(true);
                            }}
                            onViewDetails={(order) => {
                              setSelectedCustomOrderForDetails(order);
                              setCustomOrderDetailsOpen(true);
                            }}
                            onViewDeliverables={(order) => {
                              setSelectedCustomOrderForDeliverables(order);
                              setDeliverablesModalOpen(true);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Mock PDF Orders */}
                  {mockPdfOrders.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h2 className="text-xl font-semibold">Mock PDF Downloads</h2>
                      {mockPdfOrders.map((order, index) => {
                        const MockPDFOrderCardWithUnread = () => {
                          const { user } = useAuth();
                          const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                          return (
                            <motion.div
                              key={`mock-pdf-order-${order.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (cartOrders.length + subscriptionOrders.length + customOrders.length + index) * 0.1 }}
                            >
                              <MockPDFOrderCard
                                order={order}
                                onOpenChat={() => {
                                  setSelectedOrder(order);
                                  setChatOpen(true);
                                }}
                                unreadCount={unreadCount}
                              />
                            </motion.div>
                          );
                        };
                        return <MockPDFOrderCardWithUnread key={`mock-pdf-order-${order.id}`} />;
                      })}
                    </div>
                  )}

                  {/* Empty State */}
                  {orders.length === 0 && (
                    <Card className="p-12 text-center">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Your orders will appear here
                      </p>
                      <Button onClick={() => setCustomOrderModalOpen(true)}>
                        Create Custom Order
                      </Button>
                    </Card>
                  )}
                </>
              );
            })()}
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
            ) : (() => {
              // Product orders are cart orders only, not subscription orders
              const productOrders = orders.filter(o => {
                // Exclude subscription orders
                if (o.order_type === 'subscription') return false;
                // Include cart orders or orders without order_type (but not custom)
                return o.order_type === 'cart' || (!o.order_type && o.type !== 'custom');
              });
              return productOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No product orders yet</h3>
                  <p className="text-muted-foreground">
                    Your product orders will appear here
                  </p>
                </Card>
              ) : (
                productOrders.map((order, index) => {
                  const CartOrderCardWithUnread = () => {
                    const { user } = useAuth();
                    const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                    return (
                      <motion.div
                        key={`product-order-${order.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CartOrderCard
                          order={order}
                          onOpenChat={() => {
                            setSelectedOrder(order);
                            setChatOpen(true);
                          }}
                          onViewDesign={(order) => {
                            setSelectedOrderForProducts(order);
                            setOrderProductsModalOpen(true);
                          }}
                          unreadCount={unreadCount}
                        />
                      </motion.div>
                    );
                  };
                  return <CartOrderCardWithUnread key={`product-order-${order.id}`} />;
                })
              );
            })()}
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ordersError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading subscription orders</h3>
                <p className="text-muted-foreground">
                  {ordersError instanceof Error ? ordersError.message : 'Failed to load subscription orders'}
                </p>
              </Card>
            ) : (() => {
              const subscriptionOrders = orders.filter(o => o.order_type === 'subscription');
              return subscriptionOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No subscription orders yet</h3>
                  <p className="text-muted-foreground">
                    Your subscription orders will appear here
                  </p>
                </Card>
              ) : (
                subscriptionOrders.map((order, index) => {
                  const SubscriptionOrderCardWithUnread = () => {
                    const { user } = useAuth();
                    const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                    return (
                      <motion.div
                        key={`subscription-order-${order.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SubscriptionOrderCard
                          order={order}
                          onOpenChat={() => {
                            setSelectedOrder(order);
                            setChatOpen(true);
                          }}
                          onViewDesign={(order) => {
                            setSelectedOrderForProducts(order);
                            setOrderProductsModalOpen(true);
                          }}
                          unreadCount={unreadCount}
                        />
                      </motion.div>
                    );
                  };
                  return <SubscriptionOrderCardWithUnread key={`subscription-order-${order.id}`} />;
                })
              );
            })()}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ordersError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading custom orders</h3>
                <p className="text-muted-foreground">
                  {ordersError instanceof Error ? ordersError.message : 'Failed to load custom orders'}
                </p>
              </Card>
            ) : (() => {
              const customOrders = orders.filter(o => o.order_type === 'custom' || o.type === 'custom');
              return customOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No custom orders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a custom design request to get started
                  </p>
                  <Button onClick={() => setCustomOrderModalOpen(true)}>
                    Create Custom Order
                  </Button>
                </Card>
              ) : (
                customOrders.map((order, index) => (
                  <CustomOrderCardWithUnread
                    key={`custom-order-${order.id}`}
                    order={order}
                    index={index}
                    totalPrevious={0}
                    onOpenChat={() => {
                      setSelectedOrder(order);
                      setChatOpen(true);
                    }}
                    onViewDetails={(order) => {
                      setSelectedCustomOrderForDetails(order);
                      setCustomOrderDetailsOpen(true);
                    }}
                    onViewDeliverables={(order) => {
                      setSelectedCustomOrderForDeliverables(order);
                      setDeliverablesModalOpen(true);
                    }}
                  />
                ))
              );
            })()}
          </TabsContent>

          <TabsContent value="mock_pdf" className="space-y-4">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ordersError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading mock PDF orders</h3>
                <p className="text-muted-foreground">
                  {ordersError instanceof Error ? ordersError.message : 'Failed to load mock PDF orders'}
                </p>
              </Card>
            ) : (() => {
              const mockPdfOrders = orders.filter(o => o.order_type === 'mock_pdf');
              return mockPdfOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No mock PDF downloads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your mock PDF download orders will appear here
                  </p>
                  <Button onClick={() => router.push('/customer-dashboard/download-mock-pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Mock PDF
                  </Button>
                </Card>
              ) : (
                mockPdfOrders.map((order, index) => {
                  const MockPDFOrderCardWithUnread = () => {
                    const { user } = useAuth();
                    const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
                    return (
                      <motion.div
                        key={`mock-pdf-order-${order.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <MockPDFOrderCard
                          order={order}
                          onOpenChat={() => {
                            setSelectedOrder(order);
                            setChatOpen(true);
                          }}
                          unreadCount={unreadCount}
                        />
                      </motion.div>
                    );
                  };
                  return <MockPDFOrderCardWithUnread key={`mock-pdf-order-${order.id}`} />;
                })
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrder && (
        <SupportChat
          open={chatOpen}
          onClose={() => {
            setChatOpen(false);
            // Invalidate unread count query when modal closes to update counters
            queryClient.invalidateQueries({ queryKey: ['orderComments', selectedOrder.id.toString(), 'unread'] });
          }}
          orderId={selectedOrder.id.toString()}
          orderTitle={selectedOrder.title || 'Order'}
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

      {/* Custom Order Details Dialog */}
      {selectedCustomOrderForDetails && (
        <Dialog open={customOrderDetailsOpen} onOpenChange={setCustomOrderDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {customOrderDetailsData?.custom_request?.title || selectedCustomOrderForDetails.custom_order_details?.title || 'Custom Order Details'}
              </DialogTitle>
              <DialogDescription>
                View all details related to this custom order
              </DialogDescription>
            </DialogHeader>
            {isLoadingCustomOrderDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : customOrderDetailsData?.custom_request ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {customOrderDetailsData.custom_request.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Status: </span>
                    <Badge className="ml-2">
                      {customOrderDetailsData.custom_request.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Budget: </span>
                    <span className="font-semibold">₹{customOrderDetailsData.custom_request.budget || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Order ID: </span>
                    <span className="font-mono text-sm">#{selectedCustomOrderForDetails.order_number || selectedCustomOrderForDetails.id}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Created: </span>
                    <span className="text-sm">
                      {new Date(customOrderDetailsData.custom_request.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
                {customOrderDetailsData.custom_request.delivery_message && (
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Message</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {customOrderDetailsData.custom_request.delivery_message}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load order details
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Deliverables Modal */}
      {selectedCustomOrderForDeliverables && (
        <Dialog open={deliverablesModalOpen} onOpenChange={setDeliverablesModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Deliverables</DialogTitle>
              <DialogDescription>
                Download files delivered for this custom order
              </DialogDescription>
            </DialogHeader>
            {isLoadingDeliverables ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : deliverablesData?.deliverables && deliverablesData.deliverables.length > 0 ? (
              <div className="space-y-4">
                {deliverablesData.delivery_message && (
                  <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {deliverablesData.delivery_message}
                    </p>
                  </div>
                )}
                
                {/* Download All Button */}
                <div className="flex justify-end pb-2 border-b">
                  <Button
                    onClick={handleDownloadAllDeliverables}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All as ZIP ({deliverablesData.deliverables.length} {deliverablesData.deliverables.length === 1 ? 'file' : 'files'})
                  </Button>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  {deliverablesData.deliverables.map((file: any, index: number) => {
                    const fileName = file.fileName || file.file?.name?.split('/').pop() || file.file_url?.split('/').pop() || `File ${index + 1}`;
                    const fileUrl = file.url || file.file_url || file.file;
                    const fileSize = file.file_size;
                    
                    return (
                      <Card key={file.id || index} className="p-4 hover:shadow-md transition-shadow border-border/50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" title={fileName}>
                                {fileName}
                              </p>
                              {fileSize && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                              {file.uploadedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Uploaded: {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(file)}
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No deliverables yet</h3>
                <p className="text-sm text-muted-foreground">
                  Deliverables will appear here once the order is completed and files are uploaded.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Order Products Modal */}
      {selectedOrderForProducts && (
        <Dialog open={orderProductsModalOpen} onOpenChange={setOrderProductsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Order Products - #{selectedOrderForProducts.order_number || selectedOrderForProducts.id}
              </DialogTitle>
              <DialogDescription>
                View all products associated with this order
              </DialogDescription>
            </DialogHeader>
            {isLoadingOrderProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : orderProductsData?.products && Array.isArray(orderProductsData.products) && orderProductsData.products.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderProductsData.products.map((product: any, index: number) => {
                    // Extract product image from media array (sorted: mockup first, then jpg/png, then others)
                    let productImage = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                    if (product.media && Array.isArray(product.media) && product.media.length > 0) {
                      // Media is already sorted by ProductSerializer (mockup first, then jpg/png)
                      const firstMedia = product.media[0];
                      productImage = firstMedia.file_url || 
                                    firstMedia.url || 
                                    firstMedia.file ||
                                    productImage;
                    } else if (product.image) {
                      productImage = product.image;
                    }
                    
                    // Make absolute URL if needed
                    const makeAbsoluteUrl = (url: string): string => {
                      if (!url) return '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                      if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                      }
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
                      if (apiBaseUrl && url.startsWith('/')) {
                        return `${apiBaseUrl}${url}`;
                      }
                      if (apiBaseUrl && !url.startsWith('/')) {
                        return `${apiBaseUrl}/${url}`;
                      }
                      return url;
                    };
                    
                    const productTitle = product.title || `Product ${index + 1}`;
                    const productPrice = product.price || 0;
                    const productCategory = product.category?.name || product.category || 'Uncategorized';
                    const productDesigner = product.created_by?.username || 
                                          product.created_by?.first_name || 
                                          product.designer ||
                                          'Unknown Designer';

                    return (
                      <Card key={product.id || index} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={makeAbsoluteUrl(productImage)}
                              alt={productTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">{productTitle}</h4>
                            <p className="text-xs text-muted-foreground mb-1">by {productDesigner}</p>
                            <p className="text-xs text-muted-foreground mb-2">{productCategory}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-primary">₹{productPrice}</span>
                              {product.product_plan_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.product_plan_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground">
                  Unable to load products for this order.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Base order card component with shared logic
function BaseOrderCard({ order, onOpenChat, onViewDesign, orderTypeLabel, iconColor, bgColor, borderColor, unreadCount = 0 }: { 
  order: Order; 
  onOpenChat: () => void;
  onViewDesign?: (order: Order) => void;
  orderTypeLabel: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  unreadCount?: number;
}) {
  const getStatusConfig = () => {
    switch (order.status) {
      case "pending":
        return { icon: AlertCircle, label: "Pending", badgeVariant: "secondary" as const };
      case "processing":
      case "in_progress":
        return { icon: Clock, label: "Processing", badgeVariant: "default" as const };
      case "success":
      case "completed":
        return { icon: CheckCircle2, label: "Completed", badgeVariant: "secondary" as const };
      case "failed":
        return { icon: AlertCircle, label: "Failed", badgeVariant: "destructive" as const };
      case "cancelled":
        return { icon: AlertCircle, label: "Cancelled", badgeVariant: "secondary" as const };
      default:
        return { icon: Package, label: order.status || "Unknown", badgeVariant: "secondary" as const };
    }
  };
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const deliveryTime = order.deliveryTime || 60 * 60 * 1000;
  const createdAt = order.created_at || new Date().toISOString();

  useEffect(() => {
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

  const config = getStatusConfig();
  const Icon = config.icon;
  const isCompleted = order.status === "success" || order.status === "completed";

  return (
    <Card className={`p-6 bg-gradient-to-br ${bgColor} ${borderColor} hover:shadow-lg transition-all duration-300 border-2 group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`w-14 h-14 bg-gradient-to-br ${iconColor} rounded-xl flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow flex items-center justify-center`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {order.order_number ? `Order ${order.order_number}` : `Order #${order.id}`}
                </h3>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  {orderTypeLabel}
                </p>
              </div>
              <Badge variant={config.badgeVariant} className="text-xs font-semibold px-2.5 py-0.5">
                {config.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {(order.total_amount !== undefined || order.price !== undefined) && (
                  <span className="font-semibold text-foreground">₹{order.total_amount || order.price || 0}</span>
                )}
                {(order.total_amount !== undefined || order.price !== undefined) && (
                  <span className="text-muted-foreground/50">•</span>
                )}
                <span>{new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {(order.status === "pending" || order.status === "processing" || order.status === "in_progress") && timeRemaining > 0 && (
                <div className="flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1.5 rounded-lg w-fit">
                  <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">{formatTime(timeRemaining)}</span>
                  <span className="text-sm text-blue-600/80 dark:text-blue-400/80">remaining</span>
                </div>
              )}
              {isCompleted ? (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Your order has been completed! Check your downloads.
                </p>
              ) : order.status === "failed" ? (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Order processing failed. Please contact support.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative inline-block">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenChat}
              className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            {unreadCount > 0 ? (
              <span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 z-50 shadow-lg ring-2 ring-white dark:ring-gray-900 pointer-events-none"
                style={{ lineHeight: '1.25rem' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </div>
          {isCompleted && onViewDesign && (
            <Button 
              size="sm"
              className="bg-primary hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
              onClick={() => onViewDesign(order)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Design
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Cart Order Card
function CartOrderCard({ order, onOpenChat, onViewDesign, unreadCount = 0 }: { 
  order: Order; 
  onOpenChat: () => void; 
  onViewDesign?: (order: Order) => void;
  unreadCount?: number;
}) {
  return (
    <BaseOrderCard
      order={order}
      onOpenChat={onOpenChat}
      onViewDesign={onViewDesign}
      orderTypeLabel="Cart Order"
      iconColor="from-blue-500 to-indigo-500"
      bgColor="from-blue-500/10 to-indigo-500/10"
      borderColor="border-blue-500/20"
      unreadCount={unreadCount}
    />
  );
}

// Subscription Order Card
function SubscriptionOrderCard({ order, onOpenChat, onViewDesign, unreadCount = 0 }: { 
  order: Order; 
  onOpenChat: () => void; 
  onViewDesign?: (order: Order) => void;
  unreadCount?: number;
}) {
  return (
    <BaseOrderCard
      order={order}
      onOpenChat={onOpenChat}
      onViewDesign={onViewDesign}
      orderTypeLabel="Subscription Order"
      iconColor="from-purple-500 to-pink-500"
      bgColor="from-purple-500/10 to-pink-500/10"
      borderColor="border-purple-500/20"
      unreadCount={unreadCount}
    />
  );
}

// Mock PDF Order Card
function MockPDFOrderCard({ order, onOpenChat, unreadCount = 0 }: { order: Order; onOpenChat: () => void; unreadCount?: number }) {
  const getStatusConfig = () => {
    // For mock PDF orders, check pdf_download status if available
    const pdfStatus = order.pdf_download?.status;
    if (pdfStatus === 'completed') {
      return { icon: CheckCircle2, label: "Completed", badgeVariant: "secondary" as const };
    } else if (pdfStatus === 'processing') {
      return { icon: Clock, label: "Processing", badgeVariant: "default" as const };
    } else if (pdfStatus === 'failed') {
      return { icon: AlertCircle, label: "Failed", badgeVariant: "destructive" as const };
    }
    
    // Fallback to order status
    switch (order.status) {
      case "pending":
        return { icon: AlertCircle, label: "Pending", badgeVariant: "secondary" as const };
      case "processing":
        return { icon: Clock, label: "Processing", badgeVariant: "default" as const };
      case "success":
      case "completed":
        return { icon: CheckCircle2, label: "Completed", badgeVariant: "secondary" as const };
      case "failed":
        return { icon: AlertCircle, label: "Failed", badgeVariant: "destructive" as const };
      default:
        return { icon: FileText, label: order.status || "Unknown", badgeVariant: "secondary" as const };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isCompleted = order.status === "success" || order.status === "completed" || order.pdf_download?.status === 'completed';
  const pdfDownload = order.pdf_download;
  const totalPages = pdfDownload?.total_pages || 0;
  const downloadType = pdfDownload?.download_type || 'free';

  return (
    <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20 hover:shadow-lg transition-all duration-300 border-2 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {order.order_number ? `Order ${order.order_number}` : `Order #${order.id}`}
                </h3>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Mock PDF Download • {totalPages} {totalPages === 1 ? 'Design' : 'Designs'}
                </p>
              </div>
              <Badge variant={config.badgeVariant} className="text-xs font-semibold px-2.5 py-0.5">
                {config.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {order.total_amount !== undefined && (
                  <span className="font-semibold text-foreground">
                    {order.total_amount === 0 || order.total_amount === '0.00' ? 'Free' : `₹${order.total_amount}`}
                  </span>
                )}
                {order.total_amount !== undefined && (
                  <span className="text-muted-foreground/50">•</span>
                )}
                <span>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                {downloadType && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <Badge variant="outline" className="text-xs">
                      {downloadType === 'free' ? 'Free Download' : 'Paid Download'}
                    </Badge>
                  </>
                )}
              </div>
              {isCompleted && pdfDownload?.pdf_file_path && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  PDF ready for download! Check your downloads section.
                </p>
              )}
              {pdfDownload?.status === 'processing' && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  PDF is being generated. This may take a few minutes.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative inline-block">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenChat}
              className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            {unreadCount > 0 ? (
              <span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 z-50 shadow-lg ring-2 ring-white dark:ring-gray-900 pointer-events-none"
                style={{ lineHeight: '1.25rem' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </div>
          {isCompleted && pdfDownload?.pdf_file_path && (
            <Button 
              size="sm"
              className="bg-primary hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
              onClick={() => {
                // Navigate to downloads page or trigger download
                window.location.href = '/customer-dashboard/downloads';
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              View Download
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Countdown Timer Component
function CountdownTimer({ deadline, status }: { deadline: string; status: string }) {
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Don't show timer for completed/cancelled/delayed orders
    if (status === 'completed' || status === 'cancelled' || status === 'delayed') {
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ minutes: 0, seconds: 0 });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining({ minutes, seconds });
      setIsExpired(false);
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  // Don't render if order is completed/cancelled/delayed
  if (status === 'completed' || status === 'cancelled' || status === 'delayed') {
    return null;
  }

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
        <Clock className="w-4 h-4 text-red-500" />
        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Expired</span>
      </div>
    );
  }

  const formattedMinutes = String(timeRemaining.minutes).padStart(2, '0');
  const formattedSeconds = String(timeRemaining.seconds).padStart(2, '0');

  // Determine color based on time remaining
  const isUrgent = timeRemaining.minutes < 10;
  const isWarning = timeRemaining.minutes < 30 && !isUrgent;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-sm ${
      isUrgent 
        ? 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-400/50 dark:border-red-500/40' 
        : isWarning 
        ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-900/20 border-orange-400/50 dark:border-orange-500/40' 
        : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-900/20 border-blue-400/50 dark:border-blue-500/40'
    }`}>
      <Clock className={`w-4 h-4 flex-shrink-0 ${
        isUrgent ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'
      }`} />
      <span className={`text-lg font-mono font-bold ${
        isUrgent 
          ? 'text-red-600 dark:text-red-400' 
          : isWarning 
          ? 'text-orange-600 dark:text-orange-400' 
          : 'text-blue-600 dark:text-blue-400'
      }`}>
        {formattedMinutes}:{formattedSeconds}
      </span>
      <span className={`text-[10px] font-medium uppercase tracking-wider ${
        isUrgent 
          ? 'text-red-500/70 dark:text-red-400/70' 
          : isWarning 
          ? 'text-orange-500/70 dark:text-orange-400/70' 
          : 'text-blue-500/70 dark:text-blue-400/70'
      }`}>
        Remaining
      </span>
    </div>
  );
}

// Custom Order Card with Unread Counter
function CustomOrderCardWithUnread({ 
  order, 
  onOpenChat, 
  onViewDetails, 
  onViewDeliverables,
  index,
  totalPrevious
}: { 
  order: Order; 
  onOpenChat: () => void;
  onViewDetails?: (order: Order) => void;
  onViewDeliverables?: (order: Order) => void;
  index: number;
  totalPrevious: number;
}) {
  const { user } = useAuth();
  const unreadCount = useUnreadMessages(order.id?.toString() || null, user?.id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (totalPrevious + index) * 0.1 }}
    >
      <CustomOrderCard
        order={order}
        onOpenChat={onOpenChat}
        onViewDetails={onViewDetails}
        onViewDeliverables={onViewDeliverables}
        unreadCount={unreadCount}
      />
    </motion.div>
  );
}

// Custom Order Card
function CustomOrderCard({ order, onOpenChat, onViewDetails, onViewDeliverables, unreadCount = 0 }: { 
  order: Order; 
  onOpenChat: () => void;
  onViewDetails?: (order: Order) => void;
  onViewDeliverables?: (order: Order) => void;
  unreadCount?: number;
}) {
  const customDetails = order.custom_order_details;
  // For custom orders, use the status from custom_order_details (CustomOrderRequest) instead of order.status (Order)
  // Order.status is for payment status (pending/success/failed), not the order workflow status
  const customOrderStatus = customDetails?.status || order.status;
  
  const getStatusConfig = () => {
    switch (customOrderStatus) {
      case "pending":
        return { 
          icon: AlertCircle, 
          label: "Pending", 
          badgeVariant: "secondary" as const,
          bgColor: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
          borderColor: "border-orange-500/20 dark:border-orange-500/30",
          iconColor: "from-orange-500 to-amber-500",
        };
      case "success":
      case "completed":
        return { 
          icon: CheckCircle2, 
          label: "Completed", 
          badgeVariant: "secondary" as const,
          bgColor: "from-green-500/10 via-emerald-500/10 to-teal-500/10",
          borderColor: "border-green-500/20 dark:border-green-500/30",
          iconColor: "from-green-500 to-emerald-500",
        };
      case "failed":
        return { 
          icon: AlertCircle, 
          label: "Failed", 
          badgeVariant: "destructive" as const,
          bgColor: "from-red-500/10 via-rose-500/10 to-pink-500/10",
          borderColor: "border-red-500/20 dark:border-red-500/30",
          iconColor: "from-red-500 to-rose-500",
        };
      case "in_progress":
        return { 
          icon: Clock, 
          label: "In Progress", 
          badgeVariant: "default" as const,
          bgColor: "from-blue-500/10 via-cyan-500/10 to-sky-500/10",
          borderColor: "border-blue-500/20 dark:border-blue-500/30",
          iconColor: "from-blue-500 to-cyan-500",
        };
      case "cancelled":
        return { 
          icon: XCircle, 
          label: "Cancelled", 
          badgeVariant: "destructive" as const,
          bgColor: "from-gray-500/10 via-slate-500/10 to-stone-500/10",
          borderColor: "border-gray-500/20 dark:border-gray-500/30",
          iconColor: "from-gray-500 to-slate-500",
        };
      case "delayed":
        return { 
          icon: Clock, 
          label: "Delayed", 
          badgeVariant: "destructive" as const,
          bgColor: "from-red-500/10 via-orange-500/10 to-amber-500/10",
          borderColor: "border-red-500/20 dark:border-red-500/30",
          iconColor: "from-red-500 to-orange-500",
        };
      default:
        return { 
          icon: FileText, 
          label: customOrderStatus || "Unknown", 
          badgeVariant: "secondary" as const,
          bgColor: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
          borderColor: "border-orange-500/20 dark:border-orange-500/30",
          iconColor: "from-orange-500 to-amber-500",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;
  const isCompleted = customOrderStatus === "completed";

  return (
    <Card className={`p-6 bg-gradient-to-br ${statusConfig.bgColor} ${statusConfig.borderColor} hover:shadow-lg transition-all duration-300 border-2 group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`w-14 h-14 bg-gradient-to-br ${statusConfig.iconColor} rounded-xl flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow flex items-center justify-center`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {customDetails?.title || order.title || (order.order_number ? `Order ${order.order_number}` : `Order #${order.id}`)}
                </h3>
                {!customDetails?.title && !order.title && (
                  <p className="text-xs text-muted-foreground -mt-0.5">
                    Custom Order
                  </p>
                )}
              </div>
              <Badge variant={statusConfig.badgeVariant} className="text-xs font-semibold px-2.5 py-0.5">
                {statusConfig.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="font-mono font-semibold text-foreground">#{order.order_number || order.id}</span>
                </span>
                {customDetails?.budget && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="font-semibold text-foreground">₹{customDetails.budget}</span>
                  </>
                )}
                <span className="text-muted-foreground/50">•</span>
                <span>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {customDetails?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {customDetails.description}
                </p>
              )}
              {isCompleted && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Order completed! View deliverables to download files.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap justify-end">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails(order)}
                className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4 mr-2" />
                Details
              </Button>
            )}
            <div className="relative inline-block">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenChat}
                className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              {unreadCount > 0 ? (
                <span 
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 z-50 shadow-lg ring-2 ring-white dark:ring-gray-900 pointer-events-none"
                  style={{ lineHeight: '1.25rem' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </div>
            {isCompleted && onViewDeliverables && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDeliverables(order)}
                className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                View Deliverables
              </Button>
            )}
          </div>
          {/* Countdown Timer - Right side below action buttons */}
          {customDetails?.sla_deadline && customOrderStatus !== 'completed' && customOrderStatus !== 'cancelled' && customOrderStatus !== 'delayed' && (
            <CountdownTimer deadline={customDetails.sla_deadline} status={customOrderStatus} />
          )}
        </div>
      </div>
    </Card>
  );
}

// Keep old OrderCard for backward compatibility (used in products tab)
function OrderCard({ order, onOpenChat, unreadCount = 0 }: { order: Order; onOpenChat: () => void; unreadCount?: number }) {
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
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {order.order_number ? `Order ${order.order_number}` : `Order #${order.id}`}
                </h3>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  {order.order_type === 'cart' ? 'Cart Order' : order.order_type === 'subscription' ? 'Subscription Order' : 'Order'}
                </p>
              </div>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {(order.total_amount !== undefined || order.price !== undefined) && (
                  <span>₹{order.total_amount || order.price || 0}</span>
                )}
                {(order.total_amount !== undefined || order.price !== undefined) && (
                  <span>•</span>
                )}
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
          <div className="relative inline-block">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChat}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            {unreadCount > 0 ? (
              <span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 z-50 shadow-lg ring-2 ring-white dark:ring-gray-900 pointer-events-none"
                style={{ lineHeight: '1.25rem' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </div>
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
