"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MessageCircle,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SupportChat from "@/components/customer-dashboard/SupportChat";

interface Order {
  id: string;
  title: string;
  type: "custom" | "product";
  status: "waiting" | "started" | "delivered";
  createdAt: string;
  deliveryTime: number;
  price: number;
}

const mockOrders: Order[] = [
  {
    id: "ORD1730824800000",
    title: "Business Card Design",
    type: "custom",
    status: "started",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    deliveryTime: 60 * 60 * 1000,
    price: 200,
  },
  {
    id: "ORD1730820000000",
    title: "Logo Design Bundle",
    type: "custom",
    status: "delivered",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    deliveryTime: 60 * 60 * 1000,
    price: 200,
  },
];

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your custom design orders
          </p>
        </div>

        <div className="space-y-4">
          {mockOrders.map((order, index) => (
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
          ))}

          {mockOrders.length === 0 && (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Your custom design orders will appear here
              </p>
              <Button>Place Custom Order</Button>
            </Card>
          )}
        </div>
      </div>

      {selectedOrder && (
        <SupportChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          orderId={selectedOrder.id}
          orderTitle={selectedOrder.title}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onOpenChat }: { order: Order; onOpenChat: () => void }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (order.status === "started") {
      const calculateTimeRemaining = () => {
        const createdTime = new Date(order.createdAt).getTime();
        const deadline = createdTime + order.deliveryTime;
        const now = Date.now();
        const remaining = Math.max(0, deadline - now);
        setTimeRemaining(remaining);
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [order]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusConfig = () => {
    switch (order.status) {
      case "waiting":
        return {
          icon: AlertCircle,
          color: "from-yellow-500 to-orange-500",
          bgColor: "from-yellow-500/10 to-orange-500/10",
          borderColor: "border-yellow-500/20",
          label: "Waiting",
          badgeVariant: "secondary" as const,
        };
      case "started":
        return {
          icon: Clock,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/20",
          label: "In Progress",
          badgeVariant: "default" as const,
        };
      case "delivered":
        return {
          icon: CheckCircle2,
          color: "from-green-500 to-emerald-500",
          bgColor: "from-green-500/10 to-emerald-500/10",
          borderColor: "border-green-500/20",
          label: "Delivered",
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
              <h3 className="font-semibold text-lg">{order.title}</h3>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Order ID: <span className="font-mono">{order.id}</span></span>
                <span>•</span>
                <span>₹{order.price}</span>
                <span>•</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {order.status === "started" && timeRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-lg font-bold text-blue-500">
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="text-sm text-muted-foreground">remaining</span>
                </div>
              )}

              {order.status === "delivered" && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your design has been delivered! Check your downloads.
                </p>
              )}
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
          {order.status === "delivered" && (
            <Button size="sm">
              View Design
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
