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
  
  // Extract media URLs from media array
  const mediaUrls = (apiProduct.media || []).map((mediaItem: any) => {
    if (typeof mediaItem === 'string') {
      return mediaItem;
    }
    // Handle media object structure: {file: {url: ...}} or {url: ...}
    return mediaItem?.file?.url || mediaItem?.url || '';
  }).filter((url: string) => url);

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
    media: mediaUrls.length > 0 ? mediaUrls : ['/generated_images/Brand_Identity_Design_67fa7e1f.png'], // Fallback image
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

  // Get product count if available
  const productCount = apiCategory.product_count || 
                       apiCategory.active_products || 
                       apiCategory.products_count || 
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

  // Transform subcategories if they exist
  const subcategories = apiCategory.subcategories 
    ? apiCategory.subcategories.map((sub: any) => transformCategory(sub, iconMap))
    : undefined;

  return {
    id: categoryId,
    title: categoryName,
    icon: iconMap?.[categoryKey],
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

