"use client";

import { useState } from "react";
import { useCartWishlist } from "@/contexts/CartWishlistContext";
import { Heart, ShoppingCart, Trash2, Eye, ArrowLeft, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import QuickViewModal from "@/components/customer-dashboard/QuickViewModal";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, moveToCart, clearWishlist } = useCartWishlist();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewItem, setQuickViewItem] = useState<any>(null);
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(wishlistItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkRemove = () => {
    selectedItems.forEach(id => removeFromWishlist(id));
    setSelectedItems([]);
    toast({
      title: "Items removed",
      description: `${selectedItems.length} items have been removed from your wishlist.`,
    });
  };

  const handleBulkMoveToCart = () => {
    selectedItems.forEach(id => {
      moveToCart(id);
    });
    setSelectedItems([]);
    toast({
      title: "Added to cart",
      description: `${selectedItems.length} items have been added to your cart.`,
    });
  };

  const handleAddToCart = (itemId: string, title: string) => {
    moveToCart(itemId);
    toast({
      title: "Added to cart",
      description: `${title} has been added to your cart.`,
    });
  };

  const handleRemove = (itemId: string, title: string) => {
    removeFromWishlist(itemId);
    toast({
      title: "Removed from wishlist",
      description: `${title} has been removed.`,
    });
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <a 
            href="/customer-dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </a>

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
              <Heart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">No saved items yet</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Find designs you love and save them here for later. Start building your wishlist!
            </p>
            <a href="/customer-dashboard">
              <Button size="lg" className="rounded-full">
                Browse Designs
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a 
          href="/customer-dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </a>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">{wishlistItems.length} saved items</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleBulkMoveToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkRemove}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <Checkbox
            checked={selectedItems.length === wishlistItems.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">Select All</span>
        </div>

        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        className="bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div className="absolute top-3 right-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemove(item.id, item.title)}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart className="w-5 h-5 text-destructive fill-destructive" />
                      </motion.button>
                    </div>
                    {item.isPremium && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                          <span>👑</span>
                          Premium
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setQuickViewItem(item)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Quick View
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {item.designer}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-muted rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{formatPrice(item.price)}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item.id, item.title)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      className="mt-1"
                    />
                    
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-lg font-semibold flex-1">{item.title}</h3>
                        {item.isPremium && (
                          <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                            <span>👑</span>
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">by {item.designer}</p>
                      <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 bg-muted border border-border rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item.id, item.title)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuickViewItem(item)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Quick View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(item.id, item.title)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <QuickViewModal
        item={quickViewItem}
        isOpen={!!quickViewItem}
        onClose={() => setQuickViewItem(null)}
      />
    </div>
  );
}
