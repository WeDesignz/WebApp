"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Grid3x3,
  Shirt,
  Image,
  FileText,
  Star,
  Frame,
  Palette,
  Box,
  Filter,
  Search,
  Crown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductModal from "./ProductModal";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { catalogAPI } from "@/lib/api";
import { transformCategories, transformProducts, type TransformedCategory, type TransformedProduct } from "@/lib/utils/transformers";

type Category = TransformedCategory;
type Product = TransformedProduct;

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


export default function CategoriesContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories from API
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

  // Set first category as selected when categories load
  useEffect(() => {
    if (!selectedCategory && categoriesData && categoriesData.length > 0) {
      setSelectedCategory(categoriesData[0].id);
    }
  }, [categoriesData, selectedCategory]);

  const categories = categoriesData || [];
  const activeCategory = categories.find(cat => cat.id === selectedCategory);

  // Fetch products for selected category
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['categoryProducts', selectedCategory, searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedCategory) {
        return { products: [], page: 1, hasNext: false };
      }

      const categoryId = parseInt(selectedCategory);
      const response = await catalogAPI.searchProducts({
        category: categoryId,
        q: searchQuery || undefined,
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
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedCategory, // Only fetch when a category is selected
  });

  const filteredProducts = productsData?.pages.flatMap(page => page.products) || [];
  const observerRef = useRef<HTMLDivElement>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Infinite scroll observer for category products
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
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Design Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse designs by category. More categories coming soon!
          </p>
        </div>

        {/* Category Cards */}
        {isLoadingCategories ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="p-6 bg-muted rounded-lg animate-pulse h-48" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No categories available</p>
          </Card>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => {
              const Icon = category.icon || Box; // Default icon
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className="cursor-pointer"
              >
                <Card className={`p-6 bg-gradient-to-br ${category.color} ${category.borderColor} hover:shadow-lg transition-all ${
                  selectedCategory === category.id ? "ring-2 ring-primary" : ""
                  } hover:scale-105`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-background/50 rounded-lg ${category.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {category.isActive && (
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                    {category.productCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Products:</span>
                      <span className="font-semibold">{category.productCount}</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* Active Category Content */}
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Category Header */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-background/50 rounded-lg ${activeCategory.iconColor}`}>
                  {activeCategory.icon ? (
                  <activeCategory.icon className="w-8 h-8" />
                  ) : (
                    <Box className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{activeCategory.title}</h2>
                  <p className="text-muted-foreground">{activeCategory.description}</p>
                </div>
                {activeCategory.productCount !== undefined && (
                <Badge variant="default" className="bg-green-500 text-lg px-4 py-2">
                  {activeCategory.productCount} Products Available
                </Badge>
                )}
              </div>
            </Card>

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeCategory.title.toLowerCase()}...`}
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <Button variant="outline" size="lg">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : productsError ? (
              <Card className="p-12 text-center">
                <p className="text-destructive mb-2">Error loading products</p>
                <p className="text-sm text-muted-foreground">
                  {productsError instanceof Error ? productsError.message : 'An error occurred'}
                </p>
              </Card>
            ) : filteredProducts.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">
                    {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => handleProductClick(product)}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/50 hover:border-primary/30 dark:hover:border-primary/40"
                    >
                      <img
                        src={(() => {
                          const mediaItem = product.media[0];
                          if (!mediaItem) return '';
                          if (typeof mediaItem === 'string') return mediaItem;
                          return mediaItem.url || '';
                        })()}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      
                      {product.product_plan_type === "Premium" && (
                        <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold z-10 shadow-lg">
                          <Crown className="w-3 h-3" />
                          Premium
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
                          <div className="p-4 space-y-2.5">
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
                            
                            {/* Price and variants info */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-foreground font-bold text-sm">
                                ₹{product.sub_products[0]?.price || 0}
                              </span>
                              <span className="text-muted-foreground text-xs font-medium bg-muted/50 dark:bg-muted/80 px-2 py-0.5 rounded-full">
                                {product.sub_products.length} variants
                              </span>
                            </div>
                            
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
                      <span>Loading more products...</span>
                    </div>
                  )}
                  {!hasNextPage && filteredProducts.length > 0 && (
                    <p className="text-sm text-muted-foreground">No more products to load</p>
                  )}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                {activeCategory?.icon ? (
                <activeCategory.icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                ) : (
                  <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                )}
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No products match "${searchQuery}". Try a different search term.`
                    : "No products available in this category yet."
                  }
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* No Category Selected Message */}
        {!activeCategory && categories.length > 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <Box className="w-16 h-16 mx-auto mb-4 text-primary/50" />
            <h3 className="text-2xl font-bold mb-2">Select a Category</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose a category above to browse products
            </p>
          </Card>
        )}
      </div>

      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hasActivePlan={true}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
