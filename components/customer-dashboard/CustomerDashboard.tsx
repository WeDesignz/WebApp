"use client";

import { useState } from "react";
import CustomerDashboardSidebar from "./CustomerDashboardSidebar";
import CustomerDashboardTopBar from "./CustomerDashboardTopBar";
import CustomerDashboardContent from "./CustomerDashboardContent";
import CartDrawer from "./CartDrawer";

export default function CustomerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CustomerDashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <CustomerDashboardTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenCart={() => setCartDrawerOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <CustomerDashboardContent
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        </main>
      </div>

      <CartDrawer 
        isOpen={cartDrawerOpen} 
        onClose={() => setCartDrawerOpen(false)} 
      />
    </div>
  );
}
