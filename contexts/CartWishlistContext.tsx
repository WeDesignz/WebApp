"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  moveToWishlist: (itemId: string) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (itemId: string) => void;
  clearWishlist: () => void;
  moveToCart: (itemId: string) => void;
  isInCart: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
  getWishlistCount: () => number;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export const CartWishlistProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('wedesign_cart');
    const savedWishlist = localStorage.getItem('wedesign_wishlist');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }
    
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage', e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wedesign_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wedesign_wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isInitialized]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const moveToWishlist = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (item) {
      const wishlistItem: WishlistItem = {
        id: item.id,
        productId: item.productId,
        title: item.title,
        designer: item.designer,
        category: item.category,
        price: item.price,
        image: item.image,
        tags: item.tags,
        isPremium: item.price > 0,
      };
      addToWishlist(wishlistItem);
      removeFromCart(itemId);
    }
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const moveToCart = (itemId: string) => {
    const item = wishlistItems.find((i) => i.id === itemId);
    if (item) {
      const cartItem: CartItem = {
        id: item.id,
        productId: item.productId,
        title: item.title,
        designer: item.designer,
        category: item.category,
        price: item.price,
        image: item.image,
        tags: item.tags,
        license: 'Standard License',
      };
      addToCart(cartItem);
      removeFromWishlist(itemId);
    }
  };

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
