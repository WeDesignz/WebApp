"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Menu, User, LogOut, ShoppingCart, Heart, UserPlus, LogIn, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { DashboardView } from "./CustomerDashboard";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import { useRouter } from "next/navigation";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCart: () => void;
  onViewChange: (view: DashboardView) => void;
  onOpenLogout: () => void;
  onOpenLens?: () => void;
}

export default function CustomerDashboardTopBar({
  searchQuery,
  onSearchChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCart,
  onViewChange,
  onOpenLogout,
  onOpenLens,
}: TopBarProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getCartCount, getWishlistCount } = useCartWishlist();

  const handleAuthRequiredAction = (action: () => void) => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    action();
  };

  // Debounce search input (300ms) - update parent after debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Sync local state with prop when it changes externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-card border-b border-border p-4 sticky top-0 z-30">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left Side - Mobile Menu & Search Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search designs, vectors, mockups..."
              className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {onOpenLens && (
              <button
                onClick={onOpenLens}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                title="Search by image"
              >
                <Camera className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Invite Freelancers, Notifications, Wishlist, Cart, Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Invite Freelancers Button */}
          <div className="hidden md:flex">
            <Button size="lg" className="whitespace-nowrap" disabled>
              <UserPlus className="w-5 h-5 mr-2" />
              + Invite Freelancers
            </Button>
          </div>

          {/* Notifications - only show if authenticated */}
          {isAuthenticated && <NotificationDropdown />}

          <button 
            onClick={() => handleAuthRequiredAction(() => onViewChange("wishlist"))}
            className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex flex-shrink-0"
            title="Wishlist"
          >
            <Heart className="w-6 h-6" />
            {isAuthenticated && getWishlistCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                {getWishlistCount()}
              </span>
            )}
          </button>

          <button 
            onClick={() => handleAuthRequiredAction(onOpenCart)}
            className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex flex-shrink-0"
            title="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {isAuthenticated && getCartCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                {getCartCount()}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <User className="w-5 h-5 text-primary-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-border">
                    <p className="font-semibold">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onViewChange("profile");
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors w-full text-left"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Profile</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={() => {
                        onOpenLogout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => {
                const currentPath = window.location.pathname + window.location.search;
                router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
              }}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
