"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Tag, ArrowRight, Trash2, Heart, Loader2 } from "lucide-react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, moveToWishlist, getCartTotal, isLoadingCart } = useCartWishlist();
  const [couponCode, setCouponCode] = useState("");
  const { toast } = useToast();
  const [cartSummary, setCartSummary] = useState<{
    total_amount: number;
    has_active_subscription: boolean;
    will_be_free: boolean;
  } | null>(null);

  // Fetch cart summary when drawer opens
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      apiClient.getCartSummary().then((response) => {
        if (response.data) {
          setCartSummary({
            total_amount: response.data.total_amount || 0,
            has_active_subscription: response.data.has_active_subscription || false,
            will_be_free: response.data.will_be_free || false,
          });
        }
      });
    }
  }, [isOpen, cartItems.length]);

  const handleRemove = async (itemId: string, title: string) => {
    await removeFromCart(itemId);
  };

  const handleMoveToWishlist = async (itemId: string, title: string) => {
    await moveToWishlist(itemId);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      toast({
        title: "Coupon applied",
        description: "Your discount has been applied to the cart.",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your Cart</h2>
                  <p className="text-sm text-muted-foreground">{cartItems.length} items</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingCart ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-6">Add some amazing designs to get started!</p>
                  <Button onClick={onClose}>Browse Designs</Button>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-background border border-border rounded-xl p-4 group"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">by {item.designer}</p>
                          <p className="text-xs text-muted-foreground mb-2">{item.license}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-muted rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                          <p className="font-bold text-lg">{formatPrice(item.price)}</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMoveToWishlist(item.id, item.title)}
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                              title="Save to Wishlist"
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(item.id, item.title)}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      🎉 Free download on orders over $50!
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-success">-$0.00</span>
                  </div>
                  {cartSummary?.will_be_free && (
                    <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                      <p className="text-sm text-success font-medium">
                        🎉 Your active subscription makes this purchase free!
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(cartSummary?.total_amount || getCartTotal())}</span>
                  </div>
                  {cartSummary?.will_be_free && (
                    <div className="text-sm text-muted-foreground text-center">
                      Original price: {formatPrice(getCartTotal())}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <a href="/customer-dashboard/cart">
                    <Button className="w-full h-12 rounded-full" size="lg">
                      View Cart
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </a>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-full" 
                    size="lg"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
