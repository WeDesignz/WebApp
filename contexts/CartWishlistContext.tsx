"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { transformCartItems, transformWishlistItems, transformCartItem, transformWishlistItem } from '@/lib/utils/cartTransformers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  designer: string;
  category: string;
  price: number;
  image: string;
  tags: string[];
  license: string;
  subProductId?: string;
  color?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  designer: string;
  category: string;
  price: number;
  image: string;
  tags: string[];
  isPremium: boolean;
}

interface CartWishlistContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  isLoadingCart: boolean;
  isLoadingWishlist: boolean;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  moveToWishlist: (itemId: string) => Promise<void>;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  isInCart: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
  getWishlistCount: () => number;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export const CartWishlistProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Fetch cart from API - only when authenticated
  const { data: cartData, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await apiClient.getCart();
      if (response.error) {
        // Don't throw for 401 - user is just not authenticated
        if (response.errorDetails?.statusCode === 401) {
          return [];
        }
        throw new Error(response.error);
      }
      return transformCartItems(response.data?.cart_items || []);
    },
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch wishlist from API - only when authenticated
  const { data: wishlistData, isLoading: isLoadingWishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await apiClient.getWishlist();
      if (response.error) {
        // Don't throw for 401 - user is just not authenticated
        if (response.errorDetails?.statusCode === 401) {
          return [];
        }
        throw new Error(response.error);
      }
      return transformWishlistItems(response.data?.wishlist_items || []);
    },
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const cartItems = cartData || [];
  const wishlistItems = wishlistData || [];

  // Optimistic update helper
  const optimisticUpdate = useCallback(async <T,>(
    queryKey: string[],
    optimisticData: T,
    apiCall: () => Promise<any>,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });

    // Snapshot previous value
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Optimistically update
    queryClient.setQueryData<T>(queryKey, optimisticData);

    try {
      const response = await apiCall();
      if (response.error) {
        throw new Error(response.error);
      }
      // Refetch to get latest data
      await queryClient.invalidateQueries({ queryKey });
      onSuccess?.();
    } catch (error: any) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      onError?.(error);
      throw error;
    }
  }, [queryClient]);

  const addToCart = useCallback(async (item: CartItem) => {
    const productId = parseInt(item.productId);
    if (isNaN(productId)) {
      toast({
        title: "Error",
        description: "Invalid product ID",
        variant: "destructive",
      });
      return;
    }

    // Check if already in cart
    if (cartItems.some((i) => i.productId === item.productId)) {
      toast({
        title: "Already in cart",
        description: `${item.title} is already in your cart.`,
      });
      return;
    }

    // Optimistic update
    const optimisticCart = [...cartItems, item];
    await optimisticUpdate(
      ['cart'],
      optimisticCart,
      () => apiClient.addToCart({ product_id: productId, cart_type: 'cart' }),
      () => {
        toast({
          title: "Added to cart",
          description: `${item.title} has been added to your cart.`,
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to add item to cart",
          variant: "destructive",
        });
      }
    );
  }, [cartItems, optimisticUpdate, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      toast({
        title: "Error",
        description: "Invalid cart item ID",
        variant: "destructive",
      });
      return;
    }

    const item = cartItems.find((i) => i.id === itemId);
    const optimisticCart = cartItems.filter((item) => item.id !== itemId);

    await optimisticUpdate(
      ['cart'],
      optimisticCart,
      () => apiClient.removeFromCart(cartItemId),
      () => {
        toast({
          title: "Removed from cart",
          description: item ? `${item.title} has been removed from your cart.` : "Item removed",
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to remove item from cart",
          variant: "destructive",
        });
      }
    );
  }, [cartItems, optimisticUpdate, toast]);

  const clearCart = useCallback(async () => {
    // Remove all items one by one
    const removePromises = cartItems.map((item) => 
      apiClient.removeFromCart(parseInt(item.id))
    );
    
    try {
      await Promise.all(removePromises);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart",
        variant: "destructive",
      });
    }
  }, [cartItems, queryClient, toast]);

  const moveToWishlist = useCallback(async (itemId: string) => {
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      toast({
        title: "Error",
        description: "Invalid cart item ID",
        variant: "destructive",
      });
      return;
    }

    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const optimisticCart = cartItems.filter((i) => i.id !== itemId);
    const optimisticWishlist = [...wishlistItems, {
        id: item.id,
        productId: item.productId,
        title: item.title,
        designer: item.designer,
        category: item.category,
        price: item.price,
        image: item.image,
        tags: item.tags,
        isPremium: item.price > 0,
    }];

    try {
      // Update both queries optimistically
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']);
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);

      queryClient.setQueryData(['cart'], optimisticCart);
      queryClient.setQueryData(['wishlist'], optimisticWishlist);

      const response = await apiClient.moveToWishlist(cartItemId);
      if (response.error) {
        throw new Error(response.error);
      }

      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });

      toast({
        title: "Moved to wishlist",
        description: `${item.title} has been saved to your wishlist.`,
      });
    } catch (error: any) {
      // Rollback
      if (previousCart) queryClient.setQueryData(['cart'], previousCart);
      if (previousWishlist) queryClient.setQueryData(['wishlist'], previousWishlist);
      toast({
        title: "Error",
        description: error.message || "Failed to move item to wishlist",
        variant: "destructive",
      });
    }
  }, [cartItems, wishlistItems, queryClient, toast]);

  const addToWishlist = useCallback(async (item: WishlistItem) => {
    const productId = parseInt(item.productId);
    if (isNaN(productId)) {
      toast({
        title: "Error",
        description: "Invalid product ID",
        variant: "destructive",
      });
      return;
    }

    // Check if already in wishlist
    if (wishlistItems.some((i) => i.productId === item.productId)) {
      toast({
        title: "Already in wishlist",
        description: `${item.title} is already in your wishlist.`,
      });
      return;
    }

    const optimisticWishlist = [...wishlistItems, item];
    await optimisticUpdate(
      ['wishlist'],
      optimisticWishlist,
      () => apiClient.addToCart({ product_id: productId, cart_type: 'wishlist' }),
      () => {
        toast({
          title: "Added to wishlist",
          description: `${item.title} has been saved to your wishlist.`,
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to add item to wishlist",
          variant: "destructive",
        });
      }
    );
  }, [wishlistItems, optimisticUpdate, toast]);

  const removeFromWishlist = useCallback(async (itemId: string) => {
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      toast({
        title: "Error",
        description: "Invalid wishlist item ID",
        variant: "destructive",
      });
      return;
    }

    const item = wishlistItems.find((i) => i.id === itemId);
    const optimisticWishlist = wishlistItems.filter((item) => item.id !== itemId);

    await optimisticUpdate(
      ['wishlist'],
      optimisticWishlist,
      () => apiClient.removeFromCart(cartItemId),
      () => {
        toast({
          title: "Removed from wishlist",
          description: item ? `${item.title} has been removed from your wishlist.` : "Item removed",
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to remove item from wishlist",
          variant: "destructive",
        });
      }
    );
  }, [wishlistItems, optimisticUpdate, toast]);

  const clearWishlist = useCallback(async () => {
    const removePromises = wishlistItems.map((item) => 
      apiClient.removeFromCart(parseInt(item.id))
    );
    
    try {
      await Promise.all(removePromises);
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: "Wishlist cleared",
        description: "All items have been removed from your wishlist.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear wishlist",
        variant: "destructive",
      });
    }
  }, [wishlistItems, queryClient, toast]);

  const moveToCart = useCallback(async (itemId: string) => {
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      toast({
        title: "Error",
        description: "Invalid wishlist item ID",
        variant: "destructive",
      });
      return;
    }

    const item = wishlistItems.find((i) => i.id === itemId);
    if (!item) return;

    const optimisticWishlist = wishlistItems.filter((i) => i.id !== itemId);
    const optimisticCart = [...cartItems, {
        id: item.id,
        productId: item.productId,
        title: item.title,
        designer: item.designer,
        category: item.category,
        price: item.price,
        image: item.image,
        tags: item.tags,
        license: 'Standard License',
    }];

    try {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']);
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);

      queryClient.setQueryData(['cart'], optimisticCart);
      queryClient.setQueryData(['wishlist'], optimisticWishlist);

      const response = await apiClient.moveToCart(cartItemId);
      if (response.error) {
        throw new Error(response.error);
      }

      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });

      toast({
        title: "Moved to cart",
        description: `${item.title} has been added to your cart.`,
      });
    } catch (error: any) {
      if (previousCart) queryClient.setQueryData(['cart'], previousCart);
      if (previousWishlist) queryClient.setQueryData(['wishlist'], previousWishlist);
      toast({
        title: "Error",
        description: error.message || "Failed to move item to cart",
        variant: "destructive",
      });
    }
  }, [cartItems, wishlistItems, queryClient, toast]);

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.productId === productId);
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getCartCount = () => cartItems.length;
  
  const getWishlistCount = () => wishlistItems.length;

  return (
    <CartWishlistContext.Provider
      value={{
        cartItems,
        wishlistItems,
        isLoadingCart,
        isLoadingWishlist,
        addToCart,
        removeFromCart,
        clearCart,
        moveToWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        moveToCart,
        isInCart,
        isInWishlist,
        getCartTotal,
        getCartCount,
        getWishlistCount,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
};

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (context === undefined) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};
