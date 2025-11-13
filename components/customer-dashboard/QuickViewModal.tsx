"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Heart, Tag, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { useToast } from "@/hooks/use-toast";

interface QuickViewModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ item, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart, addToWishlist, isInCart, isInWishlist } = useCartWishlist();
  const { toast } = useToast();

  if (!item) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!isInCart(item.productId)) {
      addToCart({
        id: item.id,
        productId: item.productId,
        title: item.title,
        designer: item.designer,
        category: item.category,
        price: item.price,
        image: item.image,
        tags: item.tags,
        license: 'Standard License',
      });
      toast({
        title: "Added to cart",
        description: `${item.title} has been added to your cart.`,
      });
    } else {
      toast({
        title: "Already in cart",
        description: `${item.title} is already in your cart.`,
      });
    }
  };

  const handleAddToWishlist = () => {
    if (!isInWishlist(item.productId)) {
      addToWishlist(item);
      toast({
        title: "Added to wishlist",
        description: `${item.title} has been saved to your wishlist.`,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl my-8 pointer-events-auto"
            >
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.isPremium && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-yellow-500 text-black text-sm font-bold rounded-full flex items-center gap-1.5">
                          <span>👑</span>
                          Premium
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
                      <p className="text-muted-foreground mb-4">by {item.designer}</p>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                          {item.category}
                        </span>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          High-quality design asset perfect for your creative projects. This premium design includes all source files and is ready to use in your workflow.
                        </p>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold mb-3">Tags</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.tags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1.5 bg-muted border border-border rounded-full flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-muted rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">File Formats</span>
                          <span className="text-sm font-medium">PSD, AI, SVG, PNG</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">License</span>
                          <span className="text-sm font-medium">Standard License</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Price</p>
                          <p className="text-3xl font-bold">{formatPrice(item.price)}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleAddToWishlist}
                          className="rounded-full"
                        >
                          <Heart 
                            className={`w-5 h-5 ${isInWishlist(item.productId) ? 'fill-destructive text-destructive' : ''}`} 
                          />
                        </Button>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 h-12 rounded-full"
                          onClick={handleAddToCart}
                          disabled={isInCart(item.productId)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {isInCart(item.productId) ? 'In Cart' : 'Add to Cart'}
                        </Button>
                        {item.price === 0 && (
                          <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Free
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
