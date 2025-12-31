/**
 * Cart and Wishlist data transformation utilities
 * Converts backend API responses to frontend component formats
 */

import { CartItem, WishlistItem } from '@/contexts/CartWishlistContext';

/**
 * Helper function to make absolute URL
 */
const makeAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (apiBaseUrl && url.startsWith('/')) {
    return `${apiBaseUrl}${url}`;
  }
  if (apiBaseUrl && !url.startsWith('/')) {
    return `${apiBaseUrl}/${url}`;
  }
  return url;
};

/**
 * Transform backend cart item to frontend CartItem format
 */
export function transformCartItem(apiCartItem: any): CartItem {
  const product = apiCartItem.product || {};
  
  // Extract media URLs - handle different media structures
  const mediaUrls = (product.media || []).map((mediaItem: any) => {
    if (typeof mediaItem === 'string') {
      return makeAbsoluteUrl(mediaItem);
    }
    // Try different possible URL properties
    const url = mediaItem?.file_url || 
                mediaItem?.url || 
                mediaItem?.file?.url || 
                mediaItem?.file ||
                '';
    return makeAbsoluteUrl(url);
  }).filter((url: string | null): url is string => !!url);

  // Extract category name
  const categoryName = product.category?.name || product.category || 'Uncategorized';
  
  // Extract tags
  const tags = (product.tags || []).map((tag: any) => 
    typeof tag === 'string' ? tag : tag.name || ''
  ).filter(Boolean);

  // Extract creator name
  const designer = product.created_by?.username || 
                   product.created_by?.first_name || 
                   product.created_by || 
                   'Unknown Designer';

  return {
    id: apiCartItem.id.toString(),
    productId: product.id?.toString() || apiCartItem.product_id?.toString() || '',
    title: product.title || 'Untitled Product',
    designer,
    category: categoryName,
    price: parseFloat(product.price || 0),
    image: mediaUrls[0] || '',
    tags: tags.length > 0 ? tags : [categoryName],
    license: 'Standard License', // Default license
    subProductId: undefined, // Backend doesn't have sub-products in cart
    color: product.color || undefined,
  };
}

/**
 * Transform backend cart item to frontend WishlistItem format
 */
export function transformWishlistItem(apiCartItem: any): WishlistItem {
  const product = apiCartItem.product || {};
  
  // Extract media URLs - handle different media structures
  const mediaUrls = (product.media || []).map((mediaItem: any) => {
    if (typeof mediaItem === 'string') {
      return makeAbsoluteUrl(mediaItem);
    }
    // Try different possible URL properties
    const url = mediaItem?.file_url || 
                mediaItem?.url || 
                mediaItem?.file?.url || 
                mediaItem?.file ||
                '';
    return makeAbsoluteUrl(url);
  }).filter((url: string | null): url is string => !!url);

  // Extract category name
  const categoryName = product.category?.name || product.category || 'Uncategorized';
  
  // Extract tags
  const tags = (product.tags || []).map((tag: any) => 
    typeof tag === 'string' ? tag : tag.name || ''
  ).filter(Boolean);

  // Extract creator name
  const designer = product.created_by?.username || 
                   product.created_by?.first_name || 
                   product.created_by || 
                   'Unknown Designer';

  // Determine if premium
  const isPremium = product.product_plan_type?.toLowerCase().includes('premium') || 
                    parseFloat(product.price || 0) > 0;

  return {
    id: apiCartItem.id.toString(),
    productId: product.id?.toString() || apiCartItem.product_id?.toString() || '',
    title: product.title || 'Untitled Product',
    designer,
    category: categoryName,
    price: parseFloat(product.price || 0),
    image: mediaUrls[0] || '',
    tags: tags.length > 0 ? tags : [categoryName],
    isPremium,
    isPurchased: apiCartItem.is_purchased || false,
  };
}

/**
 * Transform array of cart items
 */
export function transformCartItems(apiCartItems: any[]): CartItem[] {
  return apiCartItems.map(transformCartItem);
}

/**
 * Transform array of wishlist items
 */
export function transformWishlistItems(apiCartItems: any[]): WishlistItem[] {
  return apiCartItems.map(transformWishlistItem);
}

