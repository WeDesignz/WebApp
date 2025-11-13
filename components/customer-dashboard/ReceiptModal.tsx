"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: {
    orderId: string;
    date: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
    razorpayReference: string;
    paymentMethod: string;
  } | null;
}

export default function ReceiptModal({ open, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null;

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-row { display: flex; justify-between; margin: 10px 0; }
          .items { margin: 30px 0; }
          .item { display: flex; justify-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { margin: 5px 0; }
          .final-total { font-size: 1.2em; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WeDesign</h1>
          <h2>Payment Receipt</h2>
        </div>
        <div class="info">
          <div class="info-row"><strong>Order ID:</strong> <span>${receipt.orderId}</span></div>
          <div class="info-row"><strong>Date:</strong> <span>${new Date(receipt.date).toLocaleDateString()}</span></div>
          <div class="info-row"><strong>Razorpay Reference:</strong> <span>${receipt.razorpayReference}</span></div>
          <div class="info-row"><strong>Payment Method:</strong> <span>${receipt.paymentMethod}</span></div>
        </div>
        <div class="items">
          <h3>Order Items</h3>
          ${receipt.items.map(item => `
            <div class="item">
              <div>
                <strong>${item.name}</strong><br/>
                <small>Quantity: ${item.quantity}</small>
              </div>
              <span>₹${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row">Subtotal: ₹${receipt.subtotal.toFixed(2)}</div>
          <div class="total-row">Tax (18% GST): ₹${receipt.tax.toFixed(2)}</div>
          <div class="final-total">Total: ₹${receipt.total.toFixed(2)}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-mono font-semibold">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="font-medium">{new Date(receipt.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Razorpay Reference</span>
              <span className="font-mono text-sm">{receipt.razorpayReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="font-medium">{receipt.paymentMethod}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-2">
              {receipt.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold">₹{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{receipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (18% GST)</span>
              <span>₹{receipt.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{receipt.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
