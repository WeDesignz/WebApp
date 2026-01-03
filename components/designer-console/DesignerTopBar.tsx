"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Fetch user profile to get profile image
  const { data: userProfileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const profileImageUrl = userProfileData?.profile_photo_url;
  const userInitials = user 
    ? (user.firstName?.charAt(0) && user.lastName?.charAt(0)
        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
        : user.firstName?.charAt(0)?.toUpperCase() || user.lastName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U')
    : 'U';

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
              <Avatar className="w-8 h-8">
                <AvatarImage src={profileImageUrl || undefined} alt={user?.firstName || user?.username || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
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
