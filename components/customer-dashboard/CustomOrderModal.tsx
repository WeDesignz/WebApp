"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { initializeRazorpayCheckout } from "@/lib/payment";
import { useQueryClient } from "@tanstack/react-query";

interface CustomOrderModalProps {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export default function CustomOrderModal({ open, onClose, onOrderPlaced }: CustomOrderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number>(200);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!budget || budget <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    if (budget < 200) {
      toast({
        title: "Validation Error",
        description: "Minimum budget is ₹200",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsProcessing(true);

    try {
      // Step 1: Submit custom request (this creates CustomOrderRequest and Order)
      const submitResponse = await apiClient.submitCustomRequest({
        title: title.trim(),
        description: description.trim(),
        budget: budget,
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
      const amount = data.amount || budget;

      if (!orderId) {
        throw new Error('Failed to create order for custom request');
      }

      // Step 2: Create payment order with order_id to link payment to order
      setIsProcessing(true);
      const paymentOrderResponse = await apiClient.createPaymentOrder({
        amount: amount,
        currency: 'INR',
        description: `Custom Order: ${title}`,
        order_id: orderId, // Link payment to order
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
        description: `Custom Order: ${title}`,
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
    setTitle("");
    setDescription("");
    setBudget(200);
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
            <Label htmlFor="title">Design Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Business Card Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Specifications *</Label>
            <Textarea
              id="description"
              placeholder="Describe your design requirements in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget (₹) *</Label>
            <Input
              id="budget"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g., 200"
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum budget: ₹200
            </p>
          </div>

          <div>
            <Label htmlFor="files">Reference Files (Optional)</Label>
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
              <span className="text-2xl font-bold">₹{budget}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Delivered within 1 hour • Unlimited revisions
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isProcessing}
              className="flex-1"
            >
              {isSubmitting || isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isProcessing ? "Processing Payment..." : "Submitting..."}
                </>
              ) : (
                `Place Order (₹${budget})`
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
