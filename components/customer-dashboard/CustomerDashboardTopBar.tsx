"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Menu, User, Shield, LogOut, ShoppingCart, Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { DashboardView } from "./CustomerDashboard";
import { useQuery } from "@tanstack/react-query";
import { catalogAPI } from "@/lib/api";
import { transformCategories } from "@/lib/utils/transformers";
import { useAuth } from "@/contexts/AuthContext";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCart: () => void;
  onViewChange: (view: DashboardView) => void;
  onOpenLogout: () => void;
}

export default function CustomerDashboardTopBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCart,
  onViewChange,
  onOpenLogout,
}: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getCartCount, getWishlistCount } = useCartWishlist();
  const { user } = useAuth();

  // Fetch categories from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await catalogAPI.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return transformCategories(response.data?.categories || []);
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Build categories list with "All Categories" option
  const categories = [
    { value: "all", label: "All Categories" },
    ...(categoriesData || []).map(cat => ({
      value: cat.id,
      label: cat.title,
    })),
  ];

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
      <div className="flex items-center w-full">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors mr-2"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar - 40% width */}
        <div className="relative" style={{ width: '40%' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search designs, vectors, mockups..."
            className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Spacing - 10% */}
        <div style={{ width: '10%' }} className="hidden md:block" />

        {/* Invite Freelancers Button - 15% width */}
        <div style={{ width: '15%' }} className="hidden md:flex justify-center">
          <Button size="lg" className="whitespace-nowrap w-full">
            <UserPlus className="w-5 h-5 mr-2" />
            + Invite Freelancers
          </Button>
        </div>

        {/* Spacing - 10% */}
        <div style={{ width: '10%' }} className="hidden md:block" />

        {/* Right End - 25% width: Categories, Wishlist, Cart, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end" style={{ width: '25%' }}>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 rounded-full hidden sm:flex" style={{ minWidth: '140px', maxWidth: '100%' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <a 
            href="/customer-dashboard/wishlist"
            className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex flex-shrink-0"
            title="Wishlist"
          >
            <Heart className="w-6 h-6" />
            {getWishlistCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                {getWishlistCount()}
              </span>
            )}
          </a>

          <button 
            onClick={onOpenCart}
            className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex flex-shrink-0"
            title="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {getCartCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                {getCartCount()}
              </span>
            )}
          </button>

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
                  <button
                    onClick={() => {
                      onViewChange("accounts");
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors w-full text-left"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Accounts</span>
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
        </div>
      </div>
    </header>
  );
}
