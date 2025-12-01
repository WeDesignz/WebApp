"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import { apiRequest, getApiBaseUrl } from "@/lib/api";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  tags?: Array<{ id: number; name: string }>;
}

export default function DesignerFAQPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Fetch FAQs for designer console
  const { data: faqsData, isLoading, isError } = useQuery({
    queryKey: ['faqs', 'designer_console'],
    queryFn: async () => {
      const response = await apiRequest<FAQ[]>(
        '/api/feedback/faqs/?location=designer_console'
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
  });

  const faqs = faqsData || [];

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      faqs.flatMap((faq) => faq.tags?.map((tag) => tag.name) || [])
    )
  );

  // Filter FAQs by selected tag
  const filteredFAQs =
    selectedTag === "all"
      ? faqs
      : faqs.filter((faq) =>
          faq.tags?.some((tag) => tag.name === selectedTag)
        );

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h1>
                <p className="text-muted-foreground mt-1">
                  Find answers to common questions about WeDesignz for designers
                </p>
              </div>

              {/* Loading State */}
              {isLoading && (
                <Card className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading FAQs...</p>
                </Card>
              )}

              {/* Error State */}
              {isError && (
                <Card className="p-12 text-center">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-destructive/50" />
                  <h3 className="text-xl font-semibold mb-2">Error loading FAQs</h3>
                  <p className="text-muted-foreground">
                    Please try refreshing the page.
                  </p>
                </Card>
              )}

              {/* Tag Filter */}
              {!isLoading && !isError && allTags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedTag === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag("all")}
                  >
                    All
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}

              {/* FAQ List */}
              {!isLoading && !isError && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredFAQs.map((faq, index) => {
                        const isOpen = openFAQ === faq.id;
                        return (
                          <motion.div
                            key={faq.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="overflow-hidden">
                              <button
                                onClick={() => setOpenFAQ(isOpen ? null : faq.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                  <span className="font-medium">{faq.question}</span>
                                </div>
                                {isOpen ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 pl-12 text-muted-foreground">
                                      {faq.answer}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && filteredFAQs.length === 0 && (
                <Card className="p-12 text-center">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground">
                    {selectedTag !== "all"
                      ? "Try selecting a different tag."
                      : "No FAQs are available at the moment."}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

