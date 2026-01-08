"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Download, Heart, Loader2, Tag, Image as ImageIcon, Package, Hash, Palette, Coins, Info, Eye, ZoomIn, Zap, ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProduct, type TransformedProduct } from "@/lib/utils/transformers";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { convertAvifToJpg as convertAvifToJpgUtil } from "@/lib/utils/transformers";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasActivePlan: boolean;
  product: TransformedProduct;
  isDownloaded?: boolean;
}

export default function ProductModal({ isOpen, onClose, hasActivePlan, product: initialProduct, isDownloaded = false }: ProductModalProps) {
  const { isAuthenticated } = useAuth();
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

  // Use the utility function from transformers
  const convertAvifToJpg = convertAvifToJpgUtil;

  // Organize media by type: mockup vs design (AVIF only for tab display)
  const organizeMediaByType = () => {
    const mediaArray = rawProduct?.media || product.media || [];
    const mockupImages: { url: string; index: number; originalUrl?: string }[] = [];
    const designImages: { url: string; index: number; originalUrl?: string }[] = [];

    mediaArray.forEach((mediaItem: any, index: number) => {
      let url = '';
      let isMockup = false;
      let isDesign = false;
      let isAvif = false;

      if (typeof mediaItem === 'string') {
        url = mediaItem;
        const urlLower = url.toLowerCase();
        isAvif = urlLower.endsWith('.avif');
        isMockup = isAvif && urlLower.includes('mockup.avif');
        isDesign = isAvif && (urlLower.includes('_jpg.avif') || urlLower.includes('_png.avif'));
      } else {
        url = mediaItem?.url || mediaItem?.file || '';
        const fileName = (mediaItem?.file_name || '').toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Check if it's AVIF
        isAvif = mediaItem?.is_avif === true || fileName.endsWith('.avif') || urlLower.endsWith('.avif');
        
        // Check if it's a mockup AVIF file
        isMockup = isAvif && (
                   (mediaItem?.is_mockup === true && mediaItem?.is_avif === true) ||
                   fileName.includes('mockup.avif') ||
                   urlLower.includes('mockup.avif')
                 );
        
        // Check if it's a design AVIF file (JPG or PNG variants)
        // For design tab, we want AVIF files that are JPG/PNG variants (design_JPG.avif or design_PNG.avif)
        isDesign = isAvif && (
                   fileName.includes('_jpg.avif') || 
                   fileName.includes('_png.avif') ||
                   urlLower.includes('_jpg.avif') ||
                   urlLower.includes('_png.avif') ||
                   (mediaItem?.is_jpg_png === true && mediaItem?.is_avif === true && !mediaItem?.is_mockup)
                 );
      }

      if (url && url.trim() !== '' && isAvif) {
        // Only add AVIF files to the tabs
        if (isMockup) {
          mockupImages.push({ url, index, originalUrl: url });
        } else if (isDesign) {
          designImages.push({ url, index, originalUrl: url });
        }
      }
    });

    return { mockupImages, designImages };
  };

  const { mockupImages, designImages } = organizeMediaByType();
  
  // Get current images based on selected type
  const currentImages = selectedImageType === 'mockup' ? mockupImages : designImages;

  // Organize media files by file type for download dropdown
  const organizeMediaByFileType = () => {
    // Check both media and media_files arrays
    const mediaArray = rawProduct?.media || rawProduct?.media_files || product.media || [];
    const filesByType: {
      png: Array<{ url: string; name: string; size?: string; mediaItem: any }>;
      jpg: Array<{ url: string; name: string; size?: string; mediaItem: any }>;
      cdr: Array<{ url: string; name: string; size?: string; mediaItem: any }>;
      eps: Array<{ url: string; name: string; size?: string; mediaItem: any }>;
      mockup: Array<{ url: string; name: string; size?: string; mediaItem: any }>;
    } = {
      png: [],
      jpg: [],
      cdr: [],
      eps: [],
      mockup: [],
    };

    mediaArray.forEach((mediaItem: any) => {
      let url = '';
      let fileName = '';
      let fileSize: number | undefined;

      if (typeof mediaItem === 'string') {
        url = mediaItem;
        fileName = url.split('/').pop() || '';
      } else {
        url = mediaItem?.url || mediaItem?.file || mediaItem?.file_url || '';
        fileName = mediaItem?.file_name || url.split('/').pop() || '';
        fileSize = mediaItem?.file_size || mediaItem?.size;
      }

      if (!url || !fileName) return;

      const fileNameLower = fileName.toLowerCase();
      const urlLower = url.toLowerCase();
      
      // Check if it's a mockup (base name is "mockup" without extension)
      // Extract base name without extension
      const baseName = fileNameLower.split('.')[0];
      const isMockup = mediaItem?.is_mockup === true || 
                      mediaItem?.is_mockup === 'true' || 
                      mediaItem?.is_mockup === 1 ||
                      baseName === 'mockup' ||
                      fileNameLower.includes('mockup') ||
                      urlLower.includes('mockup');

      // Format file size
      const formattedSize = fileSize ? formatFileSize(fileSize) : undefined;

      const fileInfo = {
        url,
        name: fileName,
        size: formattedSize,
        mediaItem,
      };

      if (isMockup) {
        filesByType.mockup.push(fileInfo);
      } else if (fileNameLower.endsWith('.png')) {
        filesByType.png.push(fileInfo);
      } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
        filesByType.jpg.push(fileInfo);
      } else if (fileNameLower.endsWith('.cdr')) {
        filesByType.cdr.push(fileInfo);
      } else if (fileNameLower.endsWith('.eps')) {
        filesByType.eps.push(fileInfo);
      }
    });

    return filesByType;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Download individual file
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    // Check authentication before downloading
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      onClose(); // Close modal
      return;
    }

    try {
      // Get the full URL if it's a relative path
      let fullUrl = fileUrl;
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        // It's a relative path, need to make it absolute
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fullUrl = fileUrl.startsWith('/') 
          ? `${apiBaseUrl}${fileUrl}`
          : `${apiBaseUrl}/${fileUrl}`;
      }
      
      const token = localStorage.getItem('wedesign_access_token');
      const response = await fetch(fullUrl, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };
  
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
    // Check authentication before adding to cart
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      onClose(); // Close modal
      return;
    }

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
      router.push('/customer-dashboard?view=cart');
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleDownloadFree = async () => {
    // Check authentication before downloading
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      onClose(); // Close modal
      return;
    }

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

  // Download handler for downloaded products (uses ZIP download)
  const handleDownloadDownloaded = async () => {
    // Check authentication before downloading
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      onClose(); // Close modal
      return;
    }

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
        description: error.message || "Failed to download product.",
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
    // Check authentication before adding to wishlist
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      onClose(); // Close modal
      return;
    }

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
                  {/* Header with action buttons - Sticky */}
                  <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-border bg-card sticky top-0 z-10 rounded-t-2xl">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate min-w-0 flex-1 pr-2">{product.title}</h2>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <TooltipProvider>
                        {/* Add to Cart and Wishlist buttons (if not free and not downloaded) */}
                        {!isDownloaded && !isFree() && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleAddToCart()}
                                  className="p-2 hover:bg-muted rounded-full transition-colors"
                                  aria-label="Add to Cart"
                                >
                                  <ShoppingCart className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to Cart</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={handleAddToWishlist}
                                  className="p-2 hover:bg-muted rounded-full transition-colors"
                                  aria-label="Add to wishlist"
                                >
                                  <Heart 
                                    className={`w-5 h-5 ${isInWishlist(String(product.id)) ? 'fill-destructive text-destructive' : ''}`} 
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isInWishlist(String(product.id)) ? 'Remove from Wishlist' : 'Add to Wishlist'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        {/* Download Button with Dropdown (if product is downloaded or free) */}
                        {(isDownloaded || isFree()) && (
                          <DropdownMenu>
                            <div className="flex items-center">
                              <button
                                onClick={isFree() ? handleDownloadFree : handleDownloadDownloaded}
                                disabled={isDownloading}
                                className="px-3 py-2 hover:bg-muted rounded-l-full transition-colors disabled:opacity-50 flex items-center gap-2"
                                aria-label="Download ZIP"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Download className="w-5 h-5" />
                                )}
                                <span className="text-sm font-medium">Download</span>
                              </button>
                              <DropdownMenuTrigger asChild>
                                <button
                                  disabled={isDownloading}
                                  className="p-2 hover:bg-muted rounded-r-full transition-colors disabled:opacity-50 border-l border-border"
                                  aria-label="Download options"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                            </div>
                            <DropdownMenuContent align="end" className="w-64">
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                FILE TYPE
                              </div>
                              <DropdownMenuSeparator />
                              {/* Download All as ZIP option */}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isFree()) {
                                    handleDownloadFree();
                                  } else {
                                    handleDownloadDownloaded();
                                  }
                                }}
                                className="flex items-center justify-between cursor-pointer font-medium"
                              >
                                <span className="text-sm">Download All as ZIP</span>
                                <Download className="w-4 h-4" />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(() => {
                                const filesByType = organizeMediaByFileType();
                                const hasFiles = filesByType.png.length > 0 || 
                                                filesByType.jpg.length > 0 || 
                                                filesByType.cdr.length > 0 || 
                                                filesByType.eps.length > 0 || 
                                                filesByType.mockup.length > 0;
                                
                                if (!hasFiles) {
                                  return (
                                    <DropdownMenuItem disabled>
                                      <span className="text-sm text-muted-foreground">No files available</span>
                                    </DropdownMenuItem>
                                  );
                                }

                                return (
                                  <>
                                    {filesByType.png.length > 0 && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(filesByType.png[0].url, filesByType.png[0].name);
                                        }}
                                        className="flex items-center justify-between cursor-pointer"
                                      >
                                        <span className="text-sm">PNG</span>
                                        {filesByType.png[0].size && (
                                          <span className="text-xs text-muted-foreground">{filesByType.png[0].size}</span>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {filesByType.jpg.length > 0 && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(filesByType.jpg[0].url, filesByType.jpg[0].name);
                                        }}
                                        className="flex items-center justify-between cursor-pointer"
                                      >
                                        <span className="text-sm">JPG</span>
                                        {filesByType.jpg[0].size && (
                                          <span className="text-xs text-muted-foreground">{filesByType.jpg[0].size}</span>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {filesByType.cdr.length > 0 && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(filesByType.cdr[0].url, filesByType.cdr[0].name);
                                        }}
                                        className="flex items-center justify-between cursor-pointer"
                                      >
                                        <span className="text-sm">CDR</span>
                                        {filesByType.cdr[0].size && (
                                          <span className="text-xs text-muted-foreground">{filesByType.cdr[0].size}</span>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {filesByType.eps.length > 0 && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(filesByType.eps[0].url, filesByType.eps[0].name);
                                        }}
                                        className="flex items-center justify-between cursor-pointer"
                                      >
                                        <span className="text-sm">EPS</span>
                                        {filesByType.eps[0].size && (
                                          <span className="text-xs text-muted-foreground">{filesByType.eps[0].size}</span>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {filesByType.mockup.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadFile(filesByType.mockup[0].url, filesByType.mockup[0].name);
                                          }}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <span className="text-sm">Mockup</span>
                                          {filesByType.mockup[0].size && (
                                            <span className="text-xs text-muted-foreground">{filesByType.mockup[0].size}</span>
                                          )}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Close Button - Rightmost */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onClose}
                              className="p-2 hover:bg-muted rounded-full transition-colors"
                              aria-label="Close modal"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Close</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                              onClick={() => setPreviewImage(convertAvifToJpg(currentImages[selectedImageIndex].url))}
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
                                    setPreviewImage(convertAvifToJpg(image.url));
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

                      {/* Media Files - What you'll get */}
                      {product.media.length > 0 && (() => {
                        const filesByType = organizeMediaByFileType();
                        const availableTypes: string[] = [];
                        
                        if (filesByType.cdr.length > 0) availableTypes.push('CDR');
                        if (filesByType.jpg.length > 0) availableTypes.push('JPG');
                        if (filesByType.png.length > 0) availableTypes.push('PNG');
                        if (filesByType.eps.length > 0) availableTypes.push('EPS');
                        if (filesByType.mockup.length > 0) availableTypes.push('Mockup');
                        
                        return (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-xs font-medium">Media Files</span>
                            </div>
                            <p className="text-sm font-semibold mb-2">
                              {product.media.length} file{product.media.length !== 1 ? 's' : ''} available
                            </p>
                            {availableTypes.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1.5">What you'll get:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {availableTypes.map((type) => (
                                    <span
                                      key={type}
                                      className="text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md font-medium"
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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

                        {rawProduct?.studio_wedesignz_auto_name && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Building2 className="w-4 h-4" />
                              <span className="text-xs font-medium">Designer</span>
                            </div>
                            <p className="font-mono text-sm font-semibold">{rawProduct.studio_wedesignz_auto_name}</p>
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
                              <Coins className="w-4 h-4" />
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
                    </div>
                  </div>
                  </div>

                  {/* Footer with Buy Now button (if not free and not downloaded) */}
                  {!isDownloaded && !isFree() && (
                    <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-6 rounded-b-2xl z-10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => handleAddToCart()}
                          variant="outline"
                          className="flex-1 h-12 rounded-full"
                          size="lg"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          onClick={handleBuyNow}
                          className="flex-1 h-12 rounded-full"
                          size="lg"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  )}
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
