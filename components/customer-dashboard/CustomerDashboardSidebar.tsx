"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Download,
  Grid3x3,
  Users,
  HelpCircle,
  Bell,
  MessageCircle,
  Moon,
  Sun,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/customer-dashboard", active: true },
  { icon: Download, label: "My Downloads", href: "/customer-dashboard/downloads" },
  { icon: Grid3x3, label: "Categories", href: "/customer-dashboard/categories" },
  { icon: Users, label: "Freelancers", href: "/customer-dashboard/freelancers" },
  { icon: HelpCircle, label: "Support", href: "/customer-dashboard/support" },
];

export default function CustomerDashboardSidebar({ collapsed, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [hovering, setHovering] = useState(false);

  const isExpanded = !collapsed || hovering;

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
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">W</span>
                </div>
                <span className="font-display font-bold text-xl">WeDesignz</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mx-auto"
              >
                <span className="text-primary-foreground font-bold text-xl">W</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                item.active
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
            </a>
          ))}

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
                <Button size="sm" className="w-full">
                  Order Now
                </Button>
              </Card>
            </motion.div>
          )}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
            title="Notifications"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">Notifications</span>}
          </button>
          
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors w-full"
            title="Support"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">Help & Support</span>}
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
            {theme === "dark" ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {isExpanded && <span className="text-sm">Theme</span>}
          </button>
        </div>

        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-40 flex justify-around">
        {menuItems.slice(0, 5).map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
              item.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </>
  );
}
