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
        // Poll every 3 seconds if there are processing downloads
        if (hasProcessing) {
          return 3000;
        }
      }
      return false;
    },
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

    try {
      const pdfId = download.pdfDownloadId;
      setDownloadingPDFId(pdfId);
      
      try {
        const response = await apiClient.downloadPDF(pdfId);
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data instanceof Blob) {
          // Create download link
          const url = window.URL.createObjectURL(response.data);
          const a = document.createElement('a');
          a.href = url;
          // Use filename from response if available, otherwise use default
          const downloadFilename = (response as any).filename || `designs_${pdfId}.pdf`;
          a.download = downloadFilename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Download started",
            description: "Your PDF is being downloaded.",
          });
        }
      } finally {
        setDownloadingPDFId(null);
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
      setDownloadingPDFId(null);
    }
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
                        <Badge 
                          variant={
                            download.status === 'completed' ? 'default' :
                            download.status === 'processing' ? 'secondary' :
                            download.status === 'failed' ? 'destructive' : 'outline'
                          }
                          className="absolute top-2 left-2 z-10"
                        >
                          {download.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          {download.status}
                        </Badge>
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
                        <div className="p-3 text-center bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            {download.status === 'processing' && 'PDF is being generated...'}
                            {download.status === 'pending' && 'PDF request is pending'}
                            {download.status === 'failed' && 'PDF generation failed. Please contact support.'}
                          </p>
                          {download.status === 'processing' && (
                            <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin text-primary" />
                          )}
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleDownload(download)}
                          disabled={downloadingPDFId === download.pdfDownloadId}
                        >
                          {downloadingPDFId === download.pdfDownloadId ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
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
                            <Badge 
                              variant={
                                download.status === 'completed' ? 'default' :
                                download.status === 'processing' ? 'secondary' :
                                download.status === 'failed' ? 'destructive' : 'outline'
                              }
                              className="text-xs"
                            >
                              {download.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              {download.status}
                            </Badge>
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
                          <div className="flex-1 p-2 text-center bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground">
                              {download.status === 'processing' && 'Generating...'}
                              {download.status === 'pending' && 'Pending'}
                              {download.status === 'failed' && 'Failed'}
                            </p>
                            {download.status === 'processing' && (
                              <Loader2 className="w-3 h-3 mx-auto mt-1 animate-spin text-primary" />
                            )}
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleDownload(download)}
                            disabled={downloadingPDFId === download.pdfDownloadId}
                          >
                            {downloadingPDFId === download.pdfDownloadId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Preparing...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
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

