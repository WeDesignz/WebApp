/**
 * Razorpay Payment Integration Utility
 * Handles Razorpay checkout initialization and payment processing
 */

import { apiClient } from './api';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number; // Amount in rupees
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  payment_id?: number;
  razorpay_payment_id?: string;
  error?: string;
}

/**
 * Check if Razorpay script is loaded
 */
export function isRazorpayLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
}

/**
 * Wait for Razorpay script to load
 */
export function waitForRazorpay(maxWait: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isRazorpayLoaded()) {
      resolve(true);
      return;
    }

    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const startTime = Date.now();
    
    // Poll for Razorpay to be loaded
    const checkInterval = setInterval(() => {
      if (isRazorpayLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime >= maxWait) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Initialize Razorpay checkout
 */
export async function initializeRazorpayCheckout(
  options: RazorpayOptions
): Promise<PaymentResult> {
  // Validate Razorpay key first
  if (!options.key || options.key.trim() === '') {
    return {
      success: false,
      error: 'Razorpay authentication key is missing. Please configure NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment variables.',
    };
  }

  // Wait for Razorpay script to load (with timeout)
  const razorpayLoaded = await waitForRazorpay(5000);
  if (!razorpayLoaded) {
    return {
      success: false,
      error: 'Razorpay payment gateway not loaded. Please refresh the page and try again.',
    };
  }

  return new Promise((resolve) => {

    const razorpay = new window.Razorpay({
      ...options,
      handler: (response: RazorpayResponse) => {
        if (options.handler) {
          options.handler(response);
        }
        resolve({
          success: true,
          razorpay_payment_id: response.razorpay_payment_id,
        });
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          if (options.modal?.ondismiss) {
            options.modal.ondismiss();
          }
          resolve({
            success: false,
            error: 'Payment cancelled by user',
          });
        },
      },
    });

    razorpay.open();
  });
}

/**
 * Complete payment flow: Create order -> Initialize checkout -> Capture payment
 */
export async function processPayment(
  amount: number,
  orderId?: string,
  description?: string,
  razorpayKey?: string
): Promise<PaymentResult> {
  try {
    // Step 1: Create payment order on backend
    // Backend expects amount in rupees, but converts to paise internally
    const orderResponse = await apiClient.createPaymentOrder({
      amount, // Amount in rupees
      currency: 'INR',
      order_id: orderId,
      description: description || 'Payment for order',
    });

    if (orderResponse.error || !orderResponse.data) {
      return {
        success: false,
        error: orderResponse.error || 'Failed to create payment order',
      };
    }

    const { razorpay_order_id, payment_id } = orderResponse.data;

    // Step 2: Initialize Razorpay checkout
    // Razorpay expects amount in paise, so multiply by 100
    const checkoutResult = await initializeRazorpayCheckout({
      key: razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: amount * 100, // Convert rupees to paise for Razorpay
      currency: 'INR',
      name: 'WeDesign',
      description: description || 'Payment for order',
      order_id: razorpay_order_id,
      theme: {
        color: '#8B5CF6',
      },
    });

    if (!checkoutResult.success || !checkoutResult.razorpay_payment_id) {
      return checkoutResult;
    }

    // Step 3: Capture payment on backend
    const captureResponse = await apiClient.capturePayment({
      payment_id: payment_id,
      razorpay_payment_id: checkoutResult.razorpay_payment_id,
      amount: amount,
    });

    if (captureResponse.error) {
      return {
        success: false,
        error: captureResponse.error || 'Failed to capture payment',
      };
    }

    return {
      success: true,
      payment_id: payment_id,
      razorpay_payment_id: checkoutResult.razorpay_payment_id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
}

/**
 * React hook for payment processing
 */
export function usePayment() {
  const { toast } = useToast();

  const processPaymentWithToast = async (
    amount: number,
    orderId?: string,
    description?: string,
    onSuccess?: (result: PaymentResult) => void,
    onError?: (error: string) => void
  ) => {
    const result = await processPayment(amount, orderId, description);

    if (result.success) {
      toast({
        title: 'Payment successful',
        description: 'Your payment has been processed successfully.',
      });
      onSuccess?.(result);
    } else {
      toast({
        title: 'Payment failed',
        description: result.error || 'Payment could not be processed',
        variant: 'destructive',
      });
      onError?.(result.error || 'Payment failed');
    }

    return result;
  };

  return {
    processPayment: processPaymentWithToast,
    isRazorpayLoaded,
  };
}

