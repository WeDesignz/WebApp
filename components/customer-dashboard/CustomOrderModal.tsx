"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { initializeRazorpayCheckout } from "@/lib/payment";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface CustomOrderModalProps {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export default function CustomOrderModal({ open, onClose, onOrderPlaced }: CustomOrderModalProps) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom order price from business config
  const { data: businessConfig } = useQuery({
    queryKey: ['businessConfig'],
    queryFn: async () => {
      const response = await apiClient.getBusinessConfig();
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch business configuration');
      }
      return response.data;
    },
    enabled: open, // Only fetch when modal is open
  });

  const customOrderPrice = businessConfig?.custom_order_price || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!customOrderPrice || customOrderPrice <= 0) {
      toast({
        title: "Error",
        description: "Custom order price is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsProcessing(true);

    try {
      // Step 1: Submit custom request (this creates CustomOrderRequest and Order)
      // Title and description are optional - backend will provide defaults if empty
      const submitResponse = await apiClient.submitCustomRequest({
        title: description.trim().substring(0, 200) || "", // Optional - backend will default to "Custom Order"
        description: description.trim() || "", // Optional - backend will default to "No description provided"
        budget: customOrderPrice,
        files: files.length > 0 ? files : undefined, // Include files if any
      });

      if (submitResponse.error || !submitResponse.data) {
        throw new Error(submitResponse.error || 'Failed to submit custom request');
      }

      // TypeScript type narrowing - after the check above, data is guaranteed to exist
      const data = submitResponse.data as {
        message: string;
        custom_request: {
          id: number;
          title: string;
          description: string;
          status: string;
          budget: number | null;
          created_at: string;
          updated_at: string;
          media?: Array<any>;
        };
        order_id?: number;
        payment_required: boolean;
        amount: number;
        payment_message: string;
      };
      const customRequest = data.custom_request;
      const orderId = data.order_id;
      const amount = data.amount || customOrderPrice;

      if (!orderId) {
        throw new Error('Failed to create order for custom request');
      }

      // Step 2: Create payment order with order_id to link payment to order
      setIsProcessing(true);
      const paymentOrderResponse = await apiClient.createPaymentOrder({
        amount: amount,
        currency: 'INR',
        description: `Custom Order`,
        order_id: orderId.toString(), // Link payment to order
      });

      if (paymentOrderResponse.error || !paymentOrderResponse.data) {
        throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
      }

      const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

      // Step 3: Initialize Razorpay checkout
      const paymentResult = await initializeRazorpayCheckout({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: amount * 100, // Convert rupees to paise for Razorpay
        currency: 'INR',
        name: 'WeDesign',
        description: `Custom Order`,
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
        amount: amount,
      });

      if (captureResponse.error) {
        throw new Error(captureResponse.error || 'Failed to capture payment');
      }

      // Step 5: Success - Refresh orders and custom requests
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['customRequests'] });

      toast({
        title: "Order placed successfully!",
        description: "Your custom order has been placed and payment processed.",
      });

      onOrderPlaced(customRequest.id?.toString() || orderId.toString());
      resetForm();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Place Custom Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Design Specifications</Label>
            <Textarea
              id="description"
              placeholder="Describe your design requirements in detail (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Provide detailed specifications for your custom design
            </p>
          </div>

          <div>
            <Label htmlFor="files">Reference Files</Label>
            <div className="mt-1.5">
              <label
                htmlFor="files"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload reference files
                  </p>
                </div>
                <input
                  id="files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.ai,.psd"
                />
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="h-auto p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Order Price</span>
              <span className="text-2xl font-bold">₹{customOrderPrice}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Fixed price as per system configuration
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isProcessing || !customOrderPrice}
              className="flex-1"
            >
              {isSubmitting || isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isProcessing ? "Processing Payment..." : "Submitting..."}
                </>
              ) : (
                `Place Order (₹${customOrderPrice})`
              )}
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
              disabled={isSubmitting || isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
