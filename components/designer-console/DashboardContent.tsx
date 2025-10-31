"use client";

import { 
  Upload, 
  CheckCircle, 
  Clock, 
  Eye, 
  Download, 
  TrendingUp,
  MoreVertical,
  ChevronRight,
  Edit,
  Copy,
  Trash2,
  BarChart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function DashboardContent() {
  const today = new Date();
  const currentDay = today.getDate();
  const isSettlementWindow = currentDay >= 5 && currentDay <= 10;
  const nextSettlementDate = currentDay > 10 ? new Date(today.getFullYear(), today.getMonth() + 1, 5) : new Date(today.getFullYear(), today.getMonth(), 5);

  const kpiCards = [
    { icon: Upload, label: "Total Uploads", value: "24", href: "/designer-console/designs", color: "text-blue-500" },
    { icon: CheckCircle, label: "Approved Designs", value: "18", href: "/designer-console/designs?filter=approved", color: "text-green-500" },
    { icon: Clock, label: "Pending Reviews", value: "3", href: "/designer-console/designs?filter=pending", color: "text-yellow-500" },
    { icon: Eye, label: "Views", value: "1,247", href: "/designer-console/analytics", color: "text-purple-500" },
    { icon: Download, label: "Downloads", value: "89", href: "/designer-console/analytics", color: "text-primary" },
    { 
      icon: TrendingUp, 
      label: "Performance Score", 
      value: "8.4/10", 
      href: "/designer-console/analytics", 
      color: "text-orange-500", 
      hasProgress: true, 
      progress: 84,
      tooltip: "Performance Score is calculated based on: 20% Design Quality + 60% Customer Satisfaction + 20% Engagement Metrics"
    },
  ];

  const recentDesigns = [
    { id: 1, thumbnail: "/placeholder.jpg", title: "Modern Logo Design", status: "Approved", date: "2 days ago", views: 145, downloads: 23, purchases: 5 },
    { id: 2, thumbnail: "/placeholder.jpg", title: "Business Card Template", status: "Pending", date: "3 days ago", views: 89, downloads: 12, purchases: 2 },
    { id: 3, thumbnail: "/placeholder.jpg", title: "Social Media Pack", status: "Approved", date: "5 days ago", views: 234, downloads: 45, purchases: 12 },
    { id: 4, thumbnail: "/placeholder.jpg", title: "Web UI Kit", status: "Rejected", date: "1 week ago", views: 67, downloads: 8, purchases: 1 },
    { id: 5, thumbnail: "/placeholder.jpg", title: "Poster Design", status: "Approved", date: "1 week ago", views: 178, downloads: 34, purchases: 8 },
    { id: 6, thumbnail: "/placeholder.jpg", title: "Icon Set", status: "Pending", date: "2 weeks ago", views: 92, downloads: 15, purchases: 3 },
  ];

  const activityTimeline = [
    { text: "Design 'Modern Logo Design' approved", time: "2 hours ago", type: "success" },
    { text: "₹500 credited to wallet", time: "1 day ago", type: "earning" },
    { text: "Settlement accepted (scheduled for Jan 10)", time: "3 days ago", type: "settlement" },
    { text: "New message from support", time: "5 days ago", type: "message" },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">Good afternoon, Vaibhav</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">₹12,450</span>
                <span className="text-muted-foreground text-sm">Wallet Balance</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Net earnings this month:</span>
                  <span className="font-semibold">₹8,200</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Pending withdrawals:</span>
                  <span className="font-semibold">₹2,500</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total downloads:</span>
                  <span className="font-semibold">89</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <TooltipProvider>
              {kpiCards.map((card) => {
                const Icon = card.icon;
                const cardContent = (
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Icon className={`w-5 h-5 ${card.color}`} />
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{card.value}</div>
                      <div className="text-xs text-muted-foreground">{card.label}</div>
                      {card.hasProgress && (
                        <Progress value={card.progress} className="mt-3 h-1.5" />
                      )}
                    </CardContent>
                  </Card>
                );

                if (card.tooltip) {
                  return (
                    <Tooltip key={card.label}>
                      <TooltipTrigger asChild>
                        <Link href={card.href}>
                          {cardContent}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{card.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link key={card.label} href={card.href}>
                    {cardContent}
                  </Link>
                );
              })}
            </TooltipProvider>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Designs</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4">Design</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Views</th>
                      <th className="pb-3 pr-4">Downloads</th>
                      <th className="pb-3 pr-4">Purchases</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDesigns.map((design) => (
                      <tr key={design.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0" />
                            <span className="font-medium text-sm">{design.title}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge 
                            variant={design.status === "Approved" ? "default" : design.status === "Pending" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {design.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">{design.date}</td>
                        <td className="py-3 pr-4 text-sm">{design.views}</td>
                        <td className="py-3 pr-4 text-sm">{design.downloads}</td>
                        <td className="py-3 pr-4 text-sm font-medium">{design.purchases}</td>
                        <td className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart className="w-4 h-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                disabled={design.status === "Approved" && design.purchases > 0}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {activityTimeline.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === "success" ? "bg-green-500" :
                      activity.type === "earning" ? "bg-primary" :
                      activity.type === "settlement" ? "bg-blue-500" :
                      "bg-muted-foreground"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <Badge variant="destructive" className="text-xs">3 new</Badge>
              </div>
              <div className="space-y-3">
                {["Design approved", "Payment received", "New comment"].map((notif, i) => (
                  <div key={i} className="text-sm p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <p className="font-medium">{notif}</p>
                    <p className="text-xs text-muted-foreground mt-1">{i + 1}h ago</p>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3 text-sm">View All</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-3">Linked Account Status</h3>
              <div className="flex items-center justify-center py-4">
                <Badge className="text-sm px-4 py-2 bg-green-500/10 text-green-500 border-green-500/30">
                  ✓ Verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Your bank account is linked and verified
              </p>
              <Button variant="outline" className="w-full text-sm">View Details</Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-3">Settlement Window</h3>
              {isSettlementWindow ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Pending Amount</span>
                      <span className="font-bold">₹8,200</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span>₹164</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>You'll Receive</span>
                        <span className="text-primary">₹8,036</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mb-3">Accept Settlement</Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Deadline: {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({10 - currentDay} days left)
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    The settlement window is currently closed.
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Next Settlement Date</p>
                    <p className="text-sm font-semibold">
                      {nextSettlementDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Settlement windows are open from the 5th to 10th of each month. You can accept your pending settlement during this period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
