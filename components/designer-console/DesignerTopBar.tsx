"use client";

import { Bell, ChevronDown, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDesignerVerification } from "@/contexts/DesignerVerificationContext";
import { Badge } from "@/components/ui/badge";
import LogoutModal from "./LogoutModal";

interface DesignerTopBarProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
}

export default function DesignerTopBar({ 
  title = "Designer Console",
  subtitle = "Manage your designs and track performance",
  breadcrumb = "Console"
}: DesignerTopBarProps) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { verificationStatus, setVerificationStatus, isVerified } = useDesignerVerification();
  
  const notifications = [
    { id: 1, text: "Design 'Modern Logo' was approved", time: "2h ago" },
    { id: 2, text: "₹500 credited to your wallet", time: "5h ago" },
    { id: 3, text: "New message from support", time: "1d ago" },
  ];

  const toggleVerification = () => {
    if (verificationStatus === 'pending') {
      setVerificationStatus('approved');
    } else {
      setVerificationStatus('pending');
    }
  };

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
          <Button
            onClick={toggleVerification}
            variant={isVerified ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {isVerified ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden md:inline">Verified</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">DEV</Badge>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden md:inline">Pending</span>
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">DEV</Badge>
              </>
            )}
          </Button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              onBlur={() => setTimeout(() => setNotificationsOpen(false), 200)}
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">3 new</span>
                </div>
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                    <p className="text-sm">{notif.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-sm" onClick={() => setNotificationsOpen(false)}>
                  View All Notifications
                </Button>
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
