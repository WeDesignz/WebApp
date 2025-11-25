"use client";

import { useState, useEffect } from "react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { Trash2, Heart, ShoppingCart, Tag, Lock, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { initializeRazorpayCheckout } from "@/lib/payment";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// Helper function to make absolute URL
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

export default function CartPage() {
  const { cartItems, removeFromCart, moveToWishlist, getCartTotal, clearCart, isLoadingCart } = useCartWishlist();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponInfo, setCouponInfo] = useState<{
    discount_amount: number;
    coupon_name: string;
    coupon_type: 'flat' | 'percentage';
  } | null>(null);
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

  // Load coupon state from localStorage on mount
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        const couponData = JSON.parse(savedCoupon);
        setCouponCode(couponData.code || '');
        setCouponApplied(couponData.applied || false);
        setCouponInfo(couponData.info || null);
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }, []);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid coupon code",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const orderAmount = cartSummary?.total_amount || getCartTotal();
      const response = await apiClient.validateCoupon({
        coupon_code: couponCode.trim(),
        order_amount: orderAmount,
      });

      if (response.error || !response.data?.valid) {
        // Extract error message from response
        let errorMessage = 'Invalid coupon code';
        
        if (response.error) {
          // If error is in response.error, use it
          errorMessage = response.error;
        } else if (response.data?.error) {
          // If error is in response.data.error, use it
          errorMessage = response.data.error;
        } else if (response.errorDetails?.message) {
          // If error is in errorDetails, use it
          errorMessage = response.errorDetails.message;
        }
        
        setCouponApplied(false);
        setCouponInfo(null);
        
        // Clear from localStorage
        try {
          localStorage.removeItem('appliedCoupon');
        } catch (error) {
          // Ignore localStorage errors
        }
        
        toast({
          title: "Coupon validation failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (response.data) {
      setCouponApplied(true);
        const couponInfoData = {
          discount_amount: response.data.discount_amount || 0,
          coupon_name: response.data.coupon?.name || couponCode.trim(),
          coupon_type: response.data.coupon?.coupon_discount_type || 'percentage',
        };
        setCouponInfo(couponInfoData);
        
        // Save to localStorage
        try {
          localStorage.setItem('appliedCoupon', JSON.stringify({
            code: couponCode.trim(),
            applied: true,
            info: couponInfoData,
          }));
        } catch (error) {
          // Ignore localStorage errors
        }
        toast({
          title: "Coupon applied",
          description: `Discount of ${formatPrice(response.data.discount_amount || 0)} applied successfully!`,
        });
      }
    } catch (error: any) {
      setCouponApplied(false);
      setCouponInfo(null);
      
      // Clear from localStorage
      try {
        localStorage.removeItem('appliedCoupon');
      } catch (error) {
        // Ignore localStorage errors
      }
      toast({
        title: "Error applying coupon",
        description: error.message || "Failed to validate coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const discount = couponInfo?.discount_amount || 0;
  const total = (cartSummary?.total_amount || getCartTotal()) - discount;

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
      const finalAmount = cartSummary?.will_be_free ? 0 : Math.max(0, total);

      // If free (has active subscription), complete purchase directly
      if (cartSummary?.will_be_free) {
        const purchaseResponse = await apiClient.purchaseCart({
          payment_method: 'razorpay',
          coupon_code: couponApplied ? couponCode : undefined,
        });

        if (purchaseResponse.error) {
          setIsProcessingPayment(false);
          throw new Error(purchaseResponse.error);
        }

        // Clear cart and refresh
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        await queryClient.invalidateQueries({ queryKey: ['orders'] });

        toast({
          title: "Order placed successfully!",
          description: "Your order has been placed. Check your orders page.",
        });

        // Reset processing state before navigation
        setIsProcessingPayment(false);
        
        // Use a small delay to ensure state update is reflected before navigation
        setTimeout(() => {
          router.push('/customer-dashboard?view=orders');
        }, 50);
        return;
      }

      // Step 1: Create order first
      // Extract product IDs and convert to integers
      const productIds = cartItems
        .map(item => {
          // Use productId (camelCase) from CartItem interface
          const productId = item.productId;
          if (!productId) {
            console.error('Cart item missing productId:', item);
            return null;
          }
          const id = parseInt(productId.toString(), 10);
          if (isNaN(id)) {
            console.error('Invalid product ID:', productId, 'for item:', item);
            return null;
          }
          return id;
        })
        .filter((id): id is number => id !== null);

      if (productIds.length === 0) {
        throw new Error('No valid product IDs found in cart');
      }

      if (productIds.length !== cartItems.length) {
        throw new Error('Some cart items have invalid product IDs');
      }

      const orderResponse = await apiClient.createOrder({
        product_ids: productIds,
        total_amount: finalAmount,
        coupon_code: couponApplied ? couponCode : undefined,
      });

      if (orderResponse.error || !orderResponse.data) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      // Type assertion: create_order returns { order_id: number, order: {...}, ... }
      const orderData = orderResponse.data as { order_id?: number; id?: number; order?: { id?: number } };
      const orderId = orderData.order_id || orderData.id || orderData.order?.id;
      
      if (!orderId) {
        throw new Error('Order ID not found in response');
      }

      // Step 2: Create payment order and associate with order
      const paymentOrderResponse = await apiClient.createPaymentOrder({
        amount: finalAmount,
        currency: 'INR',
        order_id: orderId.toString(),
        description: `Payment for ${cartItems.length} item(s)`,
      });

      if (paymentOrderResponse.error || !paymentOrderResponse.data) {
        throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
      }

      const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

      // Validate Razorpay key before initializing
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey.trim() === '') {
        throw new Error('Razorpay payment gateway is not configured. Please contact support.');
      }

      // Step 3: Initialize Razorpay checkout
      const paymentResult = await initializeRazorpayCheckout({
        key: razorpayKey,
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

      // Step 4: Capture payment
      const captureResponse = await apiClient.capturePayment({
        payment_id: payment_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id!,
        amount: finalAmount,
      });

      // Check if there's an error (but allow "already captured" and handle timeout specially)
      if (captureResponse.error) {
        // If payment is already captured, that's okay - continue with checkout
        const isAlreadyCaptured = captureResponse.error.toLowerCase().includes('already captured') || 
            (captureResponse.data?.message && captureResponse.data.message.toLowerCase().includes('already captured'));
        
        if (isAlreadyCaptured) {
          // Payment already captured, continue with checkout - proceed below
        } else if (captureResponse.error.toLowerCase().includes('timeout') || (captureResponse as any).isTimeout) {
          // Timeout occurred - check order status to verify if payment was actually captured
          try {
            const orderDetailResponse = await apiClient.getOrderDetail(orderId);
            if (orderDetailResponse.data && orderDetailResponse.data.status === 'success') {
              // Order status is success, meaning payment was captured - proceed with checkout
              toast({
                title: "Payment processed",
                description: "Payment was captured successfully. Processing your order...",
              });
              // Continue to success flow below
            } else {
              // Order is still pending - payment likely didn't complete
              setIsProcessingPayment(false);
              throw new Error('Payment capture timed out. Please check your orders page to verify payment status.');
            }
          } catch (verifyError: any) {
            // Reset processing state
            setIsProcessingPayment(false);
            
            // If order check fails, show message and redirect to orders page
            toast({
              title: "Payment timeout",
              description: "Payment may have been processed. Please check your orders page to confirm.",
              variant: "default",
            });
            
            // Clear cart and refresh before redirect
            await queryClient.invalidateQueries({ queryKey: ['cart'] });
            await queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            // Use a small delay to ensure state update is reflected before navigation
            setTimeout(() => {
              router.push('/customer-dashboard?view=orders');
            }, 50);
            return; // Exit early
          }
        } else {
          // Real error occurred - reset state before throwing
          setIsProcessingPayment(false);
          throw new Error(captureResponse.error || 'Failed to capture payment');
        }
      }

      // Payment was captured successfully (either directly, already captured, or verified after timeout)
      // Proceed with checkout completion:
      
      // Step 5: Order status is already updated to 'success' when payment is captured
      // No need to call purchaseCart again as order was already created in Step 1

      // Clear cart and refresh
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });

      toast({
        title: "Order placed successfully!",
        description: "Your payment has been processed and order placed.",
      });

      // Reset processing state before navigation to ensure UI updates
      setIsProcessingPayment(false);
      
      // Use a small delay to ensure state update is reflected before navigation
      setTimeout(() => {
        router.push('/customer-dashboard?view=orders');
      }, 50);
      return; // Exit early to prevent finally block from running
    } catch (error: any) {
      // Reset processing state immediately on error
      setIsProcessingPayment(false);
      
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Safety net: always reset processing state
      // This will run if no early return occurred
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
                    
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    <img
                        src={makeAbsoluteUrl(item.image) || '/generated_images/Brand_Identity_Design_67fa7e1f.png'}
                      alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/generated_images/Brand_Identity_Design_67fa7e1f.png';
                        }}
                    />
                    </div>

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
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        // Clear applied coupon if user changes the code
                        if (couponApplied) {
                          setCouponApplied(false);
                          setCouponInfo(null);
                          // Clear from localStorage
                          try {
                            localStorage.removeItem('appliedCoupon');
                          } catch (error) {
                            // Ignore localStorage errors
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !couponApplied && !isValidatingCoupon && couponCode.trim()) {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <Button 
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponApplied || isValidatingCoupon}
                    >
                      {isValidatingCoupon ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Validating...
                        </>
                      ) : couponApplied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Applied
                        </>
                      ) : (
                        'Apply'
                      )}
                    </Button>
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
                  {couponApplied && couponInfo && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Discount {couponInfo.coupon_type === 'percentage' 
                          ? `(${((discount / (cartSummary?.total_amount || getCartTotal())) * 100).toFixed(0)}%)`
                          : `(${couponInfo.coupon_name})`}
                      </span>
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
                  <span>{formatPrice(cartSummary?.will_be_free ? 0 : Math.max(0, total))}</span>
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
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
