"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Crown, FileText, Loader2, Gift, Box, Shirt, Image, Star, Frame, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductModal from "./ProductModal";
import PDFDownloadModal, { PDFPurchase } from "./PDFDownloadModal";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProduct, transformProducts, transformCategories, type TransformedProduct, type TransformedCategory } from "@/lib/utils/transformers";
import { useToast } from "@/hooks/use-toast";

interface ContentProps {
  searchQuery: string;
  selectedCategory: string;
  productIdFromUrl?: string | null;
}

type Product = TransformedProduct;

// Helper to construct AVIF URL from original URL
const getAvifUrl = (url: string): string | null => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  // Check if it's already an AVIF file
  if (urlLower.endsWith('.avif')) {
    return url;
  }
  // For MOCKUP files: WDG00000001_MOCKUP.jpg -> WDG00000001_MOCKUP.avif
  if (urlLower.includes('_mockup.')) {
    return url.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }
  // For regular files: WDG00000001.jpg -> WDG00000001_JPG.avif
  if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
    return url.replace(/\.(jpg|jpeg)$/i, '_JPG.avif');
  } else if (urlLower.endsWith('.png')) {
    return url.replace(/\.png$/i, '_PNG.avif');
  }
  return null;
};

// Helper function to get image URL, preferring AVIF files
const getImageUrl = (product: Product, preferAvif = true): string => {
  if (!product.media || product.media.length === 0) {
    return '/generated_images/Brand_Identity_Design_67fa7e1f.png';
  }
  
  const mediaArray = product.media || [];
  
  // Helper to extract URL from media item (can be string or object)
  const getUrl = (item: any): string => {
    if (typeof item === 'string') return item;
    return item?.url || item?.file || '';
  };
  
  // Helper to check if URL is AVIF
  const isAvif = (url: string): boolean => {
    return url.toLowerCase().endsWith('.avif');
  };
  
  // Helper to check if URL is mockup
  const isMockup = (url: string, item: any): boolean => {
    if (typeof item === 'object' && item?.is_mockup) return true;
    return url.toLowerCase().includes('mockup');
  };
  
  if (preferAvif) {
    // First, try to find MOCKUP and construct AVIF URL
    for (const item of mediaArray) {
      const url = getUrl(item);
      if (url && isMockup(url, item) && !isAvif(url)) {
        const avifUrl = getAvifUrl(url);
        if (avifUrl) return avifUrl;
      }
    }
    
    // Then, try to find any JPG/PNG and construct AVIF URL
    for (const item of mediaArray) {
      const url = getUrl(item);
      if (url && !isAvif(url) && (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg') || url.toLowerCase().endsWith('.png'))) {
        const avifUrl = getAvifUrl(url);
        if (avifUrl) return avifUrl;
      }
    }
  }
  
  // Fallback to MOCKUP JPG/PNG
  for (const item of mediaArray) {
    const url = getUrl(item);
    if (url && isMockup(url, item) && !isAvif(url)) {
      return url;
    }
  }
  
  // Fallback to first media
  const firstUrl = getUrl(mediaArray[0]);
  return firstUrl || '/generated_images/Brand_Identity_Design_67fa7e1f.png';
};

// Helper function to get original (non-AVIF) URL for preview
const getOriginalImageUrl = (product: Product, currentUrl: string): string => {
  if (!product.media || product.media.length === 0) {
    return currentUrl;
  }
  
  const mediaArray = product.media || [];
  
  // Helper to extract URL from media item
  const getUrl = (item: any): string => {
    if (typeof item === 'string') return item;
    return item?.url || item?.file || '';
  };
  
  // If current URL is AVIF, find the corresponding original
  if (currentUrl.toLowerCase().endsWith('.avif')) {
    // Extract base name (e.g., WDG00000001_MOCKUP.avif -> WDG00000001_MOCKUP)
    const baseName = currentUrl.replace(/\.avif$/i, '');
    
    // Look for corresponding JPG or PNG
    for (const item of mediaArray) {
      const url = getUrl(item);
      if (url && !url.toLowerCase().endsWith('.avif')) {
        // Check if it matches the base name
        const urlBase = url.replace(/\.(jpg|jpeg|png)$/i, '');
        if (urlBase === baseName || urlBase.includes(baseName.split('_')[0])) {
          return url;
        }
      }
    }
    
    // Fallback: try to construct original URL
    if (currentUrl.includes('_MOCKUP.avif')) {
      return currentUrl.replace('_MOCKUP.avif', '_MOCKUP.jpg');
    } else if (currentUrl.includes('_JPG.avif')) {
      return currentUrl.replace('_JPG.avif', '.jpg');
    } else if (currentUrl.includes('_PNG.avif')) {
      return currentUrl.replace('_PNG.avif', '.png');
    }
  }
  
  return currentUrl;
};

// Helper function to check if a product is free
const isProductFree = (product: Product): boolean => {
  // Check product_plan_type first
  if (product.product_plan_type?.toLowerCase() === 'free') {
    return true;
  }
  
  // Check sub_products prices - if all are 0, product is free
  if (product.sub_products && product.sub_products.length > 0) {
    const allFree = product.sub_products.every((sp: any) => {
      const spPrice = sp.price || 0;
      return spPrice === 0 || spPrice === null || spPrice === undefined;
    });
    return allFree;
  }
  
  return false;
};

// Icon mapping for categories
const iconMap: Record<string, any> = {
  'jerseys': Shirt,
  'vectors': Image,
  'psd': FileText,
  'icons': Star,
  'mockups': Frame,
  'illustrations': Palette,
  '3d-models': Box,
};


export default function CustomerDashboardContent({ searchQuery, selectedCategory, productIdFromUrl }: ContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasOpenedProductFromUrl, setHasOpenedProductFromUrl] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [freePDFUsed, setFreePDFUsed] = useState(false);
  const [isClaimingFreePDF, setIsClaimingFreePDF] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const [downloadedProductIds, setDownloadedProductIds] = useState<Set<number>>(new Set());
  const [downloadingProductId, setDownloadingProductId] = useState<number | null>(null);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Fetch categories from API (only parent categories with no parent)
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await catalogAPI.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return transformCategories(response.data?.categories || [], iconMap);
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const categories = categoriesData || [];

  // Fetch user's downloaded products
  const { data: downloadsData, isLoading: isLoadingDownloads } = useQuery({
    queryKey: ['userDownloads'],
    queryFn: async () => {
      const response = await apiClient.getDownloads('all');
      if (response.error) {
        console.error('Error fetching downloads:', response.error);
        return { products: [] };
      }
      const data = response.data || { products: [] };
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update downloadedProductIds when downloadsData changes
  useEffect(() => {
    if (downloadsData?.products && Array.isArray(downloadsData.products)) {
      // Convert all IDs to numbers for consistent comparison
      const ids = new Set(downloadsData.products.map((p: any) => Number(p.id)).filter((id: number) => !isNaN(id)));
      setDownloadedProductIds(ids);
    } else {
      setDownloadedProductIds(new Set());
    }
  }, [downloadsData]);

  // Fetch products using infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['homeFeed', searchQuery, selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      // If there's a search query or category filter, use search endpoint
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
        // Use home feed endpoint
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

  // Flatten all pages into a single products array
  const products = data?.pages.flatMap(page => page.products) || [];

  useEffect(() => {
    setIsMounted(true);
    if (isAuthenticated) {
      const used = localStorage.getItem("freePDFUsed") === "true";
      setFreePDFUsed(used);
    }
  }, [isAuthenticated]);

  // Reset hasOpenedProductFromUrl when productIdFromUrl changes
  useEffect(() => {
    setHasOpenedProductFromUrl(false);
  }, [productIdFromUrl]);

  // Fetch and open product modal when product ID is in URL (from Pinterest link)
  const { data: productFromUrlData, isLoading: isLoadingProductFromUrl, error: productFromUrlError } = useQuery({
    queryKey: ['productFromUrl', productIdFromUrl],
    queryFn: async () => {
      if (!productIdFromUrl) return null;
      const productId = parseInt(productIdFromUrl);
      if (isNaN(productId)) {
        throw new Error('Invalid product ID');
      }
      
      const response = await catalogAPI.getProductDetail(productId);
      if (response.error) {
        throw new Error(response.error);
      }
      const product = response.data?.product;
      if (!product) {
        throw new Error('Product not found');
      }
      return transformProduct(product);
    },
    enabled: !!productIdFromUrl && !hasOpenedProductFromUrl && isMounted,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
  });

  // Show error toast if product fetch fails
  useEffect(() => {
    if (productFromUrlError && !hasOpenedProductFromUrl) {
      toast({
        title: "Product not found",
        description: productFromUrlError instanceof Error 
          ? productFromUrlError.message 
          : "Unable to load product details. Please try again.",
        variant: "destructive",
      });
      setHasOpenedProductFromUrl(true); // Prevent retrying
      
      // Clean up URL parameter
      const params = new URLSearchParams(window.location.search);
      params.delete('product');
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}` 
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [productFromUrlError, hasOpenedProductFromUrl, router, toast]);

  // Auto-open modal when product is loaded from URL
  useEffect(() => {
    if (productFromUrlData && !hasOpenedProductFromUrl && !isLoadingProductFromUrl) {
      setSelectedProduct(productFromUrlData);
      setIsModalOpen(true);
      setHasOpenedProductFromUrl(true);
      
      // Clean up URL parameter after opening modal
      const params = new URLSearchParams(window.location.search);
      params.delete('product');
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}` 
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [productFromUrlData, hasOpenedProductFromUrl, isLoadingProductFromUrl, router]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDownloadProduct = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation(); // Prevent opening modal
    
    // Check authentication before downloading
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    if (downloadingProductId === productId) return;
    
    setDownloadingProductId(productId);
    try {
      const blob = await apiClient.downloadProductZip(productId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design_${productId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your design files are being downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download product.",
        variant: "destructive",
      });
    } finally {
      setDownloadingProductId(null);
    }
  };

  const handlePDFPurchaseComplete = (purchase: PDFPurchase) => {
    // Trigger a refresh or update in DownloadsContent
    // This will be handled via localStorage
    if (purchase.type === "free") {
      setFreePDFUsed(true);
    }
  };

  const handleFreePDFClaim = () => {
    // Redirect to PDF design selection page
    if (typeof window !== 'undefined') {
      window.location.href = '/customer-dashboard/pdf-select?type=free';
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    // Update URL with selected category
    const params = new URLSearchParams(window.location.search);
    if (categoryId && categoryId !== 'all') {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };

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

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="overflow-x-auto overflow-y-visible pb-4 -mx-4 px-4 pt-2">
          {isLoadingCategories ? (
            <div className="flex gap-4 min-w-max">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="w-40 h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No categories available</p>
            </Card>
          ) : (
            <div className="flex gap-4 min-w-max py-2">
              {categories.map((category, idx) => {
                const Icon = category.icon || Box;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCategoryClick(category.id)}
                    className="relative z-10 hover:z-50"
                  >
                    <Card className={`w-40 h-32 p-4 bg-gradient-to-br ${category.color} border-primary/20 hover:scale-105 hover:border-primary/40 transition-all cursor-pointer ${
                      selectedCategory === category.id ? "ring-2 ring-primary" : ""
                    }`}>
                      <div className="flex items-center justify-center mb-2">
                        {category.icon ? (
                          <Icon className="w-8 h-8" />
                        ) : (
                          <div className="text-4xl">📁</div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-center">{category.title}</h3>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {category.productCount !== undefined && category.productCount >= 0 
                          ? `${category.productCount} ${category.productCount === 1 ? 'product' : 'products'}`
                          : 'Loading...'}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <Card className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                {isMounted && isAuthenticated && !freePDFUsed ? (
                  <>
                    <h3 className="font-bold text-lg">Get Your First Mock Design PDF for Free!</h3>
                    <p className="text-sm text-muted-foreground">
                      Claim your free PDF of 50 designs based on your current search
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg">Download Mock PDFs</h3>
                    <p className="text-sm text-muted-foreground">
                      Download sample PDFs and mockups to preview design quality
                    </p>
                  </>
                )}
              </div>
            </div>
            {isMounted && isAuthenticated && !freePDFUsed ? (
              <Button 
                size="lg" 
                className="whitespace-nowrap bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={handleFreePDFClaim}
                disabled={isClaimingFreePDF}
              >
                {isClaimingFreePDF ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Get Free PDF (50 Designs)
                  </>
                )}
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="whitespace-nowrap"
                onClick={() => router.push('/customer-dashboard?view=downloadMockPDF')}
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDFs
              </Button>
            )}
          </div>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Design Feed</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <p className="text-destructive mb-2">Error loading products</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </Card>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No products found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? `No products match "${searchQuery}". Try a different search term.`
                  : "No products available at the moment."
                }
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {products.map((product, idx) => (
                  <motion.div
                    key={`${product.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    onClick={() => handleProductClick(product)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/50 hover:border-primary/30 dark:hover:border-primary/40"
                  >
                    {product.media && product.media.length > 0 ? (
                      <img
                        src={getImageUrl(product, true)}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          // Fallback to original if AVIF fails
                          const fallbackUrl = getImageUrl(product, false);
                          if (fallbackUrl !== (e.target as HTMLImageElement).src) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          } else {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="text-center p-4">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-xs text-muted-foreground">No image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Premium icon for non-free products */}
                    {!isProductFree(product) && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 p-2 rounded-full flex items-center justify-center z-10 shadow-lg hover:shadow-xl transition-shadow">
                        <Crown className="w-4 h-4" />
                      </div>
                    )}

                    {/* Modern hover overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none">
                      {/* Gradient backdrop that adapts to theme */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent dark:from-background/98 dark:via-background/70" />
                      
                      {/* Content container with smooth slide-up animation */}
                      <div className="absolute bottom-0 left-0 right-0 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <div className="p-4 space-y-2">
                          {/* Title with better typography */}
                          <h3 className="text-foreground font-semibold text-sm leading-tight line-clamp-1 drop-shadow-sm">
                            {product.title}
                          </h3>
                          
                          {/* Description with improved styling */}
                          {product.description && (
                            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          
                          {/* Always show View Details on hover */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <div className="h-px flex-1 bg-primary/20 dark:bg-primary/30" />
                            <span className="text-xs font-medium text-primary dark:text-primary">
                              View Details
                            </span>
                            <div className="h-px flex-1 bg-primary/20 dark:bg-primary/30" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Subtle border glow on hover */}
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/20 dark:border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div
                ref={observerRef}
                className="flex justify-center items-center py-8"
              >
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more designs...</span>
                  </div>
                )}
                {!hasNextPage && products.length > 0 && (
                  <p className="text-sm text-muted-foreground">No more products to load</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hasActivePlan={hasActivePlan}
          product={selectedProduct}
          isDownloaded={isAuthenticated && downloadedProductIds.has(Number(selectedProduct.id))}
        />
      )}

      <PDFDownloadModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        totalResults={products.length}
        onPurchaseComplete={handlePDFPurchaseComplete}
      />
    </div>
  );
}
