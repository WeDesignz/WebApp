"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutModal from "./LogoutModal";
import DesignerNotificationDropdown from "./DesignerNotificationDropdown";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur">
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
          {/* Notifications */}
          <DesignerNotificationDropdown />

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
