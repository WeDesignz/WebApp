"use client";

import { useState } from "react";
import { 
  Upload, 
  Search, 
  Grid3x3, 
  List, 
  Filter,
  Eye,
  Download,
  ShoppingCart,
  Edit,
  Trash2,
  MoreVertical,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

type Design = {
  id: string;
  thumbnail: string;
  title: string;
  category: string;
  price: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  views: number;
  downloads: number;
  purchases: number;
  uploadedDate: string;
  uploadId: string;
  tags: string[];
  fileVersions: number;
  reviewComments?: string;
};

export default function MyDesignsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedDesigns, setSelectedDesigns] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof Design | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const mockDesigns: Design[] = [
    { id: "1", uploadId: "WD000123", thumbnail: "", title: "Modern Logo Design", category: "Logo", price: "₹999", status: "APPROVED", views: 145, downloads: 23, purchases: 5, uploadedDate: "2 days ago", tags: ["modern", "minimal"], fileVersions: 2 },
    { id: "2", uploadId: "WD000124", thumbnail: "", title: "Business Card Template", category: "Print", price: "₹499", status: "PENDING", views: 89, downloads: 0, purchases: 0, uploadedDate: "3 days ago", tags: ["business", "corporate"], fileVersions: 1 },
    { id: "3", uploadId: "WD000125", thumbnail: "", title: "Social Media Pack", category: "Social Media", price: "₹1499", status: "APPROVED", views: 234, downloads: 45, purchases: 12, uploadedDate: "5 days ago", tags: ["social", "instagram"], fileVersions: 3 },
    { id: "4", uploadId: "WD000126", thumbnail: "", title: "Web UI Kit", category: "UI/UX", price: "₹2999", status: "REJECTED", views: 67, downloads: 0, purchases: 0, uploadedDate: "1 week ago", tags: ["web", "ui"], fileVersions: 1, reviewComments: "Low resolution assets. Please re-upload with higher quality." },
    { id: "5", uploadId: "WD000127", thumbnail: "", title: "Poster Design", category: "Print", price: "₹799", status: "APPROVED", views: 178, downloads: 34, purchases: 8, uploadedDate: "1 week ago", tags: ["poster", "event"], fileVersions: 2 },
    { id: "6", uploadId: "WD000128", thumbnail: "", title: "Icon Set", category: "Icons", price: "₹599", status: "PENDING", views: 92, downloads: 0, purchases: 0, uploadedDate: "2 weeks ago", tags: ["icons", "minimal"], fileVersions: 1 },
  ];

  const canDelete = (design: Design) => {
    if (design.status === "PENDING" || design.status === "REJECTED") return true;
    if (design.status === "APPROVED" && design.purchases === 0) return true;
    return false;
  };

  const canEdit = (design: Design) => {
    return design.status === "PENDING" || design.status === "REJECTED";
  };

  const toggleSelectDesign = (id: string) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDesigns(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDesigns.size === mockDesigns.length) {
      setSelectedDesigns(new Set());
    } else {
      setSelectedDesigns(new Set(mockDesigns.map(d => d.id)));
    }
  };

  const handleSort = (column: keyof Design) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Filter and sort designs
  const filteredDesigns = mockDesigns.filter((design) => {
    // Search filter
    if (searchQuery && !design.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !design.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter && statusFilter !== "All") {
      if (design.status.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
    }
    
    // Category filter
    if (categoryFilter && design.category !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  // Sort designs
  const sortedDesigns = [...filteredDesigns].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  return (
    <div className="p-6">
      {/* Top Area */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Design
          </Button>

          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
          
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <Badge
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            >
              {status}
            </Badge>
          ))}

          {["Logo", "Print", "UI/UX", "Icons", "Social Media"].map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
            >
              {category}
            </Badge>
          ))}

          {(statusFilter || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter(null);
                setCategoryFilter(null);
              }}
              className="gap-1 h-6 px-2"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedDesigns.map((design) => (
            <Card
              key={design.id}
              className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden relative"
              onClick={() => setSelectedDesign(design)}
            >
              <div className="relative">
                {/* Colored Edge based on status */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  design.status === "APPROVED" ? "bg-green-500" :
                  design.status === "PENDING" ? "bg-yellow-500" :
                  "bg-red-500"
                }`} />
                
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-purple-500/20 relative">
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button size="sm" variant="secondary" onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedDesign(design);
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canEdit(design) && (
                      <Button size="sm" variant="secondary" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete(design) && (
                      <Button size="sm" variant="destructive" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{design.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{design.category}</span>
                  <span className="font-semibold text-foreground">{design.price}</span>
                </div>
                <Badge
                  variant={design.status === "APPROVED" ? "default" : design.status === "PENDING" ? "secondary" : "destructive"}
                  className="mb-3 text-xs"
                >
                  {design.status}
                </Badge>

                {/* Stats Footer */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {design.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {design.downloads}
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {design.purchases}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-left text-sm border-b border-border">
                  <th className="p-3 w-12">
                    <Checkbox
                      checked={selectedDesigns.size === sortedDesigns.length && sortedDesigns.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3">Design</th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("category")}>
                    Category {sortColumn === "category" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("status")}>
                    Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("views")}>
                    Views {sortColumn === "views" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("downloads")}>
                    Downloads {sortColumn === "downloads" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("purchases")}>
                    Purchases {sortColumn === "purchases" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("uploadedDate")}>
                    Uploaded {sortColumn === "uploadedDate" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesigns.map((design) => (
                  <tr
                    key={design.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedDesign(design)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDesigns.has(design.id)}
                        onCheckedChange={() => toggleSelectDesign(design.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{design.title}</div>
                          <div className="text-xs text-muted-foreground">{design.price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{design.category}</td>
                    <td className="p-3">
                      <Badge
                        variant={design.status === "APPROVED" ? "default" : design.status === "PENDING" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {design.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{design.views}</td>
                    <td className="p-3 text-sm">{design.downloads}</td>
                    <td className="p-3 text-sm font-medium">{design.purchases}</td>
                    <td className="p-3 text-sm text-muted-foreground">{design.uploadedDate}</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={!canEdit(design)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={!canDelete(design)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {design.status === "APPROVED" && design.purchases === 0 ? "Soft Delete" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing 1-{sortedDesigns.length} of {sortedDesigns.length} designs
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedDesigns.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 z-40">
          <span className="font-medium">{selectedDesigns.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">Change Category</Button>
            <Button size="sm" variant="secondary">Download Metadata</Button>
            <Button size="sm" variant="destructive">Delete Selected</Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedDesigns(new Set())}
            className="hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Design Detail Slide-over */}
      <Sheet open={!!selectedDesign} onOpenChange={() => setSelectedDesign(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedDesign && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>{selectedDesign.title}</SheetTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedDesign.status === "APPROVED" ? "default" : selectedDesign.status === "PENDING" ? "secondary" : "destructive"}
                  >
                    {selectedDesign.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">ID: {selectedDesign.uploadId}</span>
                </div>
              </SheetHeader>

              {/* Image Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg mb-6" />

              {/* Metadata */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2 font-medium">{selectedDesign.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2 font-medium">{selectedDesign.price}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span className="ml-2">{selectedDesign.uploadedDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Versions:</span>
                      <span className="ml-2">{selectedDesign.fileVersions}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedDesign.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{selectedDesign.views}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Download className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{selectedDesign.downloads}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{selectedDesign.purchases}</div>
                      <div className="text-xs text-muted-foreground">Purchases</div>
                    </div>
                  </div>
                </div>

                {selectedDesign.reviewComments && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <h3 className="font-semibold mb-2 text-destructive">Admin Review Comments</h3>
                    <p className="text-sm">{selectedDesign.reviewComments}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Activity Log</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <p>Design uploaded</p>
                        <p className="text-xs text-muted-foreground">{selectedDesign.uploadedDate}</p>
                      </div>
                    </div>
                    {selectedDesign.status === "APPROVED" && (
                      <div className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p>Design approved</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  {selectedDesign.status === "REJECTED" && (
                    <Button className="flex-1">Request Re-review</Button>
                  )}
                  <Button variant="outline" className="flex-1">Duplicate</Button>
                  <Button variant="outline" className="flex-1">Export</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
