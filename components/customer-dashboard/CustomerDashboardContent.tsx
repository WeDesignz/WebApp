"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Crown, FileText, Loader2, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductModal from "./ProductModal";
import PDFDownloadModal, { PDFPurchase } from "./PDFDownloadModal";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogAPI } from "@/lib/api";
import { transformProduct, transformProducts, type TransformedProduct } from "@/lib/utils/transformers";

interface ContentProps {
  searchQuery: string;
  selectedCategory: string;
}

type Product = TransformedProduct;

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

const categoryCards = [
  { id: "jerseys", title: "Jerseys", icon: "👕", color: "from-blue-500/10 to-cyan-500/10" },
  { id: "vectors", title: "Vectors", icon: "🎨", color: "from-purple-500/10 to-pink-500/10" },
  { id: "psd", title: "PSD Files", icon: "📁", color: "from-orange-500/10 to-red-500/10" },
  { id: "icons", title: "Icons", icon: "⭐", color: "from-yellow-500/10 to-amber-500/10" },
  { id: "mockups", title: "Mockups", icon: "🖼️", color: "from-green-500/10 to-emerald-500/10" },
  { id: "illustrations", title: "Illustrations", icon: "🎭", color: "from-indigo-500/10 to-violet-500/10" },
  { id: "3d-models", title: "3D Models", icon: "🎲", color: "from-rose-500/10 to-pink-500/10" },
];


export default function CustomerDashboardContent({ searchQuery, selectedCategory }: ContentProps) {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [freePDFUsed, setFreePDFUsed] = useState(false);
  const [isClaimingFreePDF, setIsClaimingFreePDF] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!user;

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handlePDFPurchaseComplete = (purchase: PDFPurchase) => {
    // Trigger a refresh or update in DownloadsContent
    // This will be handled via localStorage
    console.log("PDF Purchase completed:", purchase);
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
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {categoryCards.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`w-40 h-32 p-4 bg-gradient-to-br ${cat.color} border-primary/20 hover:scale-105 hover:border-primary/40 transition-all cursor-pointer`}>
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="font-semibold text-sm">{cat.title}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
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
                onClick={() => setIsPDFModalOpen(true)}
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
                    {product.media && product.media.length > 0 && product.media[0] ? (
                      <img
                        src={product.media[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
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

                    {/* Modern hover overlay with glassmorphism */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none">
                      {/* Gradient backdrop that adapts to theme */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent dark:from-background/98 dark:via-background/70" />
                      
                      {/* Glassmorphism overlay */}
                      <div className="absolute inset-0 backdrop-blur-[2px]" />
                      
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
                          
                          {/* CTA hint with subtle styling */}
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
