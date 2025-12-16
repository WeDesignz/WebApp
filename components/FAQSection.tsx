"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default function FAQSection() {
  // Fetch FAQs for landing page
  const { data: faqsData, isLoading, error } = useQuery({
    queryKey: ['faqs', 'landing_page'],
    queryFn: async () => {
      const response = await apiRequest<FAQ[]>(
        '/api/feedback/faqs/?location=landing_page'
      );
      if (response.error) {
        console.error('Error fetching FAQs:', response.error);
        return [];
      }
      return response.data || [];
    },
  });

  const faqs = faqsData || [];
  
  // Error handling
  if (error) {
    console.error('FAQ Query Error:', error);
  }

  return (
    <section id="faqs" className="py-24">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">FAQs</h2>
          <p className="text-foreground/70 mt-3">Common questions about selling designs and services.</p>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((item) => (
              <details key={item.id} className="rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer select-none text-base font-medium">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-foreground/80">{item.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No FAQs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
