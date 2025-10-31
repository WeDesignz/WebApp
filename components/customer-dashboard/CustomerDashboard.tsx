"use client";

import { useState } from "react";
import CustomerDashboardSidebar from "./CustomerDashboardSidebar";
import CustomerDashboardTopBar from "./CustomerDashboardTopBar";
import CustomerDashboardContent from "./CustomerDashboardContent";

export default function CustomerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CustomerDashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <CustomerDashboardTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <CustomerDashboardContent
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        </main>
      </div>
    </div>
  );
}
