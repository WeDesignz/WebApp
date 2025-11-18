"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PricingType = "free" | "paid";

interface Category {
  id: number;
  name: string;
  parent?: string | number | null;
  parent_id?: number | null;
  subcategories?: Category[];
}

interface Tag {
  id: number;
  name: string;
}

interface EditDesignContentProps {
  designId: number;
}

export default function EditDesignContent({ designId }: EditDesignContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch design details
  const { data: designData, isLoading: isLoadingDesign, error: designError } = useQuery({
    queryKey: ['designDetail', designId],
    queryFn: async () => {
      const response = await apiClient.getDesignDetail(designId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.design;
    },
    enabled: !!designId,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch tags
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.getTags();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.tags || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = categoriesData || [];
  const tags: Tag[] = tagsData || [];

  // Get parent categories (categories with no parent)
  const parentCategories = categories.filter(cat => !cat.parent && !cat.parent_id);
  
  // Get subcategories for selected parent category
  const availableSubcategories = parentCategoryId 
    ? categories.find(cat => cat.id === parentCategoryId)?.subcategories || []
    : [];

  // Populate form when design data loads
  useEffect(() => {
    if (designData && categories.length > 0) {
      setTitle(designData.title || "");
      setDescription(designData.description || "");
      
      // Extract category information
      let currentCategoryId = null;
      if (designData.category_id) {
        currentCategoryId = designData.category_id;
      } else if (designData.category) {
        currentCategoryId = typeof designData.category === 'object' ? designData.category.id : designData.category;
      }

      // Determine if current category is a parent or subcategory
      if (currentCategoryId) {
        // First, check if it's a parent category
        const isParentCategory = parentCategories.some(cat => cat.id === currentCategoryId);
        
        if (isParentCategory) {
          // It's a parent category
          setParentCategoryId(currentCategoryId);
          setSubcategoryId(null);
        } else {
          // It's likely a subcategory - find the parent category
          // Method 1: Check if parent_category_name is available
          if (designData.parent_category_name) {
            const parentCat = parentCategories.find(cat => 
              cat.name === designData.parent_category_name
            );
            if (parentCat) {
              setParentCategoryId(parentCat.id);
              setSubcategoryId(currentCategoryId);
            }
          } 
          // Method 2: Check if category object has parent info
          else if (designData.category && typeof designData.category === 'object' && designData.category.parent) {
            const parentName = typeof designData.category.parent === 'string' 
              ? designData.category.parent 
              : designData.category.parent.name;
            const parentCat = parentCategories.find(cat => cat.name === parentName);
            if (parentCat) {
              setParentCategoryId(parentCat.id);
              setSubcategoryId(currentCategoryId);
            }
          }
          // Method 3: Search through all categories to find which parent has this subcategory
          else {
            const parentCat = categories.find(cat => 
              cat.subcategories?.some(sub => sub.id === currentCategoryId)
            );
            if (parentCat) {
              setParentCategoryId(parentCat.id);
              setSubcategoryId(currentCategoryId);
            } else {
              // Fallback: treat as parent (shouldn't happen, but just in case)
              setParentCategoryId(currentCategoryId);
              setSubcategoryId(null);
            }
          }
        }
      }
      
      // Map product_plan_type: if price exists and > 0, it's paid, otherwise free
      const hasPrice = designData.price && parseFloat(String(designData.price)) > 0;
      setPricingType(hasPrice ? "paid" : "free");
      setPrice(designData.price ? String(designData.price) : "");
      setColor(designData.color || "");
      
      // Set tags if available
      if (designData.tags && Array.isArray(designData.tags)) {
        const tagIds = designData.tags.map((tag: any) => tag.id || tag).filter(Boolean);
        setSelectedTagIds(tagIds);
      }
    }
  }, [designData, categories, parentCategories]);

  const handleAddTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    }

    if (!parentCategoryId) {
      errors.category = "Category is required";
    }

    if (pricingType === "paid" && (!price || parseFloat(price) <= 0)) {
      errors.price = "Valid price is required for paid designs";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Use subcategory ID if selected, otherwise use parent category ID
      const finalCategoryId = subcategoryId || parentCategoryId;
      
      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        category_id: finalCategoryId,
      };

      // Map pricing type: Product model uses 'basic', 'prime', 'premium'
      // For free designs, use 'basic', for paid use 'prime' (or we can keep existing value)
      // Actually, let's not change product_plan_type if it's not being changed
      // Only update price based on pricing type
      if (pricingType === "paid" && price) {
        const priceValue = parseFloat(price);
        if (!isNaN(priceValue) && priceValue > 0) {
          updateData.price = priceValue;
          // For paid designs, set product_plan_type to 'prime' (or keep existing)
          // Let's use 'prime' as default for paid
          updateData.product_plan_type = 'prime';
        }
      } else if (pricingType === "free") {
        // For free designs, set price to null and use 'basic'
        updateData.price = null;
        updateData.product_plan_type = 'basic';
      }

      // Include color if provided, otherwise omit
      if (color && color.trim()) {
        updateData.color = color.trim();
      }

      const response = await apiClient.updateDesign(designId, updateData);

      if (response.error) {
        // Show field-specific errors if available
        if (response.fieldErrors && Object.keys(response.fieldErrors).length > 0) {
          const fieldErrorMessages = Object.entries(response.fieldErrors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          throw new Error(fieldErrorMessages || response.error);
        }
        throw new Error(response.error);
      }

      toast({
        title: "Design updated successfully!",
        description: "Your design has been updated and will be reviewed again.",
      });

      // Redirect to My Designs after a delay
      setTimeout(() => {
        router.push('/designer-console/designs');
      }, 1500);

    } catch (error: any) {
      console.error('Update design error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingDesign) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (designError || !designData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Design not found</h3>
          <p className="text-muted-foreground mb-4">
            The design you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Link href="/designer-console/designs">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Designs
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if design can be edited
  if (designData.status === "active") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Cannot Edit Design</h3>
          <p className="text-muted-foreground mb-4">
            Active designs cannot be edited. Please contact admin for changes.
          </p>
          <Link href="/designer-console/designs">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Designs
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/designer-console/designs">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Designs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Design</h1>
        <p className="text-muted-foreground">
          Update your design information. Changes will require review before being published.
        </p>
      </div>

      {/* Design Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Design Details</CardTitle>
          <CardDescription>Update the core information about your design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter design title"
              className={validationErrors.title ? "border-destructive" : ""}
            />
            {validationErrors.title && (
              <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your design..."
              rows={4}
              className={validationErrors.description ? "border-destructive" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <Label htmlFor="parentCategory">Category *</Label>
            <Select
              value={parentCategoryId ? String(parentCategoryId) : ""}
              onValueChange={(value) => {
                setParentCategoryId(parseInt(value));
                setSubcategoryId(null); // Reset subcategory when parent changes
              }}
            >
              <SelectTrigger id="parentCategory" className={validationErrors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Loading categories...</div>
                ) : (
                  parentCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validationErrors.category && (
              <p className="text-sm text-destructive mt-1">{validationErrors.category}</p>
            )}
          </div>

          {/* Subcategory */}
          {parentCategoryId && availableSubcategories.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Select
                value={subcategoryId ? String(subcategoryId) : ""}
                onValueChange={(value) => setSubcategoryId(value ? parseInt(value) : null)}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select a subcategory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Use parent category)</SelectItem>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pricing Type */}
          <div>
            <Label>Pricing Type *</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={pricingType === "free" ? "default" : "outline"}
                onClick={() => {
                  setPricingType("free");
                  setPrice("");
                }}
              >
                Free
              </Button>
              <Button
                type="button"
                variant={pricingType === "paid" ? "default" : "outline"}
                onClick={() => setPricingType("paid")}
              >
                Paid
              </Button>
            </div>
          </div>

          {/* Price */}
          {pricingType === "paid" && (
            <div>
              <Label htmlFor="price">Price (INR) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                step="0.01"
                className={validationErrors.price ? "border-destructive" : ""}
              />
              {validationErrors.price && (
                <p className="text-sm text-destructive mt-1">{validationErrors.price}</p>
              )}
            </div>
          )}

          {/* Color */}
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g., Red, Blue, Multi-color"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Add tags to help users find your design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tags */}
          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTagIds.map((tagId) => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="secondary" className="gap-1">
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tagId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          {/* Tag Selector */}
          <div>
            <Label>Add Tags</Label>
            <Select
              value=""
              onValueChange={(value) => handleAddTag(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tag to add" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTags ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Loading tags...</div>
                ) : (
                  tags
                    .filter(tag => !selectedTagIds.includes(tag.id))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={String(tag.id)}>
                        {tag.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge
                variant={
                  designData.status === "approved" || designData.status === "active" ? "default" :
                  designData.status === "pending" ? "secondary" : "destructive"
                }
                className="mt-1"
              >
                {designData.status?.charAt(0).toUpperCase() + designData.status?.slice(1) || 'Unknown'}
              </Badge>
            </div>
            {designData.product_number && (
              <div>
                <p className="text-sm text-muted-foreground">Product ID</p>
                <p className="text-sm font-medium mt-1">{designData.product_number}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4 justify-end">
        <Link href="/designer-console/designs">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Design"
          )}
        </Button>
      </div>
    </div>
  );
}

