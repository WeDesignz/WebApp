"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, Search, Eye, ShoppingCart, Download as DownloadIcon, DollarSign, Package } from "lucide-react";

// Mock data
const kpiData = {
  lifetimeEarnings: 45780,
  views30d: 12453,
  views90d: 38921,
  downloads: 2341,
  purchases: 892,
  activeListings: 47
};

const viewsData = [
  { date: "Jan 1", value: 120 },
  { date: "Jan 8", value: 145 },
  { date: "Jan 15", value: 132 },
  { date: "Jan 22", value: 178 },
  { date: "Jan 29", value: 165 },
  { date: "Feb 5", value: 198 },
  { date: "Feb 12", value: 223 },
  { date: "Feb 19", value: 201 },
  { date: "Feb 26", value: 245 },
  { date: "Mar 5", value: 267 },
  { date: "Mar 12", value: 298 },
  { date: "Mar 19", value: 312 }
];

const purchasesData = [
  { date: "Jan 1", value: 12 },
  { date: "Jan 8", value: 15 },
  { date: "Jan 15", value: 18 },
  { date: "Jan 22", value: 14 },
  { date: "Jan 29", value: 22 },
  { date: "Feb 5", value: 28 },
  { date: "Feb 12", value: 31 },
  { date: "Feb 19", value: 27 },
  { date: "Feb 26", value: 35 },
  { date: "Mar 5", value: 42 },
  { date: "Mar 12", value: 38 },
  { date: "Mar 19", value: 45 }
];

const downloadsData = [
  { date: "Jan 1", value: 45 },
  { date: "Jan 8", value: 52 },
  { date: "Jan 15", value: 48 },
  { date: "Jan 22", value: 61 },
  { date: "Jan 29", value: 58 },
  { date: "Feb 5", value: 73 },
  { date: "Feb 12", value: 82 },
  { date: "Feb 19", value: 76 },
  { date: "Feb 26", value: 89 },
  { date: "Mar 5", value: 95 },
  { date: "Mar 12", value: 103 },
  { date: "Mar 19", value: 112 }
];

const designAnalytics = [
  { id: "1", title: "Modern Logo Design", views: 1245, downloads: 87, purchases: 34, revenue: 3366, trend: [20, 25, 22, 30, 28, 35, 32, 38, 40, 37, 42, 45] },
  { id: "2", title: "Social Media Pack", views: 2103, downloads: 145, purchases: 67, revenue: 10033, trend: [30, 32, 35, 40, 38, 42, 45, 48, 52, 50, 55, 58] },
  { id: "3", title: "Business Card Template", views: 892, downloads: 34, purchases: 12, revenue: 598, trend: [15, 18, 16, 20, 19, 22, 21, 24, 23, 26, 25, 28] },
  { id: "4", title: "UI Kit Pro", views: 3421, downloads: 203, purchases: 89, revenue: 17780, trend: [40, 45, 48, 52, 50, 55, 58, 62, 65, 68, 72, 75] },
  { id: "5", title: "Icon Set Bundle", views: 1567, downloads: 98, purchases: 45, revenue: 4455, trend: [25, 28, 30, 32, 35, 38, 40, 43, 45, 48, 50, 52] },
  { id: "6", title: "Print Poster Design", views: 756, downloads: 28, purchases: 9, revenue: 441, trend: [10, 12, 14, 13, 15, 16, 18, 17, 19, 20, 22, 21] }
];

interface LineChartProps {
  data: { date: string; value: number }[];
  color: string;
  height?: number;
}

function LineChart({ data, color, height = 200 }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 800;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth + padding;
    const y = height - padding - (d.value / maxValue) * chartHeight;
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
              {Math.round(maxValue * percent)}
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
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth + padding;
        const y = height - padding - (d.value / maxValue) * chartHeight;
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
      {data.map((d, i) => {
        if (i % 2 === 0) {
          const x = (i / (data.length - 1)) * chartWidth + padding;
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
  const [viewsDateRange, setViewsDateRange] = useState("90d");
  const [purchasesDateRange, setPurchasesDateRange] = useState("90d");
  const [downloadsDateRange, setDownloadsDateRange] = useState("90d");
  const [searchQuery, setSearchQuery] = useState("");

  const exportToCSV = (data: any[], filename: string) => {
    const csv = data.map(d => `${d.date},${d.value}`).join("\n");
    const blob = new Blob([`Date,Value\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const filteredDesigns = designAnalytics.filter(design =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Top KPI Summary */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Lifetime Earnings"
            value={`₹${kpiData.lifetimeEarnings.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            trend={12.5}
          />
          <KPICard
            title="Views (30 days)"
            value={kpiData.views30d.toLocaleString()}
            icon={<Eye className="w-5 h-5 text-primary" />}
            trend={8.3}
            subtitle={`${kpiData.views90d.toLocaleString()} in 90 days`}
          />
          <KPICard
            title="Total Downloads"
            value={kpiData.downloads.toLocaleString()}
            icon={<DownloadIcon className="w-5 h-5 text-primary" />}
            trend={15.7}
          />
          <KPICard
            title="Total Purchases"
            value={kpiData.purchases.toLocaleString()}
            icon={<ShoppingCart className="w-5 h-5 text-primary" />}
            trend={-2.1}
          />
          <KPICard
            title="Active Listings"
            value={kpiData.activeListings}
            icon={<Package className="w-5 h-5 text-primary" />}
            trend={3.2}
          />
          <KPICard
            title="Avg. Price per Sale"
            value="₹51.32"
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            trend={5.2}
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
              <div className="flex items-center gap-3">
                <Select value={viewsDateRange} onValueChange={setViewsDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(viewsData, "views-data.csv")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={viewsData} color="hsl(var(--primary))" />
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-medium mb-1">💡 Insight</p>
              <p className="text-sm text-muted-foreground">
                Your views have increased by 160% over the past 90 days. Logo designs are your top performers, 
                accounting for 42% of all views.
              </p>
            </div>
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
              <div className="flex items-center gap-3">
                <Select value={purchasesDateRange} onValueChange={setPurchasesDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(purchasesData, "purchases-data.csv")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={purchasesData} color="hsl(var(--success))" />
            <div className="mt-4 p-4 bg-success/10 rounded-lg border-l-4 border-success">
              <p className="text-sm font-medium mb-1">💡 Insight</p>
              <p className="text-sm text-muted-foreground">
                Purchases peak on weekends, with Saturday showing 35% higher conversion rates. 
                Consider launching new designs on Friday evenings for maximum impact.
              </p>
            </div>
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
              <div className="flex items-center gap-3">
                <Select value={downloadsDateRange} onValueChange={setDownloadsDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(downloadsData, "downloads-data.csv")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={downloadsData} color="hsl(var(--info))" />
            <div className="mt-4 p-4 bg-info/10 rounded-lg border-l-4 border-info">
              <p className="text-sm font-medium mb-1">💡 Insight</p>
              <p className="text-sm text-muted-foreground">
                UI/UX designs have a 78% download-to-purchase conversion rate, significantly higher than 
                other categories. Focus on creating more UI kits and interface designs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <th className="p-4 font-medium text-center">Trend (90d)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesigns.map((design) => (
                    <tr
                      key={design.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium">{design.title}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          {design.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DownloadIcon className="w-4 h-4 text-muted-foreground" />
                          {design.downloads}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          {design.purchases}
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        ₹{design.revenue.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Sparkline data={design.trend} color="hsl(var(--primary))" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
