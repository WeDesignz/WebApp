"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Download,
  HelpCircle,
  Bell,
  MessageCircle,
  Moon,
  Sun,
  Zap,
  ShoppingBag,
  CreditCard,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CustomOrderModal from "@/components/customer-dashboard/CustomOrderModal";
import { DashboardView, PUBLIC_VIEWS } from "./CustomerDashboard";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const menuItems: { icon: any; label: string; view: DashboardView }[] = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
  { icon: Download, label: "My Downloads", view: "downloads" },
  { icon: FileText, label: "Download Mock PDF", view: "downloadMockPDF" },
  { icon: ShoppingBag, label: "My Orders", view: "orders" },
  { icon: CreditCard, label: "Plans & Subscription", view: "plans" },
  { icon: HelpCircle, label: "Support", view: "support" },
];

export default function CustomerDashboardSidebar({ collapsed, onToggle, mobileMenuOpen, onMobileMenuClose, activeView, onViewChange }: SidebarProps) {
  const { isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [hovering, setHovering] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isExpanded = !collapsed || hovering;

  // Filter menu items based on authentication
  const visibleMenuItems = menuItems.filter(item => {
    // If authenticated, show all items
    if (isAuthenticated) return true;
    // If not authenticated, only show public items
    return PUBLIC_VIEWS.includes(item.view);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOrderPlaced = (orderId: string) => {
    onViewChange("orders");
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 280 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="hidden md:flex flex-col bg-card border-r border-border h-full relative"
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <img 
                  src="/Logos/ONLY LOGO.png" 
                  alt="WeDesign Logo" 
                  className={`h-10 w-10 ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
                />
                <img 
                  src="/Logos/ONLY TEXT.png" 
                  alt="WeDesign" 
                  className={`h-6 w-auto ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
                />
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center mx-auto"
              >
                <img 
                  src="/Logos/ONLY LOGO.png" 
                  alt="WeDesign Logo" 
                  className={`h-10 w-10 ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onViewChange(item.view);
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Card className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-sm">Custom Design</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Get your custom design delivered in just 1 hour!
                </p>
                <Button size="sm" className="w-full" onClick={() => setCustomOrderOpen(true)}>
                  Order Now
                </Button>
              </Card>
            </motion.div>
          )}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => onViewChange("notifications")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
              activeView === "notifications"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">Notifications</span>}
          </button>
          
          <button
            onClick={() => onViewChange("faq")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
              activeView === "faq"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            title="FAQ"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">FAQ</span>}
          </button>
          
          <a
            href="https://chat.whatsapp.com/your-community-link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
            title="WhatsApp Community"
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">WhatsApp</span>}
          </a>
          
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
            title="Toggle Theme"
          >
            {!mounted ? (
              <div className="w-5 h-5 flex-shrink-0" />
            ) : theme === "dark" ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {isExpanded && <span className="text-sm">Theme</span>}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileMenuClose}
              className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 overflow-y-auto"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <img 
                    src="/Logos/ONLY LOGO.png" 
                    alt="WeDesign Logo" 
                    className={`h-10 w-10 ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
                  />
                  <img 
                    src="/Logos/ONLY TEXT.png" 
                    alt="WeDesign" 
                    className={`h-6 w-auto ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
                  />
                </div>
              </div>

              <nav className="flex-1 p-3 space-y-2">
                {visibleMenuItems.map((item) => {
                  const isActive = activeView === item.view;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        onViewChange(item.view);
                        onMobileMenuClose();
                      }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {isAuthenticated && (
                  <Card className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-sm">Custom Design</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get your custom design delivered in just 1 hour!
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => {
                      setCustomOrderOpen(true);
                      onMobileMenuClose();
                    }}
                  >
                    Order Now
                  </Button>
                </Card>
                )}
              </nav>

              <div className="p-3 border-t border-border space-y-2">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      onViewChange("notifications");
                      onMobileMenuClose();
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                      activeView === "notifications"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Bell className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Notifications</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onViewChange("faq");
                    onMobileMenuClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                    activeView === "faq"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <HelpCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">FAQ</span>
                </button>
                
                <a
                  href="https://chat.whatsapp.com/your-community-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
                  onClick={onMobileMenuClose}
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">WhatsApp</span>
                </a>
                
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    onMobileMenuClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
                >
                  {!mounted ? (
                    <div className="w-5 h-5 flex-shrink-0" />
                  ) : theme === "dark" ? (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">Theme</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-40 flex justify-around">
        {visibleMenuItems.slice(0, 5).map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>

      <CustomOrderModal
        open={customOrderOpen}
        onClose={() => setCustomOrderOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />
    </>
  );
}
