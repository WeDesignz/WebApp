"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Video,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  tags?: Array<{ id: number; name: string }>;
}

const helpCategories = [
  {
    icon: FileText,
    title: "Getting Started",
    description: "Learn the basics of using WeDesignz",
    color: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Detailed guides and tutorials",
    color: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    color: "from-orange-500/10 to-red-500/10",
    borderColor: "border-orange-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: Zap,
    title: "Quick Tips",
    description: "Pro tips to maximize your experience",
    color: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/20",
    iconColor: "text-green-500",
  },
];

export default function FAQContent() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Fetch FAQs for customer dashboard
  const { data: faqsData, isLoading, isError } = useQuery({
    queryKey: ['faqs', 'customer_dashboard'],
    queryFn: async () => {
      const response = await apiRequest<FAQ[]>(
        '/api/feedback/faqs/?location=customer_dashboard'
      );
      if (response.error) {
        console.error('Error fetching FAQs:', response.error);
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
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mt-1">
            Find answers to common questions about WeDesignz
          </p>
        </div>

        {/* Help Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Help Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {helpCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-6 bg-gradient-to-br ${category.color} ${category.borderColor} hover:shadow-lg transition-all cursor-pointer`}>
                    <div className={`p-3 bg-background/50 rounded-lg w-12 h-12 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${category.iconColor}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
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
  );
}
