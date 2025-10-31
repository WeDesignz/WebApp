"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Crown, UserPlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContentProps {
  searchQuery: string;
  selectedCategory: string;
}

const categoryCards = [
  { id: "jerseys", title: "Jerseys", icon: "👕", color: "from-blue-500/10 to-cyan-500/10" },
  { id: "vectors", title: "Vectors", icon: "🎨", color: "from-purple-500/10 to-pink-500/10" },
  { id: "psd", title: "PSD Files", icon: "📁", color: "from-orange-500/10 to-red-500/10" },
  { id: "icons", title: "Icons", icon: "⭐", color: "from-yellow-500/10 to-amber-500/10" },
  { id: "mockups", title: "Mockups", icon: "🖼️", color: "from-green-500/10 to-emerald-500/10" },
  { id: "illustrations", title: "Illustrations", icon: "🎭", color: "from-indigo-500/10 to-violet-500/10" },
  { id: "3d-models", title: "3D Models", icon: "🎲", color: "from-rose-500/10 to-pink-500/10" },
];

const mockImages = [
  { id: 1, title: "Modern Logo Design", image: "/generated_images/Brand_Identity_Design_67fa7e1f.png", isPremium: false },
  { id: 2, title: "Website Mockup", image: "/generated_images/Website_Mockup_Design_f379e810.png", isPremium: true },
  { id: 3, title: "Mobile App UI", image: "/generated_images/Mobile_App_Interface_672164f7.png", isPremium: false },
  { id: 4, title: "Typography Poster", image: "/generated_images/Typography_Poster_Design_be3980bc.png", isPremium: true },
  { id: 5, title: "3D Product Render", image: "/generated_images/3D_Product_Rendering_3967b01e.png", isPremium: false },
  { id: 6, title: "Character Illustration", image: "/generated_images/Creative_Character_Illustration_04c3e6df.png", isPremium: true },
  { id: 7, title: "Dashboard Design", image: "/generated_images/Modern_UI_Dashboard_Design_159dd6b9.png", isPremium: false },
  { id: 8, title: "Brand Identity", image: "/generated_images/Brand_Identity_Design_67fa7e1f.png", isPremium: true },
];

export default function CustomerDashboardContent({ searchQuery, selectedCategory }: ContentProps) {
  const [images, setImages] = useState(mockImages);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, page]);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      const newImages = mockImages.map((img, idx) => ({
        ...img,
        id: img.id + page * mockImages.length + idx,
      }));
      setImages((prev) => [...prev, ...newImages]);
      setPage((prev) => prev + 1);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {categoryCards.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`w-40 h-32 p-4 bg-gradient-to-br ${cat.color} border-primary/20 hover:scale-105 hover:border-primary/40 transition-all cursor-pointer`}>
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="font-semibold text-sm">{cat.title}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Invite Freelancers</h3>
                <p className="text-sm text-muted-foreground">
                  Invite talented designers to list their work on our platform
                </p>
              </div>
            </div>
            <Button size="lg" className="whitespace-nowrap">
              + Invite Freelancers
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Design Feed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer"
              >
                <img
                  src={img.image}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                
                {img.isPremium && (
                  <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                    <Crown className="w-3 h-3" />
                    Premium
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold mb-2">{img.title}</h3>
                    {img.isPremium ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => window.location.href = '/customer-dashboard/plans'}
                      >
                        View Plans
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            ref={observerRef}
            className="flex justify-center items-center py-8"
          >
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more designs...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
