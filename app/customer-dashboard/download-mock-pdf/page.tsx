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
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProducts, type TransformedProduct } from "@/lib/utils/transformers";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductModal from "@/components/customer-dashboard/ProductModal";
import { initializeRazorpayCheckout } from "@/lib/payment";

type Product = TransformedProduct;
type SelectionMode = "firstN" | "selected";

function DownloadMockPDFPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

        const rawProducts = response.data?.results || [];
        // Filter products to only include those with mockup images
        const productsWithMockups = rawProducts.filter((product: any) => {
          if (!product.media || !Array.isArray(product.media) || product.media.length === 0) {
            return false;
          }
          // Check if any media item is marked as mockup
          return product.media.some((mediaItem: any) => {
            if (typeof mediaItem === 'string') {
              return false; // String URLs don't have mockup info
            }
            // Check is_mockup flag
            if (mediaItem.is_mockup === true) {
              return true;
            }
            // Check filename for "mockup"
            const fileName = mediaItem.file_name || '';
            if (fileName) {
              const fileNameLower = fileName.toLowerCase();
              const baseName = fileNameLower.split('.')[0];
              if (baseName === 'mockup' || fileNameLower.includes('mockup')) {
                return true;
              }
            }
            return false;
          });
        });
        
        return {
          products: transformProducts(productsWithMockups),
          page: response.data?.current_page || pageParam,
          hasNext: (response.data?.current_page || 0) < (response.data?.total_pages || 0),
        };
      } else {
        const response = await catalogAPI.getHomeFeed(pageParam);

        if (response.error) {
          throw new Error(response.error);
        }

        const rawProducts = response.data?.products || [];
        // Filter products to only include those with mockup images
        const productsWithMockups = rawProducts.filter((product: any) => {
          if (!product.media || !Array.isArray(product.media) || product.media.length === 0) {
            return false;
          }
          // Check if any media item is marked as mockup
          return product.media.some((mediaItem: any) => {
            if (typeof mediaItem === 'string') {
              return false; // String URLs don't have mockup info
            }
            // Check is_mockup flag
            if (mediaItem.is_mockup === true) {
              return true;
            }
            // Check filename for "mockup"
            const fileName = mediaItem.file_name || '';
            if (fileName) {
              const fileNameLower = fileName.toLowerCase();
              const baseName = fileNameLower.split('.')[0];
              if (baseName === 'mockup' || fileNameLower.includes('mockup')) {
                return true;
              }
            }
            return false;
          });
        });

        return {
          products: transformProducts(productsWithMockups),
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

  // Products are already filtered in the queryFn to only include those with mockups
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
            description: `You can select exactly ${freeDesignsCount} designs.`,
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

    // Check if enough designs are available/selected
    const selectedCount = selectionMode === "firstN" 
      ? firstNDesigns.length 
      : selectedDesignIds.size;
    
    // For "firstN" mode, use whatever products are loaded (up to freeDesignsCount)
    // For "selected" mode, require exactly freeDesignsCount for paid downloads
    if (selectionMode === "selected") {
      if (selectedCount !== freeDesignsCount) {
        toast({
          title: "Selection required",
          description: `Please select exactly ${freeDesignsCount} designs to proceed.`,
          variant: "destructive",
        });
        return;
      }
    } else if (selectionMode === "firstN") {
      if (selectedCount === 0) {
        toast({
          title: "No products available",
          description: "No products found matching your filters. Please adjust your search or category.",
          variant: "destructive",
        });
        return;
      }
      // For paid downloads in "firstN" mode, we still need exactly N products
      if (!isFreeDownload && selectedCount !== freeDesignsCount) {
        toast({
          title: "Insufficient products",
          description: `Please ensure at least ${freeDesignsCount} products are loaded. Try adjusting your filters or scrolling to load more products.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsDownloading(true);

    try {
      const downloadType = isFreeDownload ? "free" : "paid";
      let downloadId: number | null | undefined = null;

      if (selectionMode === "firstN") {
        // Use first N designs from current filtered results
        // Get product IDs from the first N designs that are currently loaded
        const firstNProductIds = firstNDesigns.map(p => p.id);
        
        // For free downloads, must use exactly freeDesignsCount
        // For paid downloads, use the actual count (up to freeDesignsCount)
        const productCount = isFreeDownload ? freeDesignsCount : Math.min(firstNProductIds.length, freeDesignsCount);
        const productIdsToUse = firstNProductIds.slice(0, productCount);
        
        // Ensure we have enough products
        if (productIdsToUse.length !== productCount) {
          throw new Error(`Not enough products available. Required: ${productCount}, Available: ${productIdsToUse.length}`);
        }

        // Create PDF request with specific product IDs
        const createResponse = await apiClient.createPDFRequest({
          download_type: downloadType,
          total_pages: productCount,
          selection_type: "specific",
          selected_products: productIdsToUse,
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id || null;
      } else {
        // Use selected designs
        const designIds = Array.from(selectedDesignIds);

        // Create PDF request with specific products
        const createResponse = await apiClient.createPDFRequest({
          download_type: downloadType,
          total_pages: freeDesignsCount,
          selection_type: "specific",
          selected_products: designIds,
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id;
      }

      if (!downloadId) {
        throw new Error('Failed to get download ID from response');
      }

      // Handle payment for paid downloads
      if (downloadType === "paid" && price > 0) {
        // Create PDF payment order
        const paymentOrderResponse = await apiClient.createPDFPaymentOrder({
          download_id: downloadId,
          amount: price,
        });

        if (paymentOrderResponse.error || !paymentOrderResponse.data) {
          throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
        }

        const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

        // Initialize Razorpay checkout
        const paymentResult = await initializeRazorpayCheckout({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: price * 100, // Convert rupees to paise
          currency: 'INR',
          name: 'WeDesign',
          description: `PDF Download - ${freeDesignsCount} designs`,
          order_id: razorpay_order_id,
          theme: {
            color: '#8B5CF6',
          },
        });

        if (!paymentResult.success || !paymentResult.razorpay_payment_id) {
          throw new Error(paymentResult.error || 'Payment failed or cancelled');
        }

        // Capture payment
        const captureResponse = await apiClient.capturePDFPayment({
          payment_id: payment_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          amount: price,
        });

        if (captureResponse.error) {
          throw new Error(captureResponse.error || 'Failed to capture payment');
        }

        toast({
          title: "Payment successful!",
          description: "Your PDF is being generated. This may take a few moments.",
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });
        queryClient.invalidateQueries({ queryKey: ['pdfDownloads'] });
        queryClient.invalidateQueries({ queryKey: ['downloads'] });

        // Redirect to downloads page immediately
        router.push('/customer-dashboard?view=downloads');
      } else {
        // Free download
        toast({
          title: "PDF request created",
          description: "Your free PDF is being generated. This may take a few moments.",
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });
        queryClient.invalidateQueries({ queryKey: ['pdfDownloads'] });

        // Redirect to downloads page immediately
        router.push('/customer-dashboard?view=downloads');
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process PDF request",
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

  // Determine if this is a free or paid download
  // Free: user is eligible AND has exactly 50 designs
  // Paid: user is NOT eligible AND has exactly 50 designs
  const hasExactCount = selectionMode === "firstN" 
    ? firstNDesigns.length === freeDesignsCount
    : selectedDesignIds.size === freeDesignsCount;
  
  const isFreeDownload = isEligible && hasExactCount;
  const isPaidDownload = !isEligible && hasExactCount;
  
  // Check if download button should be enabled
  // Must have exactly 50 designs selected (either free or paid)
  const canDownload = pdfConfig && hasExactCount;
  
  // Calculate price for paid downloads
  const calculatePrice = () => {
    if (!pdfConfig || !isPaidDownload) return 0;
    if (selectionMode === "selected") {
      return freeDesignsCount * pdfConfig.pricing.selected_per_design;
    }
    return freeDesignsCount * pdfConfig.pricing.first_n_per_design;
  };
  
  const price = calculatePrice();

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
                    {isEligible ? (
                      <>
                        <Gift className="w-6 h-6 text-green-500" />
                        Get Your Free Mock PDF
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6 text-primary" />
                        Download Mock PDF
                      </>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEligible 
                      ? `Select ${freeDesignsCount} designs for your free PDF download`
                      : `Select exactly ${freeDesignsCount} designs to download (payment required)`}
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
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none px-4 py-2 pr-10 rounded-md border border-border bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[180px] z-10 relative"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-20" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Selection Counter (for selected mode) */}
            {selectionMode === "selected" && (
              <Card className={`p-4 border-2 ${
                selectedDesignIds.size === freeDesignsCount 
                  ? "bg-primary/10 border-primary" 
                  : "bg-muted/50 border-border"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Selected Designs</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDesignIds.size} of {freeDesignsCount} designs selected
                      {selectedDesignIds.size === freeDesignsCount && isPaidDownload && (
                        <span className="ml-2 font-semibold text-primary">Ready to pay ₹{price.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <Badge variant={selectedDesignIds.size === freeDesignsCount ? "default" : "secondary"}>
                    {selectedDesignIds.size} / {freeDesignsCount}
                  </Badge>
                </div>
                {selectedDesignIds.size !== freeDesignsCount && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Select exactly {freeDesignsCount} designs to proceed
                  </p>
                )}
              </Card>
            )}

            {/* Designs Grid */}
            <div>
              {isLoading ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {[...Array(12)].map((_, idx) => (
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
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
                              : selectionMode === "selected"
                              ? "border-border/50 opacity-50 cursor-not-allowed"
                              : "border-border hover:border-primary/50"
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
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-sm ${
                                isSelected
                                  ? "bg-primary border-primary shadow-lg"
                                  : canSelect
                                  ? "bg-background/90 border-primary/50 hover:bg-primary/20 shadow-md"
                                  : "bg-background/50 border-muted-foreground/30"
                              }`}>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Product Info Overlay - Improved */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-6">
                            <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">
                              {product.title}
                            </p>
                            {product.category && (
                              <p className="text-white/60 text-[10px] truncate uppercase tracking-wide">
                                {product.category}
                              </p>
                            )}
                          </div>
                          
                          {/* Hover overlay for better interaction feedback */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
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
                  <p className="font-semibold">
                    {isFreeDownload ? "Free PDF Download" : "Paid PDF Download"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectionMode === "firstN"
                      ? `First ${freeDesignsCount} designs from your search`
                      : `${selectedDesignIds.size} of ${freeDesignsCount} designs selected`}
                    {isPaidDownload && price > 0 && (
                      <span className="ml-2 font-semibold text-primary">₹{price.toFixed(2)}</span>
                    )}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={!canDownload || isDownloading}
                  className={
                    isFreeDownload
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  }
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isPaidDownload ? "Processing Payment..." : "Generating PDF..."}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      {isFreeDownload 
                        ? "Download Free PDF" 
                        : `Pay ₹${price.toFixed(2)} & Download`}
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

