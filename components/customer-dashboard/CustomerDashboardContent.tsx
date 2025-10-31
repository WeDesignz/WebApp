"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Crown, UserPlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductModal from "./ProductModal";

interface ContentProps {
  searchQuery: string;
  selectedCategory: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "Active" | "Inactive" | "Draft" | "Deleted";
  product_plan_type: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  media: string[];
  sub_products: {
    id: number;
    product_number: string;
    color: string;
    price: number;
    stock: number;
    status: "Show" | "Hide";
  }[];
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

const mockProducts: Product[] = [
  {
    id: 1,
    title: "Modern Logo Design",
    description: "Professional logo design with modern aesthetics. Perfect for startups and rebranding projects. Includes vector files in multiple formats.",
    category: "Logos",
    status: "Active",
    product_plan_type: "Basic",
    created_by: "John Designer",
    created_at: "2024-01-15T10:30:00Z",
    updated_by: "John Designer",
    updated_at: "2024-01-20T14:45:00Z",
    media: ["/generated_images/Brand_Identity_Design_67fa7e1f.png"],
    sub_products: [
      { id: 101, product_number: "LOGO-001-BLK", color: "#000000", price: 1299, stock: 50, status: "Show" },
      { id: 102, product_number: "LOGO-001-WHT", color: "#FFFFFF", price: 1299, stock: 30, status: "Show" },
      { id: 103, product_number: "LOGO-001-BLU", color: "#3B82F6", price: 1499, stock: 20, status: "Show" },
    ]
  },
  {
    id: 2,
    title: "Website Mockup",
    description: "Complete website mockup design with responsive layouts. Includes desktop, tablet, and mobile views. Premium quality PSD files.",
    category: "Mockups",
    status: "Active",
    product_plan_type: "Premium",
    created_by: "Sarah Designer",
    created_at: "2024-02-10T09:15:00Z",
    updated_by: "Sarah Designer",
    updated_at: "2024-02-25T16:20:00Z",
    media: ["/generated_images/Website_Mockup_Design_f379e810.png"],
    sub_products: [
      { id: 201, product_number: "MOCK-002-DSK", color: "#8B5CF6", price: 2499, stock: 15, status: "Show" },
      { id: 202, product_number: "MOCK-002-MOB", color: "#8B5CF6", price: 1999, stock: 25, status: "Show" },
      { id: 203, product_number: "MOCK-002-FULL", color: "#8B5CF6", price: 3999, stock: 10, status: "Show" },
    ]
  },
  {
    id: 3,
    title: "Mobile App UI",
    description: "Clean and modern mobile app UI design. Perfect for iOS and Android applications. Includes all necessary screens and components.",
    category: "UI/UX",
    status: "Active",
    product_plan_type: "Basic",
    created_by: "Mike Designer",
    created_at: "2024-03-01T11:00:00Z",
    updated_by: "Mike Designer",
    updated_at: "2024-03-15T13:30:00Z",
    media: ["/generated_images/Mobile_App_Interface_672164f7.png"],
    sub_products: [
      { id: 301, product_number: "UI-003-LIGHT", color: "#F3F4F6", price: 1799, stock: 40, status: "Show" },
      { id: 302, product_number: "UI-003-DARK", color: "#1F2937", price: 1799, stock: 35, status: "Show" },
    ]
  },
  {
    id: 4,
    title: "Typography Poster",
    description: "Eye-catching typography poster design. High-resolution print-ready files. Perfect for marketing campaigns and events.",
    category: "Posters",
    status: "Active",
    product_plan_type: "Premium",
    created_by: "Emma Designer",
    created_at: "2024-01-25T14:20:00Z",
    updated_by: "Emma Designer",
    updated_at: "2024-02-05T10:15:00Z",
    media: ["/generated_images/Typography_Poster_Design_be3980bc.png"],
    sub_products: [
      { id: 401, product_number: "POST-004-A3", color: "#EF4444", price: 999, stock: 100, status: "Show" },
      { id: 402, product_number: "POST-004-A2", color: "#EF4444", price: 1299, stock: 75, status: "Show" },
      { id: 403, product_number: "POST-004-A1", color: "#EF4444", price: 1799, stock: 50, status: "Show" },
    ]
  },
  {
    id: 5,
    title: "3D Product Render",
    description: "Professional 3D product rendering. Photo-realistic quality for product presentations and marketing materials.",
    category: "3D Models",
    status: "Active",
    product_plan_type: "Basic",
    created_by: "Alex Designer",
    created_at: "2024-02-20T08:45:00Z",
    updated_by: "Alex Designer",
    updated_at: "2024-03-05T15:10:00Z",
    media: ["/generated_images/3D_Product_Rendering_3967b01e.png"],
    sub_products: [
      { id: 501, product_number: "3D-005-STD", color: "#10B981", price: 2999, stock: 20, status: "Show" },
      { id: 502, product_number: "3D-005-HD", color: "#10B981", price: 3999, stock: 15, status: "Show" },
    ]
  },
  {
    id: 6,
    title: "Character Illustration",
    description: "Creative character illustration perfect for branding, games, and storytelling. Fully editable vector format.",
    category: "Illustrations",
    status: "Active",
    product_plan_type: "Premium",
    created_by: "Lisa Designer",
    created_at: "2024-03-10T12:30:00Z",
    updated_by: "Lisa Designer",
    updated_at: "2024-03-20T09:45:00Z",
    media: ["/generated_images/Creative_Character_Illustration_04c3e6df.png"],
    sub_products: [
      { id: 601, product_number: "CHAR-006-SING", color: "#F59E0B", price: 1599, stock: 30, status: "Show" },
      { id: 602, product_number: "CHAR-006-SET", color: "#F59E0B", price: 4999, stock: 12, status: "Show" },
    ]
  },
  {
    id: 7,
    title: "Dashboard Design",
    description: "Modern dashboard UI design with data visualization components. Perfect for SaaS and analytics platforms.",
    category: "UI/UX",
    status: "Active",
    product_plan_type: "Basic",
    created_by: "Tom Designer",
    created_at: "2024-01-30T10:00:00Z",
    updated_by: "Tom Designer",
    updated_at: "2024-02-15T14:25:00Z",
    media: ["/generated_images/Modern_UI_Dashboard_Design_159dd6b9.png"],
    sub_products: [
      { id: 701, product_number: "DASH-007-BASIC", color: "#6366F1", price: 2299, stock: 25, status: "Show" },
      { id: 702, product_number: "DASH-007-PRO", color: "#6366F1", price: 3499, stock: 18, status: "Show" },
    ]
  },
  {
    id: 8,
    title: "Brand Identity Kit",
    description: "Complete brand identity package including logo, color palette, typography, and brand guidelines.",
    category: "Branding",
    status: "Active",
    product_plan_type: "Premium",
    created_by: "Rachel Designer",
    created_at: "2024-02-05T13:15:00Z",
    updated_by: "Rachel Designer",
    updated_at: "2024-02-28T11:40:00Z",
    media: ["/generated_images/Brand_Identity_Design_67fa7e1f.png"],
    sub_products: [
      { id: 801, product_number: "BRAND-008-STARTER", color: "#EC4899", price: 4999, stock: 10, status: "Show" },
      { id: 802, product_number: "BRAND-008-COMPLETE", color: "#EC4899", price: 9999, stock: 5, status: "Show" },
    ]
  },
];

export default function CustomerDashboardContent({ searchQuery, selectedCategory }: ContentProps) {
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

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
      const newProducts = mockProducts.map((product, idx) => ({
        ...product,
        id: product.id + page * mockProducts.length + idx,
        sub_products: product.sub_products.map(sp => ({
          ...sp,
          id: sp.id + page * 1000
        }))
      }));
      setProducts((prev) => [...prev, ...newProducts]);
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
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleProductClick(product)}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer"
              >
                <img
                  src={product.media[0]}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                
                {product.product_plan_type === "Premium" && (
                  <div className="absolute top-3 right-3 bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                    <Crown className="w-3 h-3" />
                    Premium
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold mb-2">{product.title}</h3>
                    <p className="text-white/80 text-xs mb-2 line-clamp-2">{product.description}</p>
                    <div className="text-white/60 text-xs">
                      Click to view details
                    </div>
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

      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hasActivePlan={hasActivePlan}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
