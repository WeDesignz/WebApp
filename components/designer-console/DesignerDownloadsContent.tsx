"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Grid3x3,
  List,
  Calendar,
  Loader2,
  AlertCircle,
  Filter,
  X,
  FileImage,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { downloadPDFToDevice } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PDFStatusBadge } from "@/components/customer-dashboard/PDFStatusCard";
import { useToast } from "@/hooks/use-toast";

interface PDFDownload {
  id: number | string;
  name?: string;
  title?: string;
  format?: string;
  downloadDate?: string;
  created_at?: string;
  type?: "free" | "paid";
  price?: number;
  total_amount?: number | string;
  pdfDownloadId?: number;
  status?: string;
  total_pages?: number;
}

// Professional PDF Icon Component
const PDFIcon = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* PDF Document Shape */}
      <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-tl-sm rounded-tr-sm rounded-bl-sm shadow-lg">
        {/* Folded corner effect */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-700/50" />
        
        {/* White content area */}
        <div className="absolute inset-2 bg-white rounded-sm">
          {/* PDF text lines */}
          <div className="absolute top-2 left-2 right-2 space-y-1">
            <div className="h-1 bg-red-500/20 rounded w-full" />
            <div className="h-1 bg-red-500/20 rounded w-3/4" />
            <div className="h-1 bg-red-500/20 rounded w-5/6" />
          </div>
          
          {/* PDF label at bottom */}
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-[8px] font-bold text-red-600 uppercase tracking-wider">PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DesignerDownloadsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [downloadingPDFId, setDownloadingPDFId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'pending' | 'failed'>('all');

  // Fetch PDF downloads
  const { data: pdfDownloadsData, refetch: refetchPDFDownloads } = useQuery({
    queryKey: ['designerPDFDownloads', typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (typeFilter !== 'all') {
        params.download_type = typeFilter;
      }
      const response = await apiClient.getPDFDownloads(params);
      if (response.error) {
        return [];
      }
      return response.data?.downloads || [];
    },
    staleTime: 0,
    refetchInterval: (query) => {
      // Check if there are any processing/pending downloads
      const data = query.state.data as any[] | undefined;
      if (data && Array.isArray(data)) {
        const hasProcessing = data.some((pdf: any) => 
          pdf.status === 'processing' || pdf.status === 'pending'
        );
        // Poll every 2 seconds when processing so Download button appears quickly when ready
        if (hasProcessing) {
          return 2000;
        }
      }
      return false;
    },
    refetchOnWindowFocus: true, // Refetch when user returns to tab so Download button appears
  });

  const pdfDownloads = pdfDownloadsData || [];

  // Transform PDF downloads to match download format
  const transformedPDFDownloads: PDFDownload[] = pdfDownloads
    .filter((pdf: any) => {
      // Apply status filter client-side
      if (statusFilter === 'all') return true;
      return pdf.status === statusFilter;
    })
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
      status: pdf.status,
      total_pages: pdf.total_pages,
    }));

  // Sort by date
  const allDownloads = transformedPDFDownloads.sort((a, b) => {
    const dateA = new Date(a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const freeDownloads = transformedPDFDownloads.filter((d) => d.type === "free").length;
  const paidDownloads = transformedPDFDownloads.filter((d) => d.type === "paid").length;
  const totalDownloads = transformedPDFDownloads.length;

  const handleDownload = async (download: PDFDownload) => {
    if (!download.pdfDownloadId) {
      toast({
        title: "Download failed",
        description: "Invalid download ID",
        variant: "destructive",
      });
      return;
    }

    const pdfId = download.pdfDownloadId;
    setDownloadingPDFId(pdfId);
    setDownloadProgress(0);

    await downloadPDFToDevice(pdfId, {
      getDownloadUrl: (id) => apiClient.getPDFDownloadUrl(id),
      downloadPDF: (id, onP) => apiClient.downloadPDF(id, onP),
      onGenerating: () => {
        setDownloadingPDFId(null);
        setDownloadProgress(null);
        refetchPDFDownloads();
        toast({
          title: "Generating PDF",
          description: "Your PDF is being generated. It will be ready in 30–60 seconds.",
        });
      },
      onProgress: (p) => setDownloadProgress(p),
      onComplete: () => {
        setDownloadingPDFId(null);
        setDownloadProgress(null);
        toast({
          title: "Download started",
          description: "Your PDF is being downloaded.",
        });
      },
      onError: (msg) => {
        setDownloadingPDFId(null);
        setDownloadProgress(null);
        toast({
          title: "Download failed",
          description: msg || "Failed to download file",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Downloads (PDFs)
            </h1>
            <p className="text-muted-foreground mt-1">
              Access all your purchased mockup PDFs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total PDF Downloads</p>
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
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Downloads</p>
                <p className="text-3xl font-bold">{paidDownloads}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Free/Paid Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | 'free' | 'paid')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'completed' | 'processing' | 'pending' | 'failed')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Downloads List/Grid */}
        <div>
          {allDownloads.length === 0 ? (
            <Card className="p-12 text-center">
              <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No PDF downloads yet</h3>
              <p className="text-muted-foreground">
                Your purchased mockup PDFs will appear here
              </p>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDownloads.map((download, index) => (
                <motion.div
                  key={download.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative group flex items-center justify-center p-6">
                      <PDFIcon className="w-20 h-20" />
                      <Badge className="absolute top-2 right-2 z-10">
                        {download.type || 'paid'}
                      </Badge>
                      {download.status && (
                        <div className="absolute top-2 left-2 z-10">
                          <PDFStatusBadge status={download.status as 'pending' | 'processing' | 'completed' | 'failed'} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold line-clamp-1">
                        {download.name || download.title || `PDF Download #${download.id}`}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{download.format || 'PDF'}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      {download.type === "paid" && download.price && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">₹{download.price}</span>
                          {download.total_pages && (
                            <span className="text-xs text-muted-foreground">
                              {download.total_pages} designs
                            </span>
                          )}
                        </div>
                      )}
                      {download.status !== 'completed' ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <PDFStatusBadge status={download.status as 'pending' | 'processing' | 'completed' | 'failed'} />
                          </div>
                          <p className="text-xs text-center text-muted-foreground mb-2">
                            {download.status === 'processing' && 'Adding designs to your PDF...'}
                            {download.status === 'pending' && 'Click below to generate your PDF'}
                            {download.status === 'failed' && 'Please try again or contact support'}
                          </p>
                          {download.status === 'processing' && (
                            <div className="mt-2 flex justify-center gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                  className="w-1.5 h-1.5 rounded-full bg-primary"
                                />
                              ))}
                            </div>
                          )}
                          {download.status === 'pending' && (
                            <Button
                              size="sm"
                              className="w-full mt-2 gap-2"
                              onClick={() => handleDownload(download)}
                              disabled={downloadingPDFId === download.pdfDownloadId}
                            >
                              {downloadingPDFId === download.pdfDownloadId ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  Generate PDF
                                </>
                              )}
                            </Button>
                          )}
                        </motion.div>
                      ) : (
                        <div className="w-full space-y-2">
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleDownload(download)}
                            disabled={downloadingPDFId === download.pdfDownloadId}
                          >
                            {downloadingPDFId === download.pdfDownloadId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {downloadProgress != null ? `Downloading ${downloadProgress}%` : "Preparing..."}
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          {downloadingPDFId === download.pdfDownloadId && downloadProgress != null && (
                            <Progress value={downloadProgress} className="h-2 w-full" />
                          )}
                        </div>
                      )}
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
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded flex items-center justify-center flex-shrink-0 p-3">
                        <PDFIcon className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {download.name || download.title || `PDF Download #${download.id}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">{download.format || 'PDF'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {download.type || 'paid'}
                          </Badge>
                          {download.status && (
                            <PDFStatusBadge status={download.status as 'pending' | 'processing' | 'completed' | 'failed'} />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {download.type === "paid" && download.price && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-semibold">₹{download.price}</p>
                            {download.total_pages && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {download.total_pages} designs
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {download.status !== 'completed' ? (
                          <div className="flex flex-col items-end gap-2">
                            <PDFStatusBadge status={download.status as 'pending' | 'processing' | 'completed' | 'failed'} />
                            <p className="text-xs text-muted-foreground">
                              {download.status === 'processing' && 'Adding designs...'}
                              {download.status === 'pending' && 'Click to generate'}
                            </p>
                            {download.status === 'pending' && (
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => handleDownload(download)}
                                disabled={downloadingPDFId === download.pdfDownloadId}
                              >
                                {downloadingPDFId === download.pdfDownloadId ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-4 h-4" />
                                    Generate PDF
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleDownload(download)}
                              disabled={downloadingPDFId === download.pdfDownloadId}
                            >
                              {downloadingPDFId === download.pdfDownloadId ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {downloadProgress != null ? `${downloadProgress}%` : "Preparing..."}
                                </>
                              ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                  </>
                                )}
                            </Button>
                            {downloadingPDFId === download.pdfDownloadId && downloadProgress != null && (
                              <Progress value={downloadProgress} className="h-1.5 w-full max-w-[140px]" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

