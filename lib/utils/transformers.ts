/**
 * Data transformation utilities
 * Converts backend API responses to frontend component formats
 */

export interface TransformedProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "Active" | "Inactive" | "Draft" | "Deleted";
  product_plan_type: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  media: string[];
  sub_products: {
    id: number;
    product_number: string;
    color: string;
    price: number;
    stock: number;
    status: "Show" | "Hide";
  }[];
}

export interface TransformedCategory {
  id: string;
  title: string;
  icon?: any;
  iconName?: string; // Lucide icon name from API
  color?: string;
  borderColor?: string;
  iconColor?: string;
  isActive: boolean;
  productCount?: number;
  description?: string;
  parent?: string | null;
  subcategories?: TransformedCategory[];
}

/**
 * Transform backend product to frontend format
 */
export function transformProduct(apiProduct: any): TransformedProduct {
  // Extract category name from category object
  const categoryName = apiProduct.category?.name || apiProduct.category || 'Uncategorized';
  
  // Transform status to match frontend expectations
  const statusMap: Record<string, "Active" | "Inactive" | "Draft" | "Deleted"> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'draft': 'Draft',
    'deleted': 'Deleted',
  };
  const transformedStatus = statusMap[apiProduct.status?.toLowerCase()] || 'Active';
  
  // Extract media URLs from media array with priority: AVIF mockup > AVIF JPG/PNG > mockup > JPG/PNG > others
  const mediaItems = (apiProduct.media || []).map((mediaItem: any) => {
    if (typeof mediaItem === 'string') {
      const urlLower = mediaItem.toLowerCase();
      const is_avif = urlLower.endsWith('.avif');
      return { url: mediaItem, is_mockup: false, is_png: false, is_jpg_png: false, is_avif, file_name: '' };
    }
    // Handle media object structure: backend returns {file: url, url: url, file_name: ...}
    // file and url are both strings (absolute URLs) from the backend
    const url = mediaItem?.url || mediaItem?.file || (typeof mediaItem?.file === 'string' ? mediaItem.file : '') || '';
    const file_name = mediaItem?.file_name || '';
    
    // Check if filename contains "mockup" (case-insensitive)
    const fileNameLower = file_name.toLowerCase();
    const is_mockup = mediaItem?.is_mockup || (file_name && fileNameLower.includes('mockup'));
    
    // Check if it's a JPG or PNG file
    const is_jpg_png = mediaItem?.is_jpg_png || (file_name && (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png')));
    
    // Check if it's a PNG file (for backward compatibility)
    const is_png = mediaItem?.is_jpg_png || (file_name && fileNameLower.endsWith('.png'));
    
    // Check if it's an AVIF file
    const is_avif = mediaItem?.is_avif || (file_name && fileNameLower.endsWith('.avif')) || (url.toLowerCase().endsWith('.avif'));
    
    return {
      url,
      is_mockup,
      is_png,
      is_jpg_png,
      is_avif,
      file_name,
    };
  }).filter((item: any) => item.url && item.url.trim() !== '');

  // Sort media: AVIF mockup first, then AVIF JPG/PNG, then mockup, then JPG/PNG, then others
  mediaItems.sort((a: any, b: any) => {
    // Priority 1: AVIF mockup files
    if (a.is_avif && a.is_mockup && !(b.is_avif && b.is_mockup)) return -1;
    if (b.is_avif && b.is_mockup && !(a.is_avif && a.is_mockup)) return 1;
    // Priority 2: AVIF JPG/PNG files
    if (a.is_avif && a.is_jpg_png && !(b.is_avif && b.is_jpg_png)) return -1;
    if (b.is_avif && b.is_jpg_png && !(a.is_avif && a.is_jpg_png)) return 1;
    // Priority 3: Regular mockup files (non-AVIF)
    if (a.is_mockup && !b.is_mockup) return -1;
    if (!a.is_mockup && b.is_mockup) return 1;
    // Priority 4: Regular JPG/PNG files (non-AVIF)
    if (a.is_jpg_png && !b.is_jpg_png) return -1;
    if (!a.is_jpg_png && b.is_jpg_png) return 1;
    return 0;
  });

  // Filter out raw JPG/PNG files that aren't mockups - only keep AVIF files and mockups
  const filteredMediaItems = mediaItems.filter((item: any) => {
    // Keep AVIF files (any type - mockup or design)
    if (item.is_avif) return true;
    // Keep mockup files (any format)
    if (item.is_mockup) return true;
    // Exclude raw JPG/PNG files that aren't mockups
    return false;
  });

  // Extract URLs in priority order - only include valid URLs
  const mediaUrls = filteredMediaItems.map((item: any) => item.url).filter((url: string) => url && url.trim() !== '');

  // Transform sub_products if they exist, otherwise create empty array
  // Note: Backend might not have sub_products, so we'll create a default one from the product
  let subProducts: TransformedProduct['sub_products'] = [];
  
  if (apiProduct.sub_products && Array.isArray(apiProduct.sub_products) && apiProduct.sub_products.length > 0) {
    subProducts = apiProduct.sub_products.map((sp: any) => ({
      id: sp.id || 0,
      product_number: sp.product_number || apiProduct.product_number || `PROD-${apiProduct.id}`,
      color: sp.color || apiProduct.color || '#000000',
      price: sp.price || apiProduct.price || 0,
      stock: sp.stock || 0,
      status: sp.status === 'show' || sp.status === 'Show' ? 'Show' : 'Hide',
    }));
  } else {
    // Create a default sub-product from the main product
    subProducts = [{
      id: apiProduct.id || 0,
      product_number: apiProduct.product_number || `PROD-${apiProduct.id}`,
      color: apiProduct.color || '#000000',
      price: apiProduct.price || 0,
      stock: 0, // Default stock
      status: 'Show' as const,
    }];
  }

  // Extract creator name
  const createdBy = apiProduct.created_by?.username || 
                    apiProduct.created_by?.first_name || 
                    apiProduct.created_by || 
                    'Unknown Designer';
  
  const updatedBy = apiProduct.updated_by?.username || 
                    apiProduct.updated_by?.first_name || 
                    apiProduct.updated_by || 
                    'Unknown Designer';

  return {
    id: apiProduct.id,
    title: apiProduct.title || 'Untitled Product',
    description: apiProduct.description || '',
    category: categoryName,
    status: transformedStatus,
    product_plan_type: apiProduct.product_plan_type || 'Basic',
    created_by: createdBy,
    created_at: apiProduct.created_at || new Date().toISOString(),
    updated_by: updatedBy,
    updated_at: apiProduct.updated_at || new Date().toISOString(),
    media: mediaUrls, // No fallback - only show actual media URLs
    sub_products: subProducts,
  };
}

/**
 * Transform backend category to frontend format
 */
export function transformCategory(apiCategory: any, iconMap?: Record<string, any>): TransformedCategory {
  // Default icon mapping (can be customized)
  const defaultIcons: Record<string, string> = {
    'jerseys': '👕',
    'vectors': '🎨',
    'psd': '📁',
    'icons': '⭐',
    'mockups': '🖼️',
    'illustrations': '🎭',
    '3d-models': '🎲',
  };

  const categoryName = apiCategory.name || '';
  const categoryId = apiCategory.id?.toString() || '';
  const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-');

  // Get product count if available (prioritize products_count from API)
  const productCount = apiCategory.products_count !== undefined 
    ? apiCategory.products_count 
    : apiCategory.product_count || 
      apiCategory.active_products || 
      undefined;

  // Color mapping based on category name
  const colorMap: Record<string, { color: string; borderColor: string; iconColor: string }> = {
    'jerseys': {
      color: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
    },
    'vectors': {
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-500',
    },
    'psd': {
      color: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-500',
    },
    'icons': {
      color: 'from-yellow-500/10 to-amber-500/10',
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-500',
    },
    'mockups': {
      color: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-500',
    },
    'illustrations': {
      color: 'from-indigo-500/10 to-violet-500/10',
      borderColor: 'border-indigo-500/20',
      iconColor: 'text-indigo-500',
    },
    '3d-models': {
      color: 'from-rose-500/10 to-pink-500/10',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-500',
    },
  };

  const colors = colorMap[categoryKey] || {
    color: 'from-gray-500/10 to-gray-500/10',
    borderColor: 'border-gray-500/20',
    iconColor: 'text-gray-500',
  };

  // Get icon: first try iconMap (backward compatibility), then try icon_name from API
  // icon_name will be resolved in the component using dynamic icon lookup
  let iconComponent = undefined;
  if (iconMap?.[categoryKey]) {
    // Use iconMap first for backward compatibility
    iconComponent = iconMap[categoryKey];
  }
  // Note: If apiCategory.icon_name exists, it will be stored in iconName field
  // Components should check iconName first, then fall back to icon

  // Transform subcategories if they exist
  const subcategories = apiCategory.subcategories 
    ? apiCategory.subcategories.map((sub: any) => transformCategory(sub, iconMap))
    : undefined;

  return {
    id: categoryId,
    title: categoryName,
    icon: iconComponent,
    iconName: apiCategory.icon_name || undefined, // Store icon_name separately for dynamic loading
    color: colors.color,
    borderColor: colors.borderColor,
    iconColor: colors.iconColor,
    isActive: true, // Assume active if returned from API
    productCount,
    description: apiCategory.description || `Browse ${categoryName} designs`,
    parent: apiCategory.parent?.name || apiCategory.parent || null,
    subcategories,
  };
}

/**
 * Transform array of products
 */
export function transformProducts(apiProducts: any[]): TransformedProduct[] {
  return apiProducts.map(transformProduct);
}

/**
 * Transform array of categories
 */
export function transformCategories(apiCategories: any[], iconMap?: Record<string, any>): TransformedCategory[] {
  return apiCategories.map(cat => transformCategory(cat, iconMap));
}

/**
 * Convert JPG/PNG URL to AVIF equivalent for display
 * Converts design.jpg -> design_JPG.avif (for design images)
 * Leaves other URLs as-is
 */
export function preferAvifForDisplay(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  const urlLower = imageUrl.toLowerCase();
  
  // If already AVIF, return as-is
  if (urlLower.endsWith('.avif')) {
    return imageUrl;
  }
  
  // Convert design.jpg to design_JPG.avif
  if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
    // Check if it's a design file (not mockup)
    if (!urlLower.includes('mockup')) {
      // Replace .jpg/.jpeg with _JPG.avif
      return imageUrl.replace(/\.(jpg|jpeg)$/i, '_JPG.avif');
    }
  }
  
  // Convert design.png to design_PNG.avif
  if (urlLower.endsWith('.png')) {
    if (!urlLower.includes('mockup')) {
      return imageUrl.replace(/\.png$/i, '_PNG.avif');
    }
  }
  
  // Return original if no conversion needed
  return imageUrl;
}

/**
 * Convert AVIF URL back to JPG/PNG for preview
 * Converts design_JPG.avif -> design.jpg
 * Converts design_PNG.avif -> design.png
 * Converts mockup.avif -> mockup.jpg
 */
export function convertAvifToJpg(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  const urlLower = imageUrl.toLowerCase();
  
  // If it's not an AVIF file, return as-is
  if (!urlLower.endsWith('.avif')) {
    return imageUrl;
  }
  
  // Convert WDG00000001_MOCKUP.avif to WDG00000001_MOCKUP.jpg
  if (urlLower.includes('_mockup.avif')) {
    return imageUrl.replace(/_mockup\.avif$/i, '_MOCKUP.jpg');
  }
  
  // Convert WDG00000001_JPG.avif to WDG00000001.jpg
  if (urlLower.includes('_jpg.avif')) {
    return imageUrl.replace(/_jpg\.avif$/i, '.jpg');
  }
  
  // Convert WDG00000001_PNG.avif to WDG00000001.png
  if (urlLower.includes('_png.avif')) {
    return imageUrl.replace(/_png\.avif$/i, '.png');
  }
  
  // Fallback: try to replace .avif with .jpg
  return imageUrl.replace(/\.avif$/i, '.jpg');
}

