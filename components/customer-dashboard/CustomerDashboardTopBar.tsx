"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Menu, User, Settings, LifeBuoy, CreditCard, LogOut, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartWishlist } from "@/contexts/CartWishlistContext";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCart: () => void;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "jerseys", label: "Jerseys" },
  { value: "vectors", label: "Vectors" },
  { value: "psd", label: "PSD Files" },
  { value: "icons", label: "Icons" },
  { value: "mockups", label: "Mockups" },
  { value: "illustrations", label: "Illustrations" },
  { value: "3d-models", label: "3D Models" },
];

export default function CustomerDashboardTopBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCart,
}: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getCartCount, getWishlistCount } = useCartWishlist();

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
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 flex items-center gap-3 max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search designs, vectors, mockups..."
              className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-48 h-12 rounded-full hidden sm:flex">
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
        </div>

        <a 
          href="/customer-dashboard/wishlist"
          className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex"
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
          className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex"
        >
          <ShoppingCart className="w-6 h-6" />
          {getCartCount() > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
              {getCartCount()}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <User className="w-5 h-5 text-primary-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-border">
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-muted-foreground">john@example.com</p>
              </div>
              <div className="p-2">
                <a
                  href="/customer-dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile / Account</span>
                </a>
                <a
                  href="/customer-dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Theme</span>
                </a>
                <a
                  href="/customer-dashboard/support"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span className="text-sm">Support</span>
                </a>
                <a
                  href="/customer-dashboard/plans"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Subscription / Plans</span>
                </a>
              </div>
              <div className="p-2 border-t border-border">
                <button className="flex items-center gap-3 px-4 py-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
