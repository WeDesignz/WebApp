"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  Gift,
  FileText,
  Grid3x3,
  List,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProducts, type TransformedProduct } from "@/lib/utils/transformers";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductModal from "@/components/customer-dashboard/ProductModal";

type Product = TransformedProduct;
type SelectionMode = "firstN" | "selected";

function DownloadMockPDFPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection mode: "firstN" or "selected"
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("firstN");
  
  // Selected designs (only for "selected" mode)
  const [selectedDesignIds, setSelectedDesignIds] = useState<Set<number>>(new Set());
  
  // PDF config and eligibility
  const [pdfConfig, setPdfConfig] = useState<{
    free_pdf_designs_count: number;
    paid_pdf_designs_options: number[];
    pricing: {
      first_n_per_design: number;
      selected_per_design: number;
    };
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isAuthenticated = !!user;
  const freeDesignsCount = pdfConfig?.free_pdf_designs_count || 50;

  // Fetch PDF configuration
  const { data: configData } = useQuery({
    queryKey: ['pdfConfig'],
    queryFn: async () => {
      const response = await apiClient.getPDFConfig();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (configData) {
      setPdfConfig(configData);
    }
  }, [configData]);

  // Check eligibility
  const { data: eligibilityData } = useQuery({
    queryKey: ['pdfEligibility'],
    queryFn: async () => {
      const response = await apiClient.checkPDFEligibility();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const isEligible = eligibilityData?.is_eligible ?? false;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await catalogAPI.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [];

  // Fetch designs
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['freePDFDesigns', searchQuery, selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      if (searchQuery || (selectedCategory && selectedCategory !== 'all')) {
        const categoryId = selectedCategory && selectedCategory !== 'all' 
          ? parseInt(selectedCategory) 
          : undefined;
        
        const response = await catalogAPI.searchProducts({
          q: searchQuery || undefined,
          category: categoryId,
          page: pageParam,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        return {
          products: transformProducts(response.data?.results || []),
          page: response.data?.current_page || pageParam,
          hasNext: (response.data?.current_page || 0) < (response.data?.total_pages || 0),
        };
      } else {
        const response = await catalogAPI.getHomeFeed(pageParam);

        if (response.error) {
          throw new Error(response.error);
        }

        return {
          products: transformProducts(response.data?.products || []),
          page: response.data?.page || pageParam,
          hasNext: response.data?.has_next || false,
        };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = data?.pages.flatMap(page => page.products) || [];
  
  // Get first N designs for "firstN" mode
  const firstNDesigns = products.slice(0, freeDesignsCount);
  
  // Get selected designs for "selected" mode
  const selectedDesigns = products.filter(p => selectedDesignIds.has(p.id));

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDesignToggle = (productId: number) => {
    if (selectionMode !== "selected") return;
    
    setSelectedDesignIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        if (newSet.size < freeDesignsCount) {
          newSet.add(productId);
        } else {
          toast({
            title: "Selection limit reached",
            description: `You can select up to ${freeDesignsCount} designs for your free PDF.`,
            variant: "destructive",
          });
        }
      }
      return newSet;
    });
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to download PDFs",
        variant: "destructive",
      });
      return;
    }

    if (!isEligible) {
      toast({
        title: "Not eligible",
        description: "You have already used your free PDF download.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      if (selectionMode === "firstN") {
        // Use first N designs from current filtered results
        const searchFilters = {
          q: searchQuery || undefined,
          category: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
        };

        // Create PDF request with search_results
        const createResponse = await apiClient.createPDFRequest({
          download_type: "free",
          total_pages: freeDesignsCount,
          selection_type: "search_results",
          search_filters: searchFilters,
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        const downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id;
        
        toast({
          title: "PDF request created",
          description: "Your free PDF is being generated. This may take a few moments.",
        });

        // Redirect to downloads page or show success
        setTimeout(() => {
          router.push('/customer-dashboard?tab=downloads');
        }, 2000);
      } else {
        // Use selected designs
        if (selectedDesignIds.size === 0) {
          toast({
            title: "No designs selected",
            description: `Please select at least 1 design (up to ${freeDesignsCount} designs).`,
            variant: "destructive",
          });
          setIsDownloading(false);
          return;
        }

        if (selectedDesignIds.size > freeDesignsCount) {
          toast({
            title: "Too many designs selected",
            description: `You can only select up to ${freeDesignsCount} designs.`,
            variant: "destructive",
          });
          setIsDownloading(false);
          return;
        }

        const designIds = Array.from(selectedDesignIds);
        const selectedCount = designIds.length;

        // Create PDF request with specific products
        const createResponse = await apiClient.createPDFRequest({
          download_type: "free",
          total_pages: selectedCount, // Use actual number of selected designs
          selection_type: "specific",
          selected_products: designIds,
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        const downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id;
        
        toast({
          title: "PDF request created",
          description: "Your free PDF is being generated. This may take a few moments.",
        });

        // Redirect to downloads page or show success
        setTimeout(() => {
          router.push('/customer-dashboard?tab=downloads');
        }, 2000);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create PDF request",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    if (selectionMode === "selected") {
      handleDesignToggle(product.id);
    } else {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  // Check if download button should be enabled
  const canDownload = 
    isEligible && 
    pdfConfig && 
    (selectionMode === "firstN" 
      ? firstNDesigns.length >= freeDesignsCount 
      : selectedDesignIds.size > 0 && selectedDesignIds.size <= freeDesignsCount);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Gift className="w-6 h-6 text-green-500" />
                    Get Your Free Mock PDF
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select {freeDesignsCount} designs for your free PDF download
                  </p>
                </div>
              </div>
            </div>

            {/* Eligibility Banner */}
            {!isEligible && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">Free PDF Already Used</p>
                    <p className="text-sm text-muted-foreground">
                      You have already used your free PDF download. Please use paid downloads for additional PDFs.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Selection Mode Toggle */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-base font-semibold">Selection Method</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectionMode === "firstN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectionMode("firstN");
                      setSelectedDesignIds(new Set());
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    First {freeDesignsCount} from Search
                  </Button>
                  <Button
                    variant={selectionMode === "selected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectionMode("selected")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Select {freeDesignsCount} Specific
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectionMode === "firstN" 
                  ? `The first ${freeDesignsCount} designs from your filtered results will be included in your PDF.`
                  : `Manually select exactly ${freeDesignsCount} designs by clicking on them.`}
              </p>
            </Card>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search designs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-background"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1 border border-border rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Selection Counter (for selected mode) */}
            {selectionMode === "selected" && (
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Selected Designs</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDesignIds.size} of {freeDesignsCount} designs selected
                    </p>
                  </div>
                  <Badge variant={selectedDesignIds.size === freeDesignsCount ? "default" : "secondary"}>
                    {selectedDesignIds.size} / {freeDesignsCount}
                  </Badge>
                </div>
              </Card>
            )}

            {/* Designs Grid */}
            <div>
              {isLoading ? (
                <div className={`grid gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" 
                    : "grid-cols-1"
                }`}>
                  {[...Array(10)].map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <Card className="p-12 text-center">
                  <p className="text-destructive mb-2">Error loading designs</p>
                  <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'An unexpected error occurred'}
                  </p>
                </Card>
              ) : products.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-2">No designs found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? `No designs match "${searchQuery}". Try a different search term.`
                      : "No designs available at the moment."}
                  </p>
                </Card>
              ) : (
                <>
                  {selectionMode === "firstN" && (
                    <div className="mb-4 text-sm text-muted-foreground">
                      Showing first {Math.min(firstNDesigns.length, freeDesignsCount)} of {products.length} designs
                    </div>
                  )}
                  <div className={`grid gap-4 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" 
                      : "grid-cols-1"
                  }`}>
                    {(selectionMode === "firstN" ? firstNDesigns : products).map((product, idx) => {
                      const isSelected = selectedDesignIds.has(product.id);
                      const canSelect = selectionMode === "selected" && 
                        (isSelected || selectedDesignIds.size < freeDesignsCount);

                      return (
                        <motion.div
                          key={`${product.id}-${idx}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                          onClick={() => handleProductClick(product)}
                          className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 ${
                            isSelected 
                              ? "border-primary ring-2 ring-primary/50" 
                              : canSelect
                              ? "border-border hover:border-primary/50"
                              : "border-border/50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {product.media && product.media.length > 0 && product.media[0] ? (
                            <img
                              src={product.media[0]}
                              alt={product.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <FileText className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Selection Checkbox Overlay */}
                          {selectionMode === "selected" && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : canSelect
                                  ? "bg-background/80 border-primary/50 hover:bg-primary/20"
                                  : "bg-background/50 border-muted-foreground/30"
                              }`}>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Product Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                            <p className="text-white text-sm font-medium truncate">
                              {product.title}
                            </p>
                            {product.category && (
                              <p className="text-white/70 text-xs truncate">
                                {product.category}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Infinite Scroll Trigger */}
                  {hasNextPage && (
                    <div ref={observerRef} className="h-10" />
                  )}
                </>
              )}
            </div>

            {/* Download Button - Sticky at bottom */}
            <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4 md:-mx-6 mt-6 z-10">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <p className="font-semibold">Free PDF Download</p>
                  <p className="text-sm text-muted-foreground">
                    {selectionMode === "firstN"
                      ? `First ${freeDesignsCount} designs from your search`
                      : `${selectedDesignIds.size} of ${freeDesignsCount} designs selected`}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={!canDownload || isDownloading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Free PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            hasActivePlan={false}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function DownloadMockPDFPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <DownloadMockPDFPageContent />
    </Suspense>
  );
}

