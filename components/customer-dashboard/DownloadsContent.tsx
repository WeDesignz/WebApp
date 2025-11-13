"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Grid3x3,
  List,
  Calendar,
  Receipt,
  FileImage,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReceiptModal from "@/components/customer-dashboard/ReceiptModal";
import { PDFPurchase } from "./PDFDownloadModal";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Download {
  id: number | string;
  name?: string;
  title?: string;
  thumbnail?: string;
  format?: string;
  downloadDate?: string;
  created_at?: string;
  type?: "free" | "paid" | "subscription";
  transactionId?: string;
  price?: number;
  total_amount?: number | string;
  cart_items?: any[];
}

export default function DownloadsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [pdfPurchases, setPdfPurchases] = useState<PDFPurchase[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // Fetch downloads from API
  const { data: downloadsData, isLoading, error } = useQuery({
    queryKey: ['downloads'],
    queryFn: async () => {
      const response = await apiClient.getDownloads();
      if (response.error) {
        throw new Error(response.error);
      }
      // Transform the data to match Download interface
      const downloads = response.data?.downloads || [];
      return downloads.map((download: any) => ({
        ...download,
        total_amount: typeof download.total_amount === 'string' 
          ? parseFloat(download.total_amount) 
          : download.total_amount,
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch PDF downloads
  const { data: pdfDownloadsData } = useQuery({
    queryKey: ['pdfDownloads'],
    queryFn: async () => {
      const response = await apiClient.getPDFDownloads();
      if (response.error) {
        return [];
      }
      return response.data?.downloads || [];
    },
    staleTime: 30 * 1000,
  });

  const downloads: Download[] = downloadsData || [];
  const pdfDownloads = pdfDownloadsData || [];

  // Transform PDF downloads to match download format
  const transformedPDFDownloads: Download[] = pdfDownloads
    .filter((pdf: any) => pdf.status === 'completed')
    .map((pdf: any) => ({
      id: `pdf-${pdf.download_id || pdf.id}`,
      name: `PDF Download - ${pdf.total_pages} designs`,
      title: `PDF Download - ${pdf.total_pages} designs`,
      format: "PDF",
      downloadDate: pdf.completed_at || pdf.created_at,
      created_at: pdf.completed_at || pdf.created_at,
      type: pdf.download_type === 'free' ? 'free' : 'paid',
      price: pdf.total_amount,
      pdfDownloadId: pdf.download_id || pdf.id,
    }));

  const allDownloads = [...downloads, ...transformedPDFDownloads].sort((a, b) => {
    const dateA = new Date(a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const totalDownloads = allDownloads.length;
  const freeDownloads = allDownloads.filter((d) => d.type === "free").length;
  const paidDownloads = allDownloads.filter((d) => d.type === "paid").length;

  useEffect(() => {
    setIsMounted(true);
    
    // Load PDF purchases from localStorage
    const stored = localStorage.getItem("pdfPurchases");
    if (stored) {
      try {
        const purchases = JSON.parse(stored);
        setPdfPurchases(purchases);
      } catch (error) {
        console.error("Error loading PDF purchases:", error);
      }
    }

    // Listen for storage changes (when PDF is purchased from another component)
    const handleStorageChange = () => {
      const stored = localStorage.getItem("pdfPurchases");
      if (stored) {
        try {
          const purchases = JSON.parse(stored);
          setPdfPurchases(purchases);
        } catch (error) {
          console.error("Error loading PDF purchases:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for changes (since same-window updates don't trigger storage event)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDownload = async (download: Download) => {
    try {
      // Check if it's a PDF download
      if ((download as any).pdfDownloadId) {
        const pdfId = (download as any).pdfDownloadId;
        const response = await apiClient.downloadPDF(pdfId);
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data instanceof Blob) {
          // Create download link
          const url = window.URL.createObjectURL(response.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `designs_${pdfId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Download started",
            description: "Your PDF is being downloaded.",
          });
        }
      } else {
        // Handle regular product downloads
        toast({
          title: "Download",
          description: "Product download functionality will be implemented.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handlePDFDownload = (purchase: PDFPurchase) => {
    // Mark as downloaded
    const updated = pdfPurchases.map((p) =>
      p.id === purchase.id ? { ...p, downloaded: true } : p
    );
    setPdfPurchases(updated);
    localStorage.setItem("pdfPurchases", JSON.stringify(updated));

    // Simulate PDF download
    console.log("Downloading PDF:", purchase);
    // In real implementation, this would trigger actual PDF generation and download
  };

  const openReceipt = (download: any) => {
    setSelectedReceipt({
      orderId: download.transactionId,
      date: download.downloadDate,
      items: [
        {
          name: download.name,
          quantity: 1,
          price: download.price,
        },
      ],
      subtotal: download.price,
      tax: download.price * 0.18,
      total: download.price * 1.18,
      razorpayReference: `pay_${download.transactionId}`,
      paymentMethod: "Razorpay",
    });
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              My Downloads
            </h1>
            <p className="text-muted-foreground mt-1">
              Access all your purchased and downloaded files
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold">{totalDownloads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Downloads</p>
                <p className="text-3xl font-bold">{freeDownloads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Receipt className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Downloads</p>
                <p className="text-3xl font-bold">{paidDownloads}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-xl font-semibold">Download History</h2>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,300px] gap-6">
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading downloads</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to load downloads'}
                </p>
              </Card>
            ) : allDownloads.length === 0 ? (
              <Card className="p-12 text-center">
                <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No downloads yet</h3>
                <p className="text-muted-foreground">
                  Your downloaded files will appear here
                </p>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {allDownloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-muted relative">
                        <FileImage className="w-16 h-16 absolute inset-0 m-auto text-muted-foreground/30" />
                        <Badge className="absolute top-2 right-2">
                          {download.type}
                        </Badge>
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-1">
                          {download.name || download.title || `Download #${download.id}`}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{download.format || 'N/A'}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        {download.type === "paid" && (download.transactionId || download.price) && (
                          <div className="flex items-center justify-between">
                            {download.transactionId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {download.transactionId}
                              </span>
                            )}
                            {download.price && (
                              <span className="text-xs font-semibold">₹{download.price}</span>
                            )}
                            {download.transactionId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openReceipt(download)}
                                className="h-auto p-1"
                              >
                                <Receipt className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleDownload(download)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {allDownloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <FileImage className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {download.name || download.title || `Download #${download.id}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">{download.format || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {download.type || 'download'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          {download.type === "paid" && (download.transactionId || download.price) && (
                            <div className="flex items-center gap-2 mt-1">
                              {download.transactionId && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {download.transactionId}
                                </p>
                              )}
                              {download.price && (
                                <p className="text-xs font-semibold">₹{download.price}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {download.type === "paid" && download.transactionId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReceipt(download)}
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => handleDownload(download)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <h3 className="font-semibold mb-3">Subscription Benefits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge>Pro Monthly</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Downloads</span>
                    <span className="font-semibold">32 / 50</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[64%]" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    18 downloads remaining this month
                  </p>
                </div>
              </Card>

              {/* Purchased PDFs */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Mock PDFs</h3>
                {!isMounted ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : pdfPurchases.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {pdfPurchases.map((purchase) => (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold">
                                {purchase.quantity} Designs PDF
                              </span>
                              {purchase.type === "free" && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                  Free
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Search className="w-3 h-3" />
                              <span className="truncate">
                                {purchase.searchQuery || "All Designs"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {purchase.category}
                              </Badge>
                              <span>•</span>
                              <span>
                                {purchase.selectionType === "firstN"
                                  ? "First N"
                                  : "Selected"}
                              </span>
                            </div>
                            {purchase.type === "paid" && (
                              <div className="text-xs font-semibold text-primary mt-1">
                                ₹{purchase.price}
                              </div>
                            )}
                          </div>
                          {purchase.downloaded ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePDFDownload(purchase)}
                              className="flex-shrink-0"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-2">
                      No PDFs purchased yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Purchase PDFs from the dashboard to download them here
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Having trouble with downloads? Contact support.
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
