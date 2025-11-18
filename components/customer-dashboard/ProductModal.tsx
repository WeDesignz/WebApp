"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Download, CreditCard, Heart, Loader2, Tag, Image as ImageIcon, Package, Hash, Palette, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { catalogAPI } from "@/lib/api";
import { transformProduct, type TransformedProduct } from "@/lib/utils/transformers";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasActivePlan: boolean;
  product: TransformedProduct;
}

export default function ProductModal({ isOpen, onClose, hasActivePlan, product: initialProduct }: ProductModalProps) {
  const { addToCart, addToWishlist, isInWishlist } = useCartWishlist();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch detailed product data when modal opens
  const { data: productData, isLoading: isLoadingProduct, error: productError } = useQuery({
    queryKey: ['productDetail', initialProduct.id],
    queryFn: async () => {
      const response = await catalogAPI.getProductDetail(initialProduct.id);
      if (response.error) {
        throw new Error(response.error);
      }
      // Return raw API data to access all fields
      return {
        transformed: transformProduct(response.data?.product || initialProduct),
        raw: response.data?.product || initialProduct
      };
    },
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use fetched product data or fallback to initial product
  const product = productData?.transformed || initialProduct;
  const rawProduct = productData?.raw || null;

  // Reset selected image when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
    }
  }, [isOpen, product.id]);

  const handleAddToCart = async (subProduct?: any) => {
    const cartItem = {
      id: subProduct ? `${product.id}-${subProduct.id}` : `${product.id}`,
      productId: String(product.id),
      title: product.title,
      designer: product.created_by,
      category: product.category,
      price: subProduct ? subProduct.price : product.sub_products[0]?.price || 0,
      image: product.media[0] || '/generated_images/Brand_Identity_Design_67fa7e1f.png',
      tags: [product.category, product.product_plan_type],
      license: 'Standard License',
      subProductId: subProduct?.id,
      color: subProduct?.color,
    };
    await addToCart(cartItem);
  };

  const handleAddToWishlist = async () => {
    const wishlistItem = {
      id: String(product.id),
      productId: String(product.id),
      title: product.title,
      designer: product.created_by,
      category: product.category,
      price: product.sub_products[0]?.price || 0,
      image: product.media[0] || '/generated_images/Brand_Identity_Design_67fa7e1f.png',
      tags: [product.category, product.product_plan_type],
      isPremium: product.product_plan_type.toLowerCase().includes('premium'),
    };
    
    if (isInWishlist(String(product.id))) {
      toast({
        title: "Already in wishlist",
        description: `${product.title} is already in your wishlist.`,
      });
    } else {
      await addToWishlist(wishlistItem);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
      case "Show":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "Inactive":
      case "Hide":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "Draft":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "Deleted":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto pointer-events-none">

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl my-8 pointer-events-auto max-h-[90vh] flex flex-col"
            >
              {isLoadingProduct ? (
                <div className="p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : productError ? (
                <div className="p-12 text-center">
                  <p className="text-destructive mb-2">Error loading product details</p>
                  <p className="text-sm text-muted-foreground">
                    {productError instanceof Error ? productError.message : 'An error occurred'}
                  </p>
                  <Button onClick={onClose} className="mt-4">Close</Button>
                </div>
              ) : (
                <>
                  {/* Header with close button - Sticky */}
                  <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-10 rounded-t-2xl">
                    <h2 className="text-2xl font-bold">{product.title}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddToWishlist}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Add to wishlist"
                      >
                        <Heart 
                          className={`w-5 h-5 ${isInWishlist(String(product.id)) ? 'fill-destructive text-destructive' : ''}`} 
                        />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="overflow-y-auto flex-1">
                  <div className="flex flex-col lg:flex-row gap-6 p-6">
                    {/* Left Side - Image Gallery */}
                    <div className="lg:w-2/5 space-y-4">
                      {/* Main Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                        {product.media && product.media.length > 0 && product.media[selectedImageIndex] ? (
                          <img
                            src={product.media[selectedImageIndex]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-16 h-16 mx-auto mb-2 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm text-muted-foreground">No image available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Thumbnail Gallery */}
                      {product.media.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {product.media.map((mediaUrl, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImageIndex === index 
                                  ? 'border-primary ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img
                                src={mediaUrl}
                                alt={`${product.title} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Side - Product Information */}
                    <div className="lg:w-3/5 space-y-6">
                      {/* Category and Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          {product.category}
                        </span>
                        <span className={`text-xs px-3 py-1.5 border rounded-full font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                        <span className="text-sm px-3 py-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-full font-medium">
                          {product.product_plan_type}
                        </span>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Description
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">{product.description || 'No description available.'}</p>
                      </div>

                      {/* Product Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {rawProduct?.product_number && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs font-medium">Product Number</span>
                            </div>
                            <p className="font-mono text-sm font-semibold">{rawProduct.product_number}</p>
                          </div>
                        )}
                        
                        {rawProduct?.studio_design_number && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Hash className="w-4 h-4" />
                              <span className="text-xs font-medium">Studio Design #</span>
                            </div>
                            <p className="font-mono text-sm font-semibold">{rawProduct.studio_design_number}</p>
                          </div>
                        )}

                        {rawProduct?.color && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Palette className="w-4 h-4" />
                              <span className="text-xs font-medium">Color</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full border border-border"
                                style={{ backgroundColor: rawProduct.color }}
                              />
                              <p className="text-sm font-semibold">{rawProduct.color}</p>
                            </div>
                          </div>
                        )}

                        {rawProduct?.price && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs font-medium">Price</span>
                            </div>
                            <p className="text-lg font-bold text-primary">₹{parseFloat(rawProduct.price).toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {rawProduct?.tags && Array.isArray(rawProduct.tags) && rawProduct.tags.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {rawProduct.tags.map((tag: any) => (
                              <span
                                key={tag.id || tag.name}
                                className="text-xs px-3 py-1.5 bg-muted border border-border rounded-full text-muted-foreground"
                              >
                                {tag.name || tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Files Count */}
                      {product.media.length > 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Media Files</span>
                          </div>
                          <p className="text-sm font-semibold">{product.media.length} file{product.media.length !== 1 ? 's' : ''} available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>

              {/* Action Buttons - Sticky at bottom */}
              <div className="p-6 border-t border-border bg-muted/30 sticky bottom-0 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  {hasActivePlan ? (
                    <>
                      <Button className="flex-1 rounded-full h-12 text-base font-semibold">
                        <Download className="w-5 h-5 mr-2" />
                        Download Design
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-full h-12 text-base font-semibold">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart for Bulk Download
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-full h-12 text-base font-semibold"
                        onClick={() => handleAddToCart()}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-full h-12 text-base font-semibold"
                        onClick={() => handleAddToCart()}
                      >
                        Buy Now
                      </Button>
                      <Button className="flex-1 rounded-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Purchase Plan
                      </Button>
                    </>
                  )}
                </div>
              </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
