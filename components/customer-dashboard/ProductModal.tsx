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

  // Helper to get AVIF URL from original URL
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

  // Helper to get original (non-AVIF) URL
  const getOriginalUrl = (url: string): string => {
    if (!url) return url;
    const urlLower = url.toLowerCase();
    // If already original, return as is
    if (!urlLower.endsWith('.avif')) return url;
    
    // Extract directory and filename
    const lastSlash = url.lastIndexOf('/');
    const dir = lastSlash >= 0 ? url.substring(0, lastSlash + 1) : '';
    const filename = lastSlash >= 0 ? url.substring(lastSlash + 1) : url;
    
    // For MOCKUP files: WDG00000001_MOCKUP.avif -> WDG00000001_MOCKUP.jpg
    if (urlLower.includes('_mockup.avif')) {
      // Try .jpg first, then .png
      return dir + filename.replace(/\.avif$/i, '.jpg');
    }
    
    // For files with _JPG suffix: WDG00000001_JPG.avif -> WDG00000001.jpg
    if (urlLower.includes('_jpg.avif')) {
      return dir + filename.replace(/_JPG\.avif$/i, '.jpg');
    }
    
    // For files with _PNG suffix: WDG00000001_PNG.avif -> WDG00000001.png
    if (urlLower.includes('_png.avif')) {
      return dir + filename.replace(/_PNG\.avif$/i, '.png');
    }
    
    // For regular files: WDG00000001.avif -> WDG00000001.jpg (fallback)
    return dir + filename.replace(/\.avif$/i, '.jpg');
  };

  // Helper to find original JPG/PNG file for an AVIF file
  const findOriginalFile = (avifItem: any, mediaArray: any[], avifIndex?: number): string | null => {
    if (!avifItem) return null;
    
    const avifUrl = typeof avifItem === 'string' ? avifItem : (avifItem?.url || avifItem?.file || '');
    if (!avifUrl.toLowerCase().endsWith('.avif')) return null;
    
    const avifFileName = avifUrl.split('/').pop() || '';
    const avifFileNameLower = avifFileName.toLowerCase();
    const isMockupAvif = avifFileNameLower.includes('_mockup');
    
    // Extract the full base name (including any suffixes before .avif)
    // e.g., WDG00000001_MOCKUP.avif -> WDG00000001_MOCKUP
    // e.g., WDG00000001_JPG.avif -> WDG00000001_JPG
    let baseName = avifFileName.replace(/\.avif$/i, '');
    
    // Get the directory path to help with matching
    const avifDir = avifUrl.substring(0, avifUrl.lastIndexOf('/'));
    
    // Get AVIF media item ID if available (for more precise matching)
    const avifMediaId = typeof avifItem === 'object' ? avifItem?.id : null;
    
    // Try exact match first (most precise) - match by full path and filename
    // Also try to match by position in array if IDs are not available
    const candidates: Array<{ url: string; score: number }> = [];
    
    for (let i = 0; i < mediaArray.length; i++) {
      const mediaItem = mediaArray[i];
      const itemUrl = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || mediaItem?.file || '');
      const itemUrlLower = itemUrl.toLowerCase();
      
      // Skip AVIF files
      if (itemUrlLower.endsWith('.avif')) continue;
      
      const itemFileName = itemUrl.split('/').pop() || '';
      const itemFileNameLower = itemFileName.toLowerCase();
      const itemDir = itemUrl.substring(0, itemUrl.lastIndexOf('/'));
      const itemMediaId = typeof mediaItem === 'object' ? mediaItem?.id : null;
      
      let score = 0;
      let isMatch = false;
      
      // For mockup AVIF, look for exact mockup match
      if (isMockupAvif) {
        if (itemFileNameLower.includes('_mockup') && 
            (itemFileNameLower.endsWith('.jpg') || itemFileNameLower.endsWith('.jpeg') || itemFileNameLower.endsWith('.png'))) {
          // Try exact match: WDG00000001_MOCKUP.avif -> WDG00000001_MOCKUP.jpg
          const itemBaseName = itemFileNameLower.replace(/\.(jpg|jpeg|png)$/, '');
          if (itemBaseName === baseName.toLowerCase()) {
            isMatch = true;
            score = 100; // Base match score
            
            // Bonus points for same directory
            if (itemDir === avifDir) {
              score += 50;
            }
            
            // Bonus points if media IDs match (if available)
            if (avifMediaId && itemMediaId && avifMediaId === itemMediaId) {
              score += 100;
            }
            
            // Bonus points for being close in array position (if indices are similar)
            if (avifIndex !== undefined && Math.abs(i - avifIndex) < 3) {
              score += 10;
            }
          }
        }
      } else {
        // For regular design AVIF
        if ((itemFileNameLower.endsWith('.jpg') || itemFileNameLower.endsWith('.jpeg') || itemFileNameLower.endsWith('.png')) &&
            !itemFileNameLower.includes('_mockup')) {
          const itemBaseName = itemFileNameLower.replace(/\.(jpg|jpeg|png)$/, '');
          
          // Remove _JPG or _PNG from AVIF base name for comparison
          const avifBaseForMatch = baseName.replace(/_JPG$/i, '').replace(/_PNG$/i, '');
          const itemBaseForMatch = itemBaseName.replace(/_JPG$/i, '').replace(/_PNG$/i, '');
          
          if (itemBaseForMatch === avifBaseForMatch.toLowerCase()) {
            isMatch = true;
            score = 100; // Base match score
            
            // Bonus points for same directory
            if (itemDir === avifDir) {
              score += 50;
            }
            
            // Bonus points if media IDs match (if available)
            if (avifMediaId && itemMediaId && avifMediaId === itemMediaId) {
              score += 100;
            }
            
            // Bonus points for being close in array position
            if (avifIndex !== undefined && Math.abs(i - avifIndex) < 3) {
              score += 10;
            }
          }
        }
      }
      
      if (isMatch) {
        candidates.push({ url: itemUrl, score });
      }
    }
    
    // Return the candidate with the highest score
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].url;
    }
    
    // Fallback: try to construct URL from AVIF filename
    return getOriginalUrl(avifUrl);
  };

  // Organize media by type: prioritize AVIF files
  const organizeMediaByType = () => {
    const mediaArray = rawProduct?.media || product.media || [];
    const mockupImages: { url: string; avifUrl: string | null; originalUrl: string; index: number }[] = [];
    const designImages: { url: string; avifUrl: string | null; originalUrl: string; index: number }[] = [];

    // Build maps for efficient lookup
    // Map AVIF URLs to their corresponding original JPG/PNG URLs from the media array
    const avifToOriginalMap = new Map<string, string>();
    
    // Helper function to extract base name from filename (removing random suffixes)
    const getBaseName = (filename: string, isAvif: boolean = false): string => {
      let baseName = filename.toLowerCase();
      
      // Remove extension
      if (isAvif) {
        baseName = baseName.replace(/\.avif$/, '');
      } else {
        baseName = baseName.replace(/\.(jpg|jpeg|png)$/, '');
      }
      
      // Remove random suffix pattern (e.g., _eNarIlh, _nfIoUmh, _oVHZGT7) - 6-8 alphanumeric chars
      // Handle _MOCKUP suffix specially
      if (baseName.includes('_mockup')) {
        // Keep _MOCKUP, remove random suffix after it
        baseName = baseName.replace(/_mockup_[a-z0-9]{6,8}$/i, '_mockup');
      } else {
        // Remove random suffix at the end (but preserve _JPG/_PNG if present in AVIF)
        if (isAvif) {
          // For AVIF, remove _JPG/_PNG first, then remove random suffix
          baseName = baseName.replace(/_jpg$/i, '').replace(/_png$/i, '');
        }
        // Remove random suffix (6-8 alphanumeric chars after underscore)
        baseName = baseName.replace(/_[a-z0-9]{6,8}$/i, '');
      }
      
      return baseName;
    };
    
    // First, collect all non-AVIF JPG/PNG files with their base names for matching
    const originalFilesByBaseName = new Map<string, Array<{ url: string; mediaItem: any }>>();
    
    // Process all media to build relationships
    mediaArray.forEach((mediaItem: any, index: number) => {
      const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || mediaItem?.file || mediaItem?.file_url || '');
      if (!url) return;
      
      const urlLower = url.toLowerCase();
      const fileName = typeof mediaItem === 'string' ? url.split('/').pop() || '' : (mediaItem?.file_name || url.split('/').pop() || '');
      
      // If it's a JPG/PNG (not AVIF), store it for matching
      if (!urlLower.endsWith('.avif') && 
          (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png'))) {
        const baseName = getBaseName(fileName, false);
        
        // Store multiple files with same base name (in case there are duplicates)
        if (!originalFilesByBaseName.has(baseName)) {
          originalFilesByBaseName.set(baseName, []);
        }
        originalFilesByBaseName.get(baseName)!.push({ url, mediaItem });
      }
    });
    
    // Now match AVIF files to their originals
    // Track which originals have been matched to avoid duplicates
    const matchedOriginals = new Set<string>();
    
    mediaArray.forEach((mediaItem: any, index: number) => {
      const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || mediaItem?.file || mediaItem?.file_url || '');
      if (!url) return;
      
      const urlLower = url.toLowerCase();
      
      if (urlLower.endsWith('.avif')) {
        // This is an AVIF file, find its original
        const fileName = typeof mediaItem === 'string' ? url.split('/').pop() || '' : (mediaItem?.file_name || url.split('/').pop() || '');
        const baseName = getBaseName(fileName, true);
        const avifMediaId = typeof mediaItem === 'object' ? mediaItem?.id : null;
        
        // Try to find matching original file(s)
        const matchingOriginals = originalFilesByBaseName.get(baseName);
        if (matchingOriginals && matchingOriginals.length > 0) {
          let bestMatch = null;
          let bestScore = -1;
          
          // Score each potential match
          for (const original of matchingOriginals) {
            // Skip if this original has already been matched (unless it's the only match)
            if (matchedOriginals.has(original.url) && matchingOriginals.length > 1) {
              continue;
            }
            
            let score = 0;
            const originalMediaId = typeof original.mediaItem === 'object' ? original.mediaItem?.id : null;
            
            // Check metadata for relationship (e.g., original_media_path in AVIF metadata)
            if (typeof mediaItem === 'object' && mediaItem?.meta) {
              const meta = typeof mediaItem.meta === 'string' ? JSON.parse(mediaItem.meta) : mediaItem.meta;
              if (meta?.original_media_path === original.url) {
                score += 1000; // Very high score for explicit relationship
              }
            }
            
            // Check if media IDs are related (e.g., AVIF was created from this original)
            // This would require checking Relation table, but we can use position as proxy
            // Files created together are usually close in the array
            const originalIndex = mediaArray.findIndex((item: any) => {
              const itemUrl = typeof item === 'string' ? item : (item?.url || item?.file || '');
              return itemUrl === original.url;
            });
            
            if (originalIndex !== -1) {
              // Closer in array = more likely to be related
              const distance = Math.abs(index - originalIndex);
              score += Math.max(0, 100 - distance * 10);
            }
            
            // Prefer files in the same directory
            const avifDir = url.substring(0, url.lastIndexOf('/'));
            const originalDir = original.url.substring(0, original.url.lastIndexOf('/'));
            if (avifDir === originalDir) {
              score += 50;
            }
            
            // If this is the best match so far, use it
            if (score > bestScore) {
              bestScore = score;
              bestMatch = original;
            }
          }
          
          // If we found a match, use it and mark it as matched
          if (bestMatch) {
            avifToOriginalMap.set(url, bestMatch.url);
            matchedOriginals.add(bestMatch.url);
          } else if (matchingOriginals.length > 0) {
            // If all originals are already matched, use the first one anyway
            // (better than no match)
            avifToOriginalMap.set(url, matchingOriginals[0].url);
          }
        }
      }
    });

    mediaArray.forEach((mediaItem: any, index: number) => {
      let url = '';
      let isMockup = false;
      let isDesign = false;
      let isAvif = false;

      if (typeof mediaItem === 'string') {
        url = mediaItem;
        isAvif = url.toLowerCase().endsWith('.avif');
      } else {
        url = mediaItem?.url || mediaItem?.file || mediaItem?.file_url || '';
        const fileName = (mediaItem?.file_name || '').toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Check if it's AVIF
        isAvif = mediaItem?.is_avif === true || urlLower.endsWith('.avif');
        
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
        // If it's already AVIF, use it directly
        // Otherwise, try to get AVIF URL
        const avifUrl = isAvif ? url : getAvifUrl(url);
        
        // Find original file: if AVIF, find corresponding JPG/PNG; otherwise use current URL
        let originalUrl: string;
        if (isAvif) {
          // First try the pre-built map (most reliable - uses actual file URLs)
          if (avifToOriginalMap.has(url)) {
            originalUrl = avifToOriginalMap.get(url)!;
          } else {
            // Try to find from media array using findOriginalFile (more precise matching)
            const foundOriginal = findOriginalFile(mediaItem, mediaArray, index);
            if (foundOriginal && !foundOriginal.toLowerCase().endsWith('.avif')) {
              originalUrl = foundOriginal;
              // Also add it to the map for future reference
              avifToOriginalMap.set(url, foundOriginal);
            } else {
              // Try to construct URL from AVIF filename as last resort
              const constructedOriginal = getOriginalUrl(url);
              if (constructedOriginal && !constructedOriginal.toLowerCase().endsWith('.avif')) {
                originalUrl = constructedOriginal;
                avifToOriginalMap.set(url, constructedOriginal);
              } else {
                // Last resort: use AVIF as fallback (prevents 404 errors)
                originalUrl = url;
              }
            }
          }
        } else {
          // For non-AVIF files, the current URL is the original
          // But make sure it's a JPG/PNG, not other formats
          const urlLower = url.toLowerCase();
          if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png')) {
            originalUrl = url;
          } else {
            // For other formats, keep as is
            originalUrl = url;
          }
        }
        
        // For thumbnails: use AVIF if available, otherwise use original
        // For main preview: we'll use originalUrl directly
        const displayUrl = isAvif ? url : (avifUrl || url);
        
        if (isMockup) {
          mockupImages.push({ url: displayUrl, avifUrl: isAvif ? url : avifUrl, originalUrl, index });
        } else if (isDesign || isAvif) {
          designImages.push({ url: displayUrl, avifUrl: isAvif ? url : avifUrl, originalUrl, index });
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
      image: product.media[0] || '',
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
      image: product.media[0] || '',
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
                  <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-10 rounded-t-2xl">
                    <h2 className="text-2xl font-bold">{product.title}</h2>
                    <div className="flex items-center gap-2">
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
                              key={`main-preview-${selectedImageIndex}-${selectedImageType}`}
                              src={(() => {
                                // ALWAYS use originalUrl for main preview (JPG/PNG) - never AVIF
                                const selectedImage = currentImages[selectedImageIndex];
                                if (!selectedImage) {
                                  return '';
                                }
                                
                                // Prioritize originalUrl - this should be the JPG/PNG version
                                if (selectedImage.originalUrl && !selectedImage.originalUrl.toLowerCase().endsWith('.avif')) {
                                  return selectedImage.originalUrl;
                                }
                                
                                // If originalUrl is AVIF or not set, try to get it from the URL
                                const currentUrl = selectedImage.url;
                                const urlLower = currentUrl.toLowerCase();
                                
                                // If it's already JPG/PNG, use it
                                if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png')) {
                                  return currentUrl;
                                }
                                
                                // Otherwise, try to construct original URL from AVIF
                                if (urlLower.endsWith('.avif')) {
                                  const constructedOriginal = getOriginalUrl(currentUrl);
                                  if (constructedOriginal && !constructedOriginal.toLowerCase().endsWith('.avif')) {
                                    return constructedOriginal;
                                  }
                                }
                                
                                // Last resort: use the URL as-is (might be AVIF, but better than nothing)
                                return currentUrl;
                              })()}
                              alt={`${product.title} - ${selectedImageType === 'mockup' ? 'Mockup' : 'Design'} ${selectedImageIndex + 1}`}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                // Fallback to AVIF if original fails, then to default
                                const currentSrc = (e.target as HTMLImageElement).src;
                                const selectedImage = currentImages[selectedImageIndex];
                                if (selectedImage) {
                                  const avifUrl = selectedImage.avifUrl || selectedImage.url;
                                  if (avifUrl && avifUrl !== currentSrc && avifUrl.toLowerCase().endsWith('.avif')) {
                                    (e.target as HTMLImageElement).src = avifUrl;
                                  } else {
                                    // Hide image on error instead of showing placeholder
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }
                                }
                              }}
                            />
                            
                            {/* Hover Overlay with Eye Icon */}
                            <button
                              onClick={() => {
                                // Use original URL for full preview (high quality)
                                // Always ensure we get JPG/PNG, not AVIF
                                const selectedImage = currentImages[selectedImageIndex];
                                let originalUrl = selectedImage.originalUrl;
                                
                                // If originalUrl is not set or is AVIF, construct it
                                if (!originalUrl || originalUrl.toLowerCase().endsWith('.avif')) {
                                  const currentUrl = selectedImage.url;
                                  const urlLower = currentUrl.toLowerCase();
                                  
                                  // If current URL is already JPG/PNG, use it
                                  if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png')) {
                                    originalUrl = currentUrl;
                                  } else if (urlLower.endsWith('.avif')) {
                                    // Construct original URL from AVIF
                                    originalUrl = getOriginalUrl(currentUrl);
                                  } else {
                                    originalUrl = currentUrl;
                                  }
                                }
                                
                                setPreviewImage(originalUrl);
                              }}
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
                                  onClick={() => {
                                    setSelectedImageIndex(index);
                                    // Ensure the main preview updates to show the correct image
                                    // The main image src will automatically update via the selectedImageIndex
                                  }}
                                  className={`w-full h-full relative ${
                                    selectedImageIndex === index 
                                      ? 'border-primary ring-2 ring-primary/20 scale-105' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <img
                                    src={image.url} // This will be AVIF
                                    alt={`${product.title} - ${selectedImageType === 'mockup' ? 'Mockup' : 'Design'} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to original if AVIF fails
                                      const originalUrl = image.originalUrl;
                                      const currentSrc = (e.target as HTMLImageElement).src;
                                      if (originalUrl && originalUrl !== currentSrc && currentSrc.endsWith('.avif')) {
                                        (e.target as HTMLImageElement).src = originalUrl;
                                      } else {
                                        // Hide image on error instead of showing placeholder
                                  (e.target as HTMLImageElement).style.display = 'none';
                                      }
                                    }}
                                  />
                                </button>
                                
                                {/* Eye Icon Overlay on Hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Use original URL for full preview (high quality)
                                    // Always ensure we get JPG/PNG, not AVIF
                                    let originalUrl = image.originalUrl;
                                    
                                    // If originalUrl is not set or is AVIF, construct it
                                    if (!originalUrl || originalUrl.toLowerCase().endsWith('.avif')) {
                                      const currentUrl = image.url;
                                      const urlLower = currentUrl.toLowerCase();
                                      
                                      // If current URL is already JPG/PNG, use it
                                      if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png')) {
                                        originalUrl = currentUrl;
                                      } else if (urlLower.endsWith('.avif')) {
                                        // Construct original URL from AVIF
                                        originalUrl = getOriginalUrl(currentUrl);
                                      } else {
                                        originalUrl = currentUrl;
                                      }
                                    }
                                    
                                    setPreviewImage(originalUrl);
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
                        (e.target as HTMLImageElement).style.display = 'none';
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
