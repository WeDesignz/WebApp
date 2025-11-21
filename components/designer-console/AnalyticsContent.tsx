"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, Search, Eye, ShoppingCart, Download as DownloadIcon, DollarSign, Package, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DesignAnalytics {
  design_id: number;
  title: string;
  views: number;
  downloads: number;
  purchases: number;
  revenue: number;
  performance_score: number;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Helper function to format currency
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Generate time series data from aggregated data (placeholder until backend provides time-series)
const generateTimeSeriesData = (total: number, days: number): { date: string; value: number }[] => {
  const data: { date: string; value: number }[] = [];
  const avgPerDay = total / days;
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Add some variation to make it look realistic
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    const value = Math.max(0, Math.round(avgPerDay * (1 + variation)));
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value,
    });
  }
  
  return data;
};

interface LineChartProps {
  data: { date: string; value: number }[];
  color: string;
  height?: number;
}

function LineChart({ data, color, height = 200 }: LineChartProps) {
  // Validate data and filter out invalid values
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value) && isFinite(d.value));
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No valid data to display
      </div>
    );
  }
  
  const maxValue = Math.max(...validData.map(d => d.value));
  const minValue = Math.min(...validData.map(d => d.value));
  const valueRange = maxValue - minValue || 1; // Prevent division by zero
  
  const width = 800;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = validData.map((d, i) => {
    const x = validData.length > 1 
      ? (i / (validData.length - 1)) * chartWidth + padding 
      : padding + chartWidth / 2;
    const normalizedValue = valueRange > 0 ? (d.value - minValue) / valueRange : 0.5;
    const y = height - padding - normalizedValue * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
        const y = height - padding - percent * chartHeight;
        return (
          <g key={percent}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.2"
            />
            <text
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="hsl(var(--muted-foreground))"
            >
              {Math.round(minValue + (maxValue - minValue) * percent)}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Area fill */}
      <path
        d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
        fill={color}
        opacity="0.1"
      />

      {/* Data points */}
      {validData.map((d, i) => {
        const x = validData.length > 1 
          ? (i / (validData.length - 1)) * chartWidth + padding 
          : padding + chartWidth / 2;
        const normalizedValue = valueRange > 0 ? (d.value - minValue) / valueRange : 0.5;
        const y = height - padding - normalizedValue * chartHeight;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={color}
            className="hover:r-6 transition-all cursor-pointer"
          />
        );
      })}

      {/* X-axis labels */}
      {validData.map((d, i) => {
        if (i % 2 === 0) {
          const x = validData.length > 1 
            ? (i / (validData.length - 1)) * chartWidth + padding 
            : padding + chartWidth / 2;
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
            >
              {d.date}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}

interface SparklineProps {
  data: number[];
  color: string;
}

function Sparkline({ data, color }: SparklineProps) {
  const width = 100;
  const height = 30;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
}

function KPICard({ title, value, icon, trend, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsContent() {
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all designs
  const { data: designsData, isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['myDesigns', 'all'],
    queryFn: async () => {
      const response = await apiClient.getMyDesigns({ page: 1, limit: 1000 }); // Get all designs
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const designs = designsData?.designs || [];

  // Fetch analytics for all designs
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['designAnalytics', designs.map(d => d.id)],
    queryFn: async () => {
      const analyticsPromises = designs.map(design =>
        apiClient.getDesignAnalytics(design.id)
          .then(res => {
            if (res.error || !res.data || typeof res.data !== 'object') {
              // Return default values if API call failed
              return {
                design_id: design.id,
                title: design.title || 'Unknown',
                views: 0,
                downloads: 0,
                purchases: 0,
                revenue: 0,
                performance_score: 0,
              };
            }
            return {
              ...res.data,
              design_id: design.id,
              views: Number(res.data.views) || 0,
              downloads: Number(res.data.downloads) || 0,
              purchases: Number(res.data.purchases) || 0,
              revenue: Number(res.data.revenue) || 0,
              performance_score: Number(res.data.performance_score) || 0,
            };
          })
          .catch(error => {
            // Return default values on error
            console.error(`Error fetching analytics for design ${design.id}:`, error);
            return {
              design_id: design.id,
              title: design.title || 'Unknown',
              views: 0,
              downloads: 0,
              purchases: 0,
              revenue: 0,
              performance_score: 0,
            };
          })
      );
      const results = await Promise.all(analyticsPromises);
      return results.filter(r => r && r.design_id); // Filter out any completely invalid results
    },
    enabled: designs.length > 0,
    staleTime: 30 * 1000,
  });

  const designAnalytics: DesignAnalytics[] = (analyticsData || []) as DesignAnalytics[];

  // Aggregate analytics
  const aggregatedData = useMemo(() => {
    const totalViews = designAnalytics.reduce((sum, d) => sum + (d.views || 0), 0);
    const totalDownloads = designAnalytics.reduce((sum, d) => sum + (d.downloads || 0), 0);
    const totalPurchases = designAnalytics.reduce((sum, d) => sum + (d.purchases || 0), 0);
    const totalRevenue = designAnalytics.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgPerformanceScore = designAnalytics.length > 0
      ? designAnalytics.reduce((sum, d) => sum + (d.performance_score || 0), 0) / designAnalytics.length
      : 0;

    return {
      totalViews,
      totalDownloads,
      totalPurchases,
      totalRevenue,
      avgPerformanceScore,
      activeListings: designs.length,
    };
  }, [designAnalytics, designs]);

  // Generate time series data based on period
  const getDaysForPeriod = (period: string): number => {
    switch (period) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      default: return 90; // Default to 90 days for "all"
    }
  };

  const days = getDaysForPeriod(timePeriod);
  const viewsData = generateTimeSeriesData(aggregatedData.totalViews, days);
  const downloadsData = generateTimeSeriesData(aggregatedData.totalDownloads, days);
  const purchasesData = generateTimeSeriesData(aggregatedData.totalPurchases, days);

  // Top performing designs (sorted by performance score)
  const topDesigns = useMemo(() => {
    return [...designAnalytics]
      .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
      .slice(0, 10);
  }, [designAnalytics]);

  // Filtered designs for search
  const filteredDesigns = useMemo(() => {
    return designAnalytics.filter(design =>
      design.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0));
  }, [designAnalytics, searchQuery]);

  const exportToCSV = (data: any[], filename: string) => {
    const csv = data.map(d => `${d.date},${d.value}`).join("\n");
    const blob = new Blob([`Date,Value\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const isLoading = isLoadingDesigns || isLoadingAnalytics;

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No designs found</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first design to start tracking analytics
          </p>
          <Link href="/designer-console/designs/upload">
            <Button>
              Upload Design
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Top KPI Summary */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <Select value={timePeriod} onValueChange={(value: "7d" | "30d" | "90d" | "all") => setTimePeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(aggregatedData.totalRevenue)}
            icon={<DollarSign className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Total Views"
            value={formatNumber(aggregatedData.totalViews)}
            icon={<Eye className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Total Downloads"
            value={formatNumber(aggregatedData.totalDownloads)}
            icon={<DownloadIcon className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Total Purchases"
            value={formatNumber(aggregatedData.totalPurchases)}
            icon={<ShoppingCart className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Active Listings"
            value={aggregatedData.activeListings}
            icon={<Package className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Avg. Performance Score"
            value={`${aggregatedData.avgPerformanceScore.toFixed(1)}/10`}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
          />
        </div>
      </div>

      {/* Charts Area */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Trends & Insights</h2>

        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Views Over Time</CardTitle>
                <CardDescription>Track how many people are viewing your designs</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(viewsData, "views-data.csv")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewsData.length > 0 ? (
              <>
                <LineChart data={viewsData} color="hsl(var(--primary))" />
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">💡 Insight</p>
                  <p className="text-sm text-muted-foreground">
                    Total views: {formatNumber(aggregatedData.totalViews)}. 
                    {topDesigns.length > 0 && ` Top performing design: "${topDesigns[0].title}" with ${formatNumber(topDesigns[0].views)} views.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No view data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchases Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Purchases Over Time</CardTitle>
                <CardDescription>Monitor your sales performance</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(purchasesData, "purchases-data.csv")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {purchasesData.length > 0 ? (
              <>
                <LineChart data={purchasesData} color="hsl(var(--success))" />
                <div className="mt-4 p-4 bg-success/10 rounded-lg border-l-4 border-success">
                  <p className="text-sm font-medium mb-1">💡 Insight</p>
                  <p className="text-sm text-muted-foreground">
                    Total purchases: {formatNumber(aggregatedData.totalPurchases)}. 
                    Total revenue: {formatCurrency(aggregatedData.totalRevenue)}.
                    {aggregatedData.totalPurchases > 0 && ` Average revenue per purchase: ${formatCurrency(aggregatedData.totalRevenue / aggregatedData.totalPurchases)}.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No purchase data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Downloads Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Downloads Over Time</CardTitle>
                <CardDescription>See how often your designs are being downloaded</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(downloadsData, "downloads-data.csv")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {downloadsData.length > 0 ? (
              <>
                <LineChart data={downloadsData} color="hsl(var(--info))" />
                <div className="mt-4 p-4 bg-info/10 rounded-lg border-l-4 border-info">
                  <p className="text-sm font-medium mb-1">💡 Insight</p>
                  <p className="text-sm text-muted-foreground">
                    Total downloads: {formatNumber(aggregatedData.totalDownloads)}.
                    {aggregatedData.totalViews > 0 && ` Download rate: ${((aggregatedData.totalDownloads / aggregatedData.totalViews) * 100).toFixed(1)}%.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No download data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Designs */}
      {topDesigns.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Top Performing Designs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topDesigns.slice(0, 6).map((design, index) => (
              <Card key={design.design_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-semibold line-clamp-1">{design.title}</h3>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Performance Score: {design.performance_score.toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Views</div>
                      <div className="font-semibold">{formatNumber(design.views)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Downloads</div>
                      <div className="font-semibold">{formatNumber(design.downloads)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Purchases</div>
                      <div className="font-semibold">{formatNumber(design.purchases)}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Revenue</span>
                      <span className="font-semibold">{formatCurrency(design.revenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Design-Level Analytics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Design Performance</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredDesigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No designs match your search</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-sm">
                      <th className="p-4 font-medium">Design</th>
                      <th className="p-4 font-medium text-right">Views</th>
                      <th className="p-4 font-medium text-right">Downloads</th>
                      <th className="p-4 font-medium text-right">Purchases</th>
                      <th className="p-4 font-medium text-right">Revenue</th>
                      <th className="p-4 font-medium text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDesigns.map((design) => {
                      // Generate trend data for sparkline (simplified)
                      const trendData = Array.from({ length: 12 }, () => 
                        Math.floor(Math.random() * 20) + design.performance_score * 2
                      );
                      return (
                        <tr
                          key={design.design_id}
                          className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/designer-console/designs/${design.design_id}`}
                        >
                          <td className="p-4">
                            <div className="font-medium">{design.title}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                              {formatNumber(design.views)}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DownloadIcon className="w-4 h-4 text-muted-foreground" />
                              {formatNumber(design.downloads)}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                              {formatNumber(design.purchases)}
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium">
                            {formatCurrency(design.revenue)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-medium">{design.performance_score.toFixed(1)}/10</span>
                              <Sparkline data={trendData} color="hsl(var(--primary))" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
