"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, ArrowLeft, Upload, Image as ImageIcon, Download, CheckCircle2, XCircle } from "lucide-react";
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

interface FileUploadStatus {
  eps: File | null;
  cdr: File | null;
  jpg: File | null;
  png: File | null;
  mockup: File | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for single files

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
  const isInitializedRef = useRef(false);
  
  // File upload states
  const [files, setFiles] = useState<FileUploadStatus>({
    eps: null,
    cdr: null,
    jpg: null,
    png: null,
    mockup: null,
  });
  const [filePreviews, setFilePreviews] = useState<{
    jpg: string | null;
    png: string | null;
    mockup: string | null;
  }>({
    jpg: null,
    png: null,
    mockup: null,
  });
  const [existingFileUrls, setExistingFileUrls] = useState<{
    jpg: string | null;
    png: string | null;
    mockup: string | null;
    eps: string | null;
    cdr: string | null;
  }>({
    jpg: null,
    png: null,
    mockup: null,
    eps: null,
    cdr: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  // Reset initialization when designId changes
  useEffect(() => {
    isInitializedRef.current = false;
  }, [designId]);

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

  // Fetch subcategories for selected parent category
  const { data: subcategoriesData, isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['subcategories', parentCategoryId],
    queryFn: async () => {
      if (!parentCategoryId) return [];
      const response = await apiClient.getCategorySubcategories(parentCategoryId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.subcategories || [];
    },
    enabled: !!parentCategoryId,
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

  // Get parent categories (categories with no parent) - memoize to prevent infinite loops
  const parentCategories = useMemo(() => 
    categories.filter(cat => !cat.parent && !cat.parent_id),
    [categories]
  );
  
  // Get subcategories from API response
  const availableSubcategories = subcategoriesData || [];

  // Populate form when design data loads (only once)
  useEffect(() => {
    if (designData && categories.length > 0 && !isInitializedRef.current) {
      setTitle(designData.title || "");
      setDescription(designData.description || "");
      
      // Extract category information
      // According to user: Product.category is ALWAYS a subcategory (or a category with no parent)
      // If category has a parent: subcategory = category, category = category.parent
      // If category has no parent: category = category, subcategory = null
      let currentCategory: any = null;
      if (designData.category) {
        currentCategory = typeof designData.category === 'object' 
          ? designData.category 
          : categories.find(cat => cat.id === designData.category);
      } else if (designData.category_id) {
        currentCategory = categories.find(cat => cat.id === designData.category_id);
      }

      if (currentCategory) {
        // Ensure currentCategory.id is a number
        const currentCategoryId = typeof currentCategory.id === 'number' 
          ? currentCategory.id 
          : parseInt(String(currentCategory.id));
        
        // Check if current category has a parent
        const hasParent = currentCategory.parent || currentCategory.parent_id;
        
        if (hasParent) {
          // Category has a parent, so it's a subcategory
          // Set parent category ID - ensure it's always a number
          let parentId: number | null = null;
          
          if (typeof currentCategory.parent === 'object' && currentCategory.parent?.id) {
            parentId = typeof currentCategory.parent.id === 'number' 
              ? currentCategory.parent.id 
              : parseInt(String(currentCategory.parent.id));
          } else if (currentCategory.parent_id) {
            parentId = typeof currentCategory.parent_id === 'number' 
              ? currentCategory.parent_id 
              : parseInt(String(currentCategory.parent_id));
          } else if (typeof currentCategory.parent === 'string') {
            // Parent is a string (name), find it in parentCategories
            const parentCat = parentCategories.find(cat => cat.name === currentCategory.parent);
            if (parentCat) {
              parentId = typeof parentCat.id === 'number' ? parentCat.id : parseInt(String(parentCat.id));
            }
          }
          
          if (parentId && !isNaN(parentId)) {
            setParentCategoryId(parentId);
            setSubcategoryId(currentCategoryId);
          } else {
            // Fallback: try to find parent by name if available
            if (designData.parent_category_name) {
              const parentCat = parentCategories.find(cat => 
                cat.name === designData.parent_category_name
              );
              if (parentCat) {
                const foundParentId = typeof parentCat.id === 'number' ? parentCat.id : parseInt(String(parentCat.id));
                if (!isNaN(foundParentId)) {
                  setParentCategoryId(foundParentId);
                  setSubcategoryId(currentCategoryId);
                }
              }
            } else {
              // No parent found, treat as parent category
              setParentCategoryId(currentCategoryId);
              setSubcategoryId(null);
            }
          }
        } else {
          // Category has no parent, so it's a parent category
          setParentCategoryId(currentCategoryId);
          setSubcategoryId(null);
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
      
      // Mark as initialized
      isInitializedRef.current = true;
    }
  }, [designData, categories, parentCategories]);

  // Ensure subcategory is set once subcategories are loaded (for cases where subcategories load after initialization)
  useEffect(() => {
    if (subcategoriesData && subcategoriesData.length > 0 && designData && isInitializedRef.current) {
      // Extract category information
      let currentCategory: any = null;
      if (designData.category) {
        currentCategory = typeof designData.category === 'object' 
          ? designData.category 
          : categories.find(cat => cat.id === designData.category);
      } else if (designData.category_id) {
        currentCategory = categories.find(cat => cat.id === designData.category_id);
      }

      // If we have a current category with a parent, parent category is set, but subcategory is not set yet
      if (currentCategory && currentCategory.parent && parentCategoryId && !subcategoryId) {
        // Check if current category ID exists in the loaded subcategories
        const subcategoryExists = subcategoriesData.some(sub => sub.id === currentCategory.id);
        if (subcategoryExists) {
          setSubcategoryId(currentCategory.id);
        }
      }
    }
  }, [subcategoriesData, designData, parentCategoryId, subcategoryId, parentCategories, categories]);

  const handleAddTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
  };

  // Helper function to make absolute URL
  const makeAbsoluteUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (apiBaseUrl && url.startsWith('/')) {
      return `${apiBaseUrl}${url}`;
    }
    if (apiBaseUrl && !url.startsWith('/')) {
      return `${apiBaseUrl}/${url}`;
    }
    return url;
  };

  // Load existing file URLs from design data
  useEffect(() => {
    if (designData) {
      // API returns media_files (not media)
      const mediaArray = Array.isArray(designData.media_files) 
        ? designData.media_files 
        : (Array.isArray(designData.media) ? designData.media : []);
      
      console.log('[EditDesign] Media files from API:', mediaArray);
      
      const urls: { jpg: string | null; png: string | null; mockup: string | null; eps: string | null; cdr: string | null } = {
        jpg: null,
        png: null,
        mockup: null,
        eps: null,
        cdr: null,
      };

      mediaArray.forEach((media: any) => {
        console.log('[EditDesign] Processing media:', {
          id: media.id,
          media_type: media.media_type,
          file_name: media.file_name,
          url: media.url || media.file,
          is_mockup: media.is_mockup,
          meta: media.meta
        });
        const url = media.url || media.file || media.file_url;
        if (!url) {
          console.log('[EditDesign] Skipping media - no URL:', media);
          return;
        }
        
        // Check media_type field first (most reliable now that we have cdr, eps types)
        const mediaType = (media.media_type || '').toLowerCase();
        
        // Check file name (fallback) - extract from URL if file_name is not available
        let fileName = (media.file_name || '').toLowerCase();
        if (!fileName && url) {
          // Try to extract filename from URL
          const urlParts = url.split('/');
          fileName = urlParts[urlParts.length - 1].toLowerCase();
        }
        const urlLower = url.toLowerCase();
        
        // Check if media has is_mockup flag (from serializer) - this is the most reliable
        const isMockupFlag = media.is_mockup === true || media.is_mockup === 'true' || media.is_mockup === 1;
        
        // Check metadata for file type hints (from relation meta)
        let meta = media.meta || {};
        // If meta is a string, try to parse it
        if (typeof meta === 'string') {
          try {
            meta = JSON.parse(meta);
          } catch {
            meta = {};
          }
        }
        const metaStr = typeof meta === 'object' ? JSON.stringify(meta).toLowerCase() : String(meta).toLowerCase();
        
        // Extract just the filename part for better matching
        const fileNameOnly = fileName.split('/').pop() || fileName;
        
        // IMPORTANT: Check EPS and CDR FIRST (by media_type) before mockup check
        // This prevents EPS/CDR files from being incorrectly identified as mockups
        
        // Check for EPS - check media_type first (most reliable)
        if (mediaType === 'eps') {
          console.log('[EditDesign] Found EPS file (by media_type):', { mediaType, fileName, url });
          if (!urls.eps) {
            urls.eps = makeAbsoluteUrl(url);
          }
          return;
        }
        
        // Check for CDR - check media_type first (most reliable)
        if (mediaType === 'cdr') {
          console.log('[EditDesign] Found CDR file (by media_type):', { mediaType, fileName, url });
          if (!urls.cdr) {
            urls.cdr = makeAbsoluteUrl(url);
          }
          return;
        }
        
        // Fallback: Check EPS by filename/URL if media_type wasn't set
        const isEps = fileNameOnly.endsWith('.eps') || 
                      fileName.includes('.eps') ||
                      urlLower.includes('.eps') || 
                      urlLower.endsWith('.eps');
        if (isEps) {
          console.log('[EditDesign] Found EPS file (by filename):', { mediaType, fileName, url, isEps });
          if (!urls.eps) {
            urls.eps = makeAbsoluteUrl(url);
          }
          return;
        } 
        
        // Fallback: Check CDR by filename/URL if media_type wasn't set
        const isCdr = fileNameOnly.endsWith('.cdr') || 
                      fileName.includes('.cdr') ||
                      urlLower.includes('.cdr') || 
                      urlLower.endsWith('.cdr');
        if (isCdr) {
          console.log('[EditDesign] Found CDR file (by filename):', { mediaType, fileName, url, isCdr });
          if (!urls.cdr) {
            urls.cdr = makeAbsoluteUrl(url);
          }
          return;
        }
        
        // Check for mockup - ONLY if is_mockup flag is true OR filename contains "mockup"
        // Don't check metadata string as it might have false positives
        const isMockup = isMockupFlag ||
                        fileNameOnly.includes('mockup') || 
                        fileName.includes('mockup') ||
                        urlLower.includes('mockup');
        
        if (isMockup) {
          console.log('[EditDesign] Found MOCKUP file:', { mediaType, fileName, url, isMockup, isMockupFlag });
          if (!urls.mockup) {
            urls.mockup = makeAbsoluteUrl(url);
          }
          return; // Don't check other file types if it's a mockup
        } 
        
        // Check for JPG (but not mockup) - check filename (media_type 'image' can be jpg or png)
        const isJpg = (
          fileNameOnly.endsWith('.jpg') || 
          fileNameOnly.endsWith('.jpeg') || 
          fileName.includes('.jpg') ||
          fileName.includes('.jpeg') ||
          urlLower.includes('.jpg') || 
          urlLower.includes('.jpeg') ||
          urlLower.endsWith('.jpg') ||
          urlLower.endsWith('.jpeg')
        );
        if (isJpg) {
          console.log('[EditDesign] Found JPG file:', { mediaType, fileName, fileNameOnly, url, isJpg });
          if (!urls.jpg) {
            urls.jpg = makeAbsoluteUrl(url);
          }
          return;
        } 
        
        // Check for PNG (but not mockup) - check filename (media_type 'image' can be jpg or png)
        const isPng = (
          fileNameOnly.endsWith('.png') || 
          fileName.includes('.png') ||
          urlLower.includes('.png') ||
          urlLower.endsWith('.png')
        );
        if (isPng) {
          console.log('[EditDesign] Found PNG file:', { mediaType, fileName, fileNameOnly, url, isPng });
          if (!urls.png) {
            urls.png = makeAbsoluteUrl(url);
          }
          return;
        }
        
        // If we get here and media_type is set but we didn't match, log it for debugging
        if (mediaType && mediaType !== 'image' && mediaType !== 'video') {
          console.log('[EditDesign] Unmatched media type:', { mediaType, fileName, url, media });
        } else {
          console.log('[EditDesign] File not matched:', { mediaType, fileName, url, isMockup });
        }
      });

      console.log('[EditDesign] Final detected URLs:', urls);
      setExistingFileUrls(urls);
    }
  }, [designData]);

  // Handle file upload
  const handleFileUpload = (fileType: keyof FileUploadStatus, file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file type
    if (fileType === 'mockup') {
      if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png') {
        setFileErrors({
          ...fileErrors,
          [fileType]: `Invalid file type. Mockup must be .jpg or .png file.`
        });
        return;
      }
    } else {
      if (extension !== fileType) {
        setFileErrors({
          ...fileErrors,
          [fileType]: `Invalid file type. Please upload a valid .${fileType} file.`
        });
        return;
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors({
        ...fileErrors,
        [fileType]: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`
      });
      return;
    }

    // Set file
    setFiles({ ...files, [fileType]: file });
    setFileErrors({ ...fileErrors, [fileType]: "" });

    // Create preview for image files
    if (fileType === 'jpg' || fileType === 'png' || fileType === 'mockup') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews({
          ...filePreviews,
          [fileType]: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove file
  const handleRemoveFile = (fileType: keyof FileUploadStatus) => {
    setFiles({ ...files, [fileType]: null });
    setFilePreviews({ ...filePreviews, [fileType]: null });
    setFileErrors({ ...fileErrors, [fileType]: "" });
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
      
      // Check if any files are being updated
      const hasFileUpdates = Object.values(files).some(file => file !== null);
      
      let updateData: any;

      if (hasFileUpdates) {
        // Use FormData for file uploads
        updateData = new FormData();
        updateData.append('title', title.trim());
        updateData.append('description', description.trim());
        updateData.append('category_id', String(finalCategoryId));
        updateData.append('status', 'draft'); // Set status to draft when files are updated
        
        // Map pricing type
        if (pricingType === "paid" && price) {
          const priceValue = parseFloat(price);
          if (!isNaN(priceValue) && priceValue > 0) {
            updateData.append('price', String(priceValue));
            updateData.append('product_plan_type', 'prime');
          }
        } else if (pricingType === "free") {
          updateData.append('price', '');
          updateData.append('product_plan_type', 'basic');
        }

        if (color && color.trim()) {
          updateData.append('color', color.trim());
        }

        // Add files
        Object.entries(files).forEach(([fileType, file]) => {
          if (file) {
            updateData.append('design_files', file);
          }
        });

        // Add tags
        selectedTagIds.forEach(tagId => {
          updateData.append('tags', String(tagId));
        });
      } else {
        // Use regular JSON for non-file updates
        updateData = {
          title: title.trim(),
          description: description.trim(),
          category_id: finalCategoryId,
        };

        // Map pricing type
        if (pricingType === "paid" && price) {
          const priceValue = parseFloat(price);
          if (!isNaN(priceValue) && priceValue > 0) {
            updateData.price = priceValue;
            updateData.product_plan_type = 'prime';
          }
        } else if (pricingType === "free") {
          updateData.price = null;
          updateData.product_plan_type = 'basic';
        }

        if (color && color.trim()) {
          updateData.color = color.trim();
        }

        // Add tags
        if (selectedTagIds.length > 0) {
          updateData.tags = selectedTagIds;
        }
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
        description: hasFileUpdates 
          ? "Your design files have been updated. The design status has been set to 'Draft' and will be reviewed again by admin."
          : "Your design has been updated successfully.",
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

          {/* Category and Subcategory - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Select
                value={subcategoryId ? String(subcategoryId) : ""}
                onValueChange={(value) => {
                  setSubcategoryId(value ? parseInt(value) : null);
                }}
                disabled={!parentCategoryId}
              >
                <SelectTrigger id="subcategory" disabled={!parentCategoryId}>
                  <SelectValue placeholder={
                    !parentCategoryId 
                      ? "Select category first" 
                      : availableSubcategories.length === 0
                      ? "No subcategories available"
                      : "Select a subcategory"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSubcategories ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Loading subcategories...</div>
                  ) : availableSubcategories.length > 0 ? (
                    availableSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                        {subcategory.name}
                      </SelectItem>
                    ))
                  ) : parentCategoryId ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No subcategories available for this category
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>

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

      {/* File Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Design Files</CardTitle>
          <CardDescription>Update design files. Uploading new files will set the design status to "Draft" and require admin approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* EPS File */}
            <div>
              <Label htmlFor="eps" className="flex items-center gap-2">
                EPS File
                {existingFileUrls.eps ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </Label>
              <div className="mt-2">
                <Input
                  id="eps"
                  type="file"
                  accept=".eps"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('eps', file);
                  }}
                  className="cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  {existingFileUrls.eps ? (
                    <>
                      <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Uploaded
                      </Badge>
                      {!files.eps && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = existingFileUrls.eps!;
                            link.download = 'design.eps';
                            link.target = '_blank';
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Not uploaded
                    </Badge>
                  )}
                </div>
                {files.eps && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{files.eps.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('eps')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fileErrors.eps && (
                  <p className="text-sm text-destructive mt-1">{fileErrors.eps}</p>
                )}
              </div>
            </div>

            {/* CDR File */}
            <div>
              <Label htmlFor="cdr" className="flex items-center gap-2">
                CDR File
                {existingFileUrls.cdr ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </Label>
              <div className="mt-2">
                <Input
                  id="cdr"
                  type="file"
                  accept=".cdr"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('cdr', file);
                  }}
                  className="cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  {existingFileUrls.cdr ? (
                    <>
                      <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Uploaded
                      </Badge>
                      {!files.cdr && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = existingFileUrls.cdr!;
                            link.download = 'design.cdr';
                            link.target = '_blank';
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Not uploaded
                    </Badge>
                  )}
                </div>
                {files.cdr && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{files.cdr.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('cdr')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fileErrors.cdr && (
                  <p className="text-sm text-destructive mt-1">{fileErrors.cdr}</p>
                )}
              </div>
            </div>

            {/* JPG File */}
            <div>
              <Label htmlFor="jpg" className="flex items-center gap-2">
                JPG File
                {existingFileUrls.jpg ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </Label>
              <div className="mt-2">
                <Input
                  id="jpg"
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('jpg', file);
                  }}
                  className="cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  {existingFileUrls.jpg ? (
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Not uploaded
                    </Badge>
                  )}
                </div>
                {files.jpg && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{files.jpg.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('jpg')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fileErrors.jpg && (
                  <p className="text-sm text-destructive mt-1">{fileErrors.jpg}</p>
                )}
              </div>
            </div>

            {/* PNG File */}
            <div>
              <Label htmlFor="png" className="flex items-center gap-2">
                PNG File
                {existingFileUrls.png ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </Label>
              <div className="mt-2">
                <Input
                  id="png"
                  type="file"
                  accept=".png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('png', file);
                  }}
                  className="cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  {existingFileUrls.png ? (
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Not uploaded
                    </Badge>
                  )}
                </div>
                {files.png && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{files.png.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('png')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fileErrors.png && (
                  <p className="text-sm text-destructive mt-1">{fileErrors.png}</p>
                )}
              </div>
            </div>

            {/* Mockup File */}
            <div className="col-span-2">
              <Label htmlFor="mockup" className="flex items-center gap-2">
                Mockup (JPG/PNG) - Optional
                {existingFileUrls.mockup ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </Label>
              <div className="mt-2">
                <Input
                  id="mockup"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('mockup', file);
                  }}
                  className="cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
                  {existingFileUrls.mockup ? (
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Not uploaded
                    </Badge>
                  )}
                </div>
                {files.mockup && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{files.mockup.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('mockup')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {fileErrors.mockup && (
                  <p className="text-sm text-destructive mt-1">{fileErrors.mockup}</p>
                )}
              </div>
            </div>
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


