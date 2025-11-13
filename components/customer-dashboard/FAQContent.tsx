"use client";

import { useState } from "react";
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I download my purchased designs?",
    answer: "You can download your purchased designs from the 'My Downloads' section. Simply click on the design you want and select 'Download'. All files will be available in your account for future downloads.",
    category: "Downloads",
  },
  {
    id: "2",
    question: "What file formats are available?",
    answer: "We provide designs in multiple formats including PSD, AI, SVG, PNG, PDF, FIGMA, and SKETCH. The available formats depend on the specific design and are listed on each product page.",
    category: "Downloads",
  },
  {
    id: "3",
    question: "How do I track my custom order?",
    answer: "You can track your custom orders in the 'My Orders' section. Each order shows its current status, estimated delivery time, and allows you to chat directly with the designer working on your project.",
    category: "Orders",
  },
  {
    id: "4",
    question: "What is the delivery time for custom orders?",
    answer: "Our standard delivery time for custom orders is 1 hour. However, complex projects may take longer. You'll receive real-time updates on your order status and can communicate with the designer throughout the process.",
    category: "Orders",
  },
  {
    id: "5",
    question: "How do subscription plans work?",
    answer: "Subscription plans give you access to a certain number of designs per month. Unused downloads don't roll over, but you can upgrade or downgrade your plan at any time. Check your usage in the 'Plans' section.",
    category: "Plans",
  },
  {
    id: "6",
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time from the 'Plans' section. Your subscription will remain active until the end of your current billing period, and you'll continue to have access to all features until then.",
    category: "Plans",
  },
  {
    id: "7",
    question: "How do I contact a designer?",
    answer: "You can contact designers through the 'My Orders' section if you have an active order with them. For general inquiries, you can use the chat feature in this support section or email our support team.",
    category: "General",
  },
  {
    id: "8",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and digital payment methods through Razorpay. All transactions are secure and encrypted. You can manage your payment methods in the 'Plans' section.",
    category: "Payment",
  },
];

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
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFAQs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const categories = ["all", ...Array.from(new Set(faqs.map(faq => faq.category)))];

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

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* FAQ List */}
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

        {filteredFAQs.length === 0 && (
          <Card className="p-12 text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No FAQs found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
