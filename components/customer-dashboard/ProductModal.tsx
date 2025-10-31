"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasActivePlan: boolean;
  product: {
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
  };
}

export default function ProductModal({ isOpen, onClose, hasActivePlan, product }: ProductModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
      case "Show":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "Inactive":
      case "Hide":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "Draft":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "Deleted":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
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
              <div className="flex flex-col md:flex-row gap-6 p-6 border-b border-border">
                <div className="md:w-1/3">
                  <img
                    src={product.media[0]}
                    alt={product.title}
                    className="w-full h-64 md:h-full object-cover rounded-xl"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">
                          {product.category}
                        </span>
                        <span className={`text-xs px-3 py-1 border rounded-full ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{product.description}</p>
                  
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-lg">
                    <span className="text-sm font-semibold">Plan Type: </span>
                    <span className="text-sm text-primary">{product.product_plan_type}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-4">Available Variants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-semibold">Product #</th>
                        <th className="text-left py-3 px-2 font-semibold">Color</th>
                        <th className="text-left py-3 px-2 font-semibold">Price</th>
                        <th className="text-left py-3 px-2 font-semibold">Stock</th>
                        <th className="text-left py-3 px-2 font-semibold">Status</th>
                        <th className="text-right py-3 px-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.sub_products.map((subProduct) => (
                        <tr key={subProduct.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2 font-mono text-xs">{subProduct.product_number}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: subProduct.color }}
                              />
                              <span>{subProduct.color}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-semibold">₹{subProduct.price.toLocaleString()}</td>
                          <td className="py-3 px-2">
                            <span className={subProduct.stock > 0 ? "text-green-500" : "text-red-500"}>
                              {subProduct.stock}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-1 border rounded-full ${getStatusColor(subProduct.status)}`}>
                              {subProduct.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              disabled={subProduct.stock === 0 || subProduct.status === "Hide"}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  {hasActivePlan ? (
                    <>
                      <Button className="flex-1 rounded-full h-12 text-base font-semibold">
                        <Download className="w-5 h-5 mr-2" />
                        Download Design
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-full h-12 text-base font-semibold">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart for Bulk Download
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="flex-1 rounded-full h-12 text-base font-semibold">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-full h-12 text-base font-semibold">
                        Buy Now
                      </Button>
                      <Button className="flex-1 rounded-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Purchase Plan
                      </Button>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold">Created By:</span> {product.created_by}
                  </div>
                  <div>
                    <span className="font-semibold">Created At:</span> {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-semibold">Updated By:</span> {product.updated_by}
                  </div>
                  <div>
                    <span className="font-semibold">Updated At:</span> {new Date(product.updated_at).toLocaleDateString()}
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
