"use client";

import { useState, useEffect, useMemo } from "react";
import { 
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
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Design {
  id: number;
  title: string;
  description?: string;
  category?: number | { name?: string; parent?: string; [key: string]: any };
  category_name?: string;
  parent_category_name?: string;
  price?: number;
  status: "pending" | "approved" | "rejected" | "active" | "draft";
  views?: number;
  downloads?: number;
  purchases?: number;
  created_at: string;
  updated_at?: string;
  product_number?: string;
  thumbnail?: string;
  media?: Array<{
    id: number;
    file?: string;
    file_url?: string;
    media_type?: string;
    [key: string]: any;
  }>;
  media_files?: any[]; // Keep for backward compatibility
  tags?: any[];
  rejection_reason?: string;
}

interface Category {
  id: number;
  name: string;
}

// Helper functions
const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat('en-IN').format(num);
};

const formatCurrency = (num: number | undefined): string => {
  if (num === undefined || num === null) return "Free";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const getTimeAgo = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
};

// Helper function to make absolute URL
const makeAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (apiBaseUrl && url.startsWith('/')) {
    return `${apiBaseUrl}${url}`;
  }
  if (apiBaseUrl && !url.startsWith('/')) {
    return `${apiBaseUrl}/${url}`;
  }
  return url;
};

// Helper function to get image URL from design, prioritizing JPG images
const getDesignImageUrl = (design: Design): string | null => {
  // Use media array (from ProductSerializer) or fallback to media_files
  const mediaArray = design.media || design.media_files || [];
  
  if (mediaArray.length === 0) {
    // Fallback to thumbnail if available
    if (design.thumbnail) {
      return makeAbsoluteUrl(design.thumbnail);
    }
    return null;
  }

  // First pass: Look for JPG/JPEG images
  for (const media of mediaArray) {
    if (media.media_type === 'image' || !media.media_type) {
      const url = media.url || media.file_url || media.file;
      if (url) {
        const urlLower = url.toLowerCase();
        // Check if it's a JPG/JPEG file
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
          return makeAbsoluteUrl(url);
        }
      }
    }
  }

  // Second pass: Get first image (any format)
  for (const media of mediaArray) {
    if (media.media_type === 'image' || !media.media_type) {
      const url = media.url || media.file_url || media.file;
      if (url) {
        return makeAbsoluteUrl(url);
      }
    }
  }

  // Fallback to thumbnail
  if (design.thumbnail) {
    return makeAbsoluteUrl(design.thumbnail);
  }

  return null;
};

export default function MyDesignsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedDesigns, setSelectedDesigns] = useState<Set<number>>(new Set());
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<Design | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories: Category[] = categoriesData || [];

  // Fetch designs
  const { data: designsData, isLoading, error } = useQuery({
    queryKey: ['myDesigns', currentPage, itemsPerPage, debouncedSearch, statusFilter, categoryFilter],
    queryFn: async () => {
      const response = await apiClient.getMyDesigns({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        search: debouncedSearch || undefined,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const designs: Design[] = designsData?.designs || [];
  const totalPages = designsData?.total_pages || 1;
  const totalCount = designsData?.total_count || 0;

  // Fetch design detail when selected
  const { data: designDetail } = useQuery({
    queryKey: ['designDetail', selectedDesign?.id],
    queryFn: async () => {
      if (!selectedDesign?.id) return null;
      const response = await apiClient.getDesignDetail(selectedDesign.id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.design;
    },
    enabled: !!selectedDesign?.id,
  });

  const canDelete = (design: Design) => {
    // Cannot delete active designs
    if (design.status === "active") return false;
    // Can delete pending, rejected, draft
    if (design.status === "pending" || design.status === "rejected" || design.status === "draft") return true;
    // Can delete approved if no purchases
    if (design.status === "approved" && (design.purchases || 0) === 0) return true;
    return false;
  };

  const canEdit = (design: Design) => {
    // Cannot edit active designs
    if (design.status === "active") return false;
    // Can edit pending, rejected, draft
    return design.status === "pending" || design.status === "rejected" || design.status === "draft";
  };

  const toggleSelectDesign = (id: number) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDesigns(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDesigns.size === designs.length) {
      setSelectedDesigns(new Set());
    } else {
      setSelectedDesigns(new Set(designs.map(d => d.id)));
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleDelete = async (design: Design) => {
    try {
      const response = await apiClient.deleteDesign(design.id);
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Design deleted",
        description: "Design has been deleted successfully.",
      });

      // Invalidate queries to refresh list
      await queryClient.invalidateQueries({ queryKey: ['myDesigns'] });
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
      if (selectedDesign?.id === design.id) {
        setSelectedDesign(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete design",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (design: Design) => {
    if (!canEdit(design)) {
      toast({
        title: "Cannot edit design",
        description: design.status === "active" 
          ? "Active designs cannot be edited. Contact admin for changes."
          : "This design cannot be edited.",
        variant: "destructive",
      });
      return;
    }
    // Navigate to edit page
    window.location.href = `/designer-console/designs/${design.id}/edit`;
  };

  // Sort designs client-side (backend already sorts by created_at)
  const sortedDesigns = useMemo(() => {
    if (!sortColumn) return designs;
    
    return [...designs].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortColumn) {
        case "title":
          aValue = a.title || "";
          bValue = b.title || "";
          break;
        case "views":
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case "downloads":
          aValue = a.downloads || 0;
          bValue = b.downloads || 0;
          break;
        case "purchases":
          aValue = a.purchases || 0;
          bValue = b.purchases || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
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
  }, [designs, sortColumn, sortDirection]);

  return (
    <div className="p-6">
      {/* Top Area */}
      <div className="mb-6">
        <div className="flex items-center justify-end mb-4">
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
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
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
          
          {["All", "pending", "approved", "rejected"].map((status) => {
            const isActive = status === "All" ? !statusFilter : statusFilter === status;
            return (
              <Badge
                key={status}
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(status === "All" ? null : status)}
              >
                {status === "All" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            );
          })}

          {categories.slice(0, 5).map((category) => (
            <Badge
              key={category.id}
              variant={categoryFilter === category.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(categoryFilter === category.id ? null : category.id)}
            >
              {category.name}
            </Badge>
          ))}

          {(statusFilter || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter(null);
                setCategoryFilter(null);
                setCurrentPage(1);
              }}
              className="gap-1 h-6 px-2"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold mb-2">Error loading designs</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load designs'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['myDesigns'] })}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && sortedDesigns.length === 0 && (
        <Card className="p-12 text-center">
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No designs found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter || categoryFilter
              ? "Try adjusting your filters"
              : "No designs found. Use the navigation menu to upload your first design."}
          </p>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && !error && sortedDesigns.length > 0 && viewMode === "grid" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedDesigns.map((design) => {
              const imageUrl = getDesignImageUrl(design);
              return (
                <Card
                  key={design.id}
                  className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden relative"
                  onClick={() => setSelectedDesign(design)}
                >
                  <div className="relative">
                    {/* Colored Edge based on status */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      design.status === "approved" || design.status === "active" ? "bg-green-500" :
                      design.status === "pending" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-purple-500/20 relative">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={design.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'placeholder w-full h-full flex items-center justify-center';
                              placeholder.innerHTML = '<svg class="w-12 h-12 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Upload className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button size="sm" variant="secondary" onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedDesign(design);
                        }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit(design) && (
                          <Button size="sm" variant="secondary" onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEdit(design);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(design) && (
                          <Button size="sm" variant="destructive" onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setDesignToDelete(design);
                            setDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{design.title}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center justify-between">
                        <span>
                          {design.parent_category_name ? 
                            `${design.parent_category_name} / ${design.category_name || '—'}` : 
                            (design.category_name || 'Uncategorized')}
                        </span>
                      <span className="font-semibold text-foreground">{formatCurrency(design.price)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={design.status === "approved" || design.status === "active" ? "default" : design.status === "pending" ? "secondary" : "destructive"}
                      className="mb-3 text-xs"
                    >
                      {design.status?.charAt(0).toUpperCase() + design.status?.slice(1) || 'Unknown'}
                    </Badge>

                    {/* Stats Footer */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatNumber(design.views)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {formatNumber(design.downloads)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {formatNumber(design.purchases)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination for Grid View */}
          {sortedDesigns.length > 0 && (
            <div className="flex items-center justify-between mt-6 p-4 border-t border-border">
              <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} designs
              </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPages > 1 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              )}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {!isLoading && !error && sortedDesigns.length > 0 && viewMode === "list" && (
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
                  <th className="p-3 w-16 text-center">Sr No</th>
                  <th className="p-3">Design</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subcategory</th>
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
                  <th className="p-3 cursor-pointer hover:text-primary" onClick={() => handleSort("created_at")}>
                    Uploaded {sortColumn === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesigns.map((design, index) => {
                  const imageUrl = getDesignImageUrl(design);
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
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
                      <td className="p-3 text-center text-sm text-muted-foreground font-medium">
                        {serialNumber}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0 overflow-hidden">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={design.title} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'placeholder w-full h-full flex items-center justify-center';
                                    placeholder.innerHTML = '<svg class="w-6 h-6 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Upload className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{design.title}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(design.price)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {(() => {
                          // If parent_category_name exists, it's a subcategory - show parent as category
                          if (design.parent_category_name) {
                            return design.parent_category_name;
                          }
                          // Otherwise, show category_name as the category
                          if (design.category_name) {
                            return design.category_name;
                          }
                          // Fallback to nested category object
                          if (design.category && typeof design.category === 'object') {
                            // If category has a parent (string), it's a subcategory
                            if (design.category.parent) {
                              return design.category.parent;
                            }
                            return design.category.name;
                          }
                          return 'Uncategorized';
                        })()}
                      </td>
                      <td className="p-3 text-sm">
                        {(() => {
                          // If parent_category_name exists, show category_name as subcategory
                          if (design.parent_category_name) {
                            return design.category_name || '—';
                          }
                          // If category object has a parent, show category name as subcategory
                          if (design.category && typeof design.category === 'object' && design.category.parent) {
                            return design.category.name || '—';
                          }
                          return '—';
                        })()}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={design.status === "approved" || design.status === "active" ? "default" : design.status === "pending" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {design.status?.charAt(0).toUpperCase() + design.status?.slice(1) || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{formatNumber(design.views)}</td>
                      <td className="p-3 text-sm">{formatNumber(design.downloads)}</td>
                      <td className="p-3 text-sm font-medium">{formatNumber(design.purchases)}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {design.created_at ? getTimeAgo(design.created_at) : 'N/A'}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              disabled={!canEdit(design)}
                              onClick={() => canEdit(design) && handleEdit(design)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDesign(design)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={!canDelete(design)}
                              onClick={() => {
                                if (canDelete(design)) {
                                  setDesignToDelete(design);
                                  setDeleteDialogOpen(true);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} designs
            </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {totalPages > 1 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            )}
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
          {selectedDesign && (designDetail || selectedDesign) && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>{(designDetail || selectedDesign).title}</SheetTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={(designDetail || selectedDesign).status === "approved" || (designDetail || selectedDesign).status === "active" ? "default" : (designDetail || selectedDesign).status === "pending" ? "secondary" : "destructive"}
                  >
                    {(designDetail || selectedDesign).status?.charAt(0).toUpperCase() + (designDetail || selectedDesign).status?.slice(1) || 'Unknown'}
                  </Badge>
                  {(designDetail || selectedDesign).product_number && (
                    <span className="text-sm text-muted-foreground">ID: {(designDetail || selectedDesign).product_number}</span>
                  )}
                </div>
              </SheetHeader>

              {/* Image Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg mb-6 overflow-hidden">
                {getDesignImageUrl(designDetail || selectedDesign) ? (
                  <img 
                    src={getDesignImageUrl(designDetail || selectedDesign) || ''} 
                    alt={(designDetail || selectedDesign).title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder w-full h-full flex items-center justify-center';
                        placeholder.innerHTML = '<svg class="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2 font-medium">
                        {(designDetail || selectedDesign).parent_category_name || 
                         ((designDetail || selectedDesign).category_name && !(designDetail || selectedDesign).parent_category_name ? (designDetail || selectedDesign).category_name : null) ||
                         (((designDetail || selectedDesign).category && typeof (designDetail || selectedDesign).category === 'object' && !(designDetail || selectedDesign).category.parent) ? (designDetail || selectedDesign).category.name : null) ||
                         'Uncategorized'}
                      </span>
                    </div>
                    {(designDetail || selectedDesign).parent_category_name && (
                      <div>
                        <span className="text-muted-foreground">Subcategory:</span>
                        <span className="ml-2 font-medium">
                          {(designDetail || selectedDesign).category_name || 
                           ((designDetail || selectedDesign).category && typeof (designDetail || selectedDesign).category === 'object' ? (designDetail || selectedDesign).category.name : null) ||
                           '—'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2 font-medium">{formatCurrency((designDetail || selectedDesign).price)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span className="ml-2">{(designDetail || selectedDesign).created_at ? getTimeAgo((designDetail || selectedDesign).created_at) : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Versions:</span>
                      <span className="ml-2">{((designDetail || selectedDesign).media || (designDetail || selectedDesign).media_files)?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {(designDetail || selectedDesign).description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{(designDetail || selectedDesign).description}</p>
                  </div>
                )}

                {((designDetail || selectedDesign).tags && (designDetail || selectedDesign).tags!.length > 0) && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex gap-2 flex-wrap">
                      {((designDetail || selectedDesign).tags || []).map((tag: any) => (
                        <Badge key={tag.id || tag} variant="outline">{tag.name || tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Files Section */}
                <div>
                  <h3 className="font-semibold mb-3">Media Files</h3>
                  <div className="space-y-3">
                    {((designDetail || selectedDesign).media_files || (designDetail || selectedDesign).media || []).length > 0 ? (
                      ((designDetail || selectedDesign).media_files || (designDetail || selectedDesign).media || []).map((media: any, index: number) => {
                        const fileUrl = media.url || media.file || media.file_url;
                        const fileName = media.file_name || '';
                        const fileNameLower = fileName.toLowerCase();
                        const isImage = fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.gif') || fileNameLower.endsWith('.webp');
                        const isMockup = media.is_mockup || fileNameLower.includes('mockup');
                        const fileType = fileNameLower.split('.').pop()?.toUpperCase() || 'FILE';
                        
                        // Build absolute URL
                        const absoluteUrl = makeAbsoluteUrl(fileUrl);
                        
                        return (
                          <div key={media.id || index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                            {isImage && absoluteUrl ? (
                              <div 
                                className="w-16 h-16 rounded border border-border overflow-hidden bg-background flex-shrink-0 relative group cursor-pointer"
                                onClick={() => setPreviewImageUrl(absoluteUrl)}
                              >
                                <img 
                                  src={absoluteUrl} 
                                  alt={fileName || `File ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded border border-border bg-background flex items-center justify-center flex-shrink-0">
                                <Download className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{fileName || `File ${index + 1}`}</span>
                                {isMockup && (
                                  <Badge variant="secondary" className="text-xs">Mockup</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{fileType}</Badge>
                                {media.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {(media.file_size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                            {absoluteUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = absoluteUrl;
                                  link.download = fileName || `file.${fileType.toLowerCase()}`;
                                  link.target = '_blank';
                                  link.click();
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No media files uploaded yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{formatNumber((designDetail || selectedDesign).views)}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Download className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{formatNumber((designDetail || selectedDesign).downloads)}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-2xl font-bold">{formatNumber((designDetail || selectedDesign).purchases)}</div>
                      <div className="text-xs text-muted-foreground">Purchases</div>
                    </div>
                  </div>
                </div>

                {((designDetail || selectedDesign).rejection_reason || (designDetail || selectedDesign).status === "rejected") && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <h3 className="font-semibold mb-2 text-destructive">Admin Review Comments</h3>
                    <p className="text-sm">{(designDetail || selectedDesign).rejection_reason || 'Design was rejected. Please review and resubmit.'}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Activity Log</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <p>Design uploaded</p>
                        <p className="text-xs text-muted-foreground">{(designDetail || selectedDesign).created_at ? getTimeAgo((designDetail || selectedDesign).created_at) : 'N/A'}</p>
                      </div>
                    </div>
                    {((designDetail || selectedDesign).status === "approved" || (designDetail || selectedDesign).status === "active") && (
                      <div className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p>Design approved</p>
                          <p className="text-xs text-muted-foreground">{(designDetail || selectedDesign).updated_at ? getTimeAgo((designDetail || selectedDesign).updated_at) : 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  {(designDetail || selectedDesign).status === "rejected" && (
                    <Button className="flex-1">Request Re-review</Button>
                  )}
                  {canEdit(selectedDesign) && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(selectedDesign)}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete(selectedDesign) && (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        setDesignToDelete(selectedDesign);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{designToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDesignToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => designToDelete && handleDelete(designToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex items-center justify-center bg-muted/30">
            {previewImageUrl && (
              <img 
                src={previewImageUrl} 
                alt="Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

