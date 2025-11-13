"use client";

import { useState, useEffect } from "react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { Trash2, Heart, ShoppingCart, Tag, CreditCard, Lock, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { initializeRazorpayCheckout } from "@/lib/payment";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function CartPage() {
  const { cartItems, removeFromCart, moveToWishlist, getCartTotal, clearCart, isLoadingCart } = useCartWishlist();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cartSummary, setCartSummary] = useState<{
    total_amount: number;
    has_active_subscription: boolean;
    will_be_free: boolean;
    subscription_plan?: string;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch cart summary
  useEffect(() => {
    if (cartItems.length > 0) {
      apiClient.getCartSummary().then((response) => {
        if (response.data) {
          setCartSummary({
            total_amount: response.data.total_amount || 0,
            has_active_subscription: response.data.has_active_subscription || false,
            will_be_free: response.data.will_be_free || false,
            subscription_plan: response.data.subscription_plan || undefined,
          });
        }
      });
    } else {
      setCartSummary(null);
    }
  }, [cartItems.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkRemove = async () => {
    const count = selectedItems.length;
    await Promise.all(selectedItems.map(id => removeFromCart(id)));
    setSelectedItems([]);
  };

  const handleBulkMoveToWishlist = async () => {
    const count = selectedItems.length;
    await Promise.all(selectedItems.map(id => moveToWishlist(id)));
    setSelectedItems([]);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setCouponApplied(true);
      toast({
        title: "Coupon applied",
        description: "Your discount has been applied successfully!",
      });
    }
  };

  const discount = couponApplied ? getCartTotal() * 0.1 : 0;
  const total = getCartTotal() - discount;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to proceed with checkout",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const finalAmount = cartSummary?.will_be_free ? 0 : (cartSummary?.total_amount || total);

      // If free (has active subscription), complete purchase directly
      if (cartSummary?.will_be_free) {
        const purchaseResponse = await apiClient.purchaseCart({
          payment_method: 'razorpay',
          address_id: 1, // TODO: Get from user profile or address selection
          coupon_code: couponApplied ? couponCode : undefined,
        });

        if (purchaseResponse.error) {
          throw new Error(purchaseResponse.error);
        }

        // Clear cart and refresh
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        await queryClient.invalidateQueries({ queryKey: ['orders'] });

        toast({
          title: "Order placed successfully!",
          description: "Your order has been placed. Check your orders page.",
        });

        router.push('/customer-dashboard/orders');
        return;
      }

      // Step 1: Create payment order
      const paymentOrderResponse = await apiClient.createPaymentOrder({
        amount: finalAmount,
        currency: 'INR',
        description: `Payment for ${cartItems.length} item(s)`,
      });

      if (paymentOrderResponse.error || !paymentOrderResponse.data) {
        throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
      }

      const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

      // Step 2: Initialize Razorpay checkout
      const paymentResult = await initializeRazorpayCheckout({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: finalAmount * 100, // Convert rupees to paise for Razorpay
        currency: 'INR',
        name: 'WeDesign',
        description: `Payment for ${cartItems.length} item(s)`,
        order_id: razorpay_order_id,
        theme: {
          color: '#8B5CF6',
        },
      });

      if (!paymentResult.success || !paymentResult.razorpay_payment_id) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Step 3: Capture payment
      const captureResponse = await apiClient.capturePayment({
        payment_id: payment_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id!,
        amount: finalAmount,
      });

      if (captureResponse.error) {
        throw new Error(captureResponse.error || 'Failed to capture payment');
      }

      // Step 4: Complete purchase
      const purchaseResponse = await apiClient.purchaseCart({
        payment_method: 'razorpay',
        address_id: 1, // TODO: Get from user profile or address selection
        coupon_code: couponApplied ? couponCode : undefined,
      });

      if (purchaseResponse.error) {
        throw new Error(purchaseResponse.error);
      }

      // Clear cart and refresh
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });

      toast({
        title: "Order placed successfully!",
        description: "Your payment has been processed and order placed.",
      });

      router.push('/customer-dashboard/orders');
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <a 
            href="/customer-dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </a>

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Discover amazing designs from talented creators. Start adding items to your cart!
            </p>
            <a href="/customer-dashboard">
              <Button size="lg" className="rounded-full">
                Browse Designs
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a 
          href="/customer-dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">{cartItems.length} items in your cart</p>
        </div>

        {selectedItems.length > 0 && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMoveToWishlist}
              >
                <Heart className="w-4 h-4 mr-2" />
                Save to Wishlist
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkRemove}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
              <Checkbox
                checked={selectedItems.length === cartItems.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>

            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      className="mt-1"
                    />
                    
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">by {item.designer}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {item.category}
                        </span>
                        {" • "}
                        {item.license}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 bg-muted border border-border rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => moveToWishlist(item.id)}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Heart className="w-4 h-4" />
                          Save to Wishlist
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-sm text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <Button 
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponApplied}
                    >
                      {couponApplied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Applied
                        </>
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>

                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                    <p className="text-sm text-success font-medium">
                      🎉 Free shipping on all digital products!
                    </p>
                  </div>
                </div>

                {cartSummary?.will_be_free && (
                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg mb-4">
                    <p className="text-sm text-success font-medium">
                      🎉 Your active subscription ({cartSummary.subscription_plan || 'Plan'}) makes this purchase free!
                    </p>
                  </div>
                )}

                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount (10%)</span>
                      <span className="text-success">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {cartSummary?.will_be_free && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subscription Discount</span>
                      <span className="text-success">-{formatPrice(getCartTotal())}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xl font-bold pt-4 mb-6">
                  <span>Total</span>
                  <span>{formatPrice(cartSummary?.will_be_free ? 0 : (cartSummary?.total_amount || total))}</span>
                </div>
                {cartSummary?.will_be_free && (
                  <div className="text-sm text-muted-foreground text-center mb-4">
                    Original price: {formatPrice(getCartTotal())}
                  </div>
                )}

                <Button 
                  className="w-full h-12 rounded-full mb-3" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessingPayment || cartItems.length === 0}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-full"
                  onClick={() => window.location.href = '/customer-dashboard'}
                >
                  Continue Shopping
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-3">We Accept</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3 py-2 bg-muted border border-border rounded flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-medium">Visa</span>
                  </div>
                  <div className="px-3 py-2 bg-muted border border-border rounded flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-medium">Mastercard</span>
                  </div>
                  <div className="px-3 py-2 bg-muted border border-border rounded flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-medium">PayPal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
