"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Download, CreditCard, Heart, Loader2, Tag, Image as ImageIcon, Package, Hash, Palette, DollarSign, Info, Eye, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProduct, type TransformedProduct } from "@/lib/utils/transformers";
import { useRouter } from "next/navigation";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasActivePlan: boolean;
  product: TransformedProduct;
}

export default function ProductModal({ isOpen, onClose, hasActivePlan, product: initialProduct }: ProductModalProps) {
  const { addToCart, addToWishlist, isInWishlist } = useCartWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedImageType, setSelectedImageType] = useState<'mockup' | 'design'>('mockup');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hoveredThumbnailIndex, setHoveredThumbnailIndex] = useState<number | null>(null);
  const [isMainImageHovered, setIsMainImageHovered] = useState(false);

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

  // Organize media by type: mockup vs design (JPG/PNG)
  const organizeMediaByType = () => {
    const mediaArray = rawProduct?.media || product.media || [];
    const mockupImages: { url: string; index: number }[] = [];
    const designImages: { url: string; index: number }[] = [];

    mediaArray.forEach((mediaItem: any, index: number) => {
      let url = '';
      let isMockup = false;
      let isDesign = false;

      if (typeof mediaItem === 'string') {
        url = mediaItem;
      } else {
        url = mediaItem?.url || mediaItem?.file || '';
        const fileName = (mediaItem?.file_name || '').toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Check if it's a mockup
        isMockup = mediaItem?.is_mockup === true || 
                   mediaItem?.is_mockup === 'true' || 
                   mediaItem?.is_mockup === 1 ||
                   fileName.includes('mockup') ||
                   urlLower.includes('mockup');
        
        // Check if it's a design image (JPG or PNG)
        isDesign = fileName.endsWith('.jpg') || 
                   fileName.endsWith('.jpeg') || 
                   fileName.endsWith('.png') ||
                   urlLower.includes('.jpg') ||
                   urlLower.includes('.jpeg') ||
                   urlLower.includes('.png');
      }

      if (url && url.trim() !== '') {
        if (isMockup) {
          mockupImages.push({ url, index });
        } else if (isDesign) {
          designImages.push({ url, index });
        }
      }
    });

    return { mockupImages, designImages };
  };

  const { mockupImages, designImages } = organizeMediaByType();
  
  // Get current images based on selected type
  const currentImages = selectedImageType === 'mockup' ? mockupImages : designImages;
  
  // Ensure selected image index is valid
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
      // Auto-select mockup if available, otherwise design
      if (mockupImages.length > 0) {
        setSelectedImageType('mockup');
      } else if (designImages.length > 0) {
        setSelectedImageType('design');
      }
    }
  }, [isOpen, product.id, mockupImages.length, designImages.length]);

  // Reset index when switching image type
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedImageType]);

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

  const handleBuyNow = async () => {
    try {
      await handleAddToCart();
      // Redirect to cart page after adding to cart
      router.push('/customer-dashboard/cart');
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleDownloadFree = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      const blob = await apiClient.downloadProductZip(product.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.title?.replace(/[^a-z0-9]/gi, '_') || 'design'}_${product.id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your design files are being downloaded as a ZIP file.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download design files.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Check if product is free (price is 0 or null, or product_plan_type is 'free')
  const isFree = () => {
    // Check product_plan_type first
    if (product.product_plan_type?.toLowerCase() === 'free' || rawProduct?.product_plan_type?.toLowerCase() === 'free') {
      return true;
    }
    
    // Check main product price
    const mainPrice = rawProduct?.price || product.sub_products[0]?.price || 0;
    if (mainPrice === 0 || mainPrice === null || mainPrice === undefined) {
      return true;
    }
    
    // Check all sub_products prices - if all are 0, product is free
    if (product.sub_products && product.sub_products.length > 0) {
      const allFree = product.sub_products.every((sp: any) => {
        const spPrice = sp.price || 0;
        return spPrice === 0 || spPrice === null || spPrice === undefined;
      });
      return allFree;
    }
    
    return false;
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
                      {/* Image Type Tabs */}
                      {(mockupImages.length > 0 || designImages.length > 0) && (
                        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                          {mockupImages.length > 0 && (
                            <button
                              onClick={() => setSelectedImageType('mockup')}
                              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                selectedImageType === 'mockup'
                                  ? 'bg-background text-primary shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Mockup {mockupImages.length > 1 && `(${mockupImages.length})`}
                            </button>
                          )}
                          {designImages.length > 0 && (
                            <button
                              onClick={() => setSelectedImageType('design')}
                              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                selectedImageType === 'design'
                                  ? 'bg-background text-primary shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Design {designImages.length > 1 && `(${designImages.length})`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Main Image */}
                      <div 
                        className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border group cursor-pointer"
                        onMouseEnter={() => setIsMainImageHovered(true)}
                        onMouseLeave={() => setIsMainImageHovered(false)}
                      >
                        {currentImages.length > 0 && currentImages[selectedImageIndex] ? (
                          <>
                            <img
                              src={currentImages[selectedImageIndex].url}
                              alt={`${product.title} - ${selectedImageType === 'mockup' ? 'Mockup' : 'Design'} ${selectedImageIndex + 1}`}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                              }}
                            />
                            
                            {/* Hover Overlay with Eye Icon */}
                            <button
                              onClick={() => setPreviewImage(currentImages[selectedImageIndex].url)}
                              className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-10 ${
                                isMainImageHovered 
                                  ? 'opacity-100 pointer-events-auto' 
                                  : 'opacity-0 pointer-events-none'
                              }`}
                              aria-label="View full size image"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 transition-colors">
                                  <Eye className="w-6 h-6 text-white drop-shadow-lg" />
                                </div>
                                <span className="text-white text-sm font-medium drop-shadow-lg">Click to view full size</span>
                              </div>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="w-16 h-16 mx-auto mb-2 text-muted-foreground/30" />
                              <p className="text-sm text-muted-foreground">
                                No {selectedImageType === 'mockup' ? 'mockup' : 'design'} image available
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Thumbnail Gallery */}
                      {currentImages.length > 1 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {selectedImageType === 'mockup' ? 'Mockup' : 'Design'} Images
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            {currentImages.map((image, index) => (
                              <div
                                key={index}
                                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group"
                                onMouseEnter={() => setHoveredThumbnailIndex(index)}
                                onMouseLeave={() => setHoveredThumbnailIndex(null)}
                              >
                                <button
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`w-full h-full relative ${
                                    selectedImageIndex === index 
                                      ? 'border-primary ring-2 ring-primary/20 scale-105' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <img
                                    src={image.url}
                                    alt={`${product.title} - ${selectedImageType === 'mockup' ? 'Mockup' : 'Design'} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                                    }}
                                  />
                                </button>
                                
                                {/* Eye Icon Overlay on Hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(image.url);
                                  }}
                                  className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-10 ${
                                    hoveredThumbnailIndex === index 
                                      ? 'opacity-100 pointer-events-auto' 
                                      : 'opacity-0 pointer-events-none'
                                  }`}
                                >
                                  <Eye className="w-6 h-6 text-white drop-shadow-lg" />
                                </button>
                              </div>
                            ))}
                          </div>
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
                      {isFree() ? (
                        <Button 
                          className="flex-1 rounded-full h-12 text-base font-semibold"
                          onClick={handleDownloadFree}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5 mr-2" />
                              Download Free
                            </>
                          )}
                        </Button>
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
                            onClick={handleBuyNow}
                          >
                            Buy Now
                          </Button>
                        </>
                      )}
                      <Button 
                        className="flex-1 rounded-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        onClick={() => {
                          onClose();
                          router.push('/customer-dashboard/plans');
                        }}
                      >
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

          {/* Full Preview Modal */}
          <AnimatePresence>
            {previewImage && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewImage(null)}
                  className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                  >
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                      aria-label="Close preview"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    
                    <img
                      src={previewImage}
                      alt={`${product.title} - Full Preview`}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                      }}
                    />
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
