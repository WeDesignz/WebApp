"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

type UploadMode = "single" | "bulk";
type PricingType = "free" | "paid";

interface FileUploadStatus {
  eps: File | null;
  cdr: File | null;
  jpg: File | null;
  png: File | null;
  svg: File | null;
}

interface Category {
  id: number;
  name: string;
  subcategories?: Category[];
}

interface Tag {
  id: number;
  name: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadDesignContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileUploadStatus>({
    eps: null,
    cdr: null,
    jpg: null,
    png: null,
    svg: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const handleAddTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagIdToRemove: number) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagIdToRemove));
  };

  const handleSearchTag = (searchTerm: string) => {
    setTagInput(searchTerm);
  };

  const handleFileUpload = (fileType: keyof FileUploadStatus, file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file type
    if (extension !== fileType) {
      setFileErrors({
        ...fileErrors,
        [fileType]: `Invalid file type. Please upload a valid .${fileType} file.`
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors({
        ...fileErrors,
        [fileType]: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`
      });
      return;
    }

    setFiles({ ...files, [fileType]: file });
    setFileErrors({ ...fileErrors, [fileType]: "" });
  };

  const handleBulkFileUpload = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'zip') {
      setFileErrors({
        bulk: "Your bulk upload must be a .zip file containing subfolders, each with .eps, .cdr, .jpg, .png, and .svg files."
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE * 5) { // Allow larger size for bulk uploads (250MB)
      setFileErrors({
        bulk: `File size exceeds ${(MAX_FILE_SIZE * 5) / (1024 * 1024)}MB limit.`
      });
      return;
    }

    setBulkFile(file);
    setFileErrors({ bulk: "" });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    }

    if (!categoryId) {
      errors.category = "Category is required";
    }

    if (pricingType === "paid" && (!price || parseFloat(price) <= 0)) {
      errors.price = "Valid price is required for paid designs";
    }

    if (uploadMode === "single") {
      const hasFiles = Object.values(files).some(file => file !== null);
      if (!hasFiles) {
        errors.files = "At least one design file is required";
      }
    } else {
      if (!bulkFile) {
        errors.bulk = "Bulk upload file is required";
      }
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add text fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', String(categoryId));
      formData.append('product_plan_type', pricingType === "free" ? "free" : "paid");

      if (pricingType === "paid" && price) {
        formData.append('price', price);
      }

      if (color.trim()) {
        formData.append('color', color.trim());
      }

      // Add design files
      if (uploadMode === "single") {
        Object.entries(files).forEach(([fileType, file]) => {
          if (file) {
            formData.append('design_files', file);
          }
        });
      } else if (bulkFile) {
        formData.append('design_files', bulkFile);
      }

      // Add tags
      selectedTagIds.forEach(tagId => {
        formData.append('tags', String(tagId));
      });

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.uploadDesign(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Design uploaded successfully!",
        description: `Your design has been submitted for review. Product ID: ${response.data?.product_id}, Platform ID: ${response.data?.platform_id}`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId(null);
      setPrice("");
      setColor("");
      setSelectedTagIds([]);
      setFiles({
        eps: null,
        cdr: null,
        jpg: null,
        png: null,
        svg: null,
      });
      setBulkFile(null);
      setValidationErrors({});
      setFileErrors({});

      // Optionally redirect to My Designs after a delay
      setTimeout(() => {
        router.push('/designer-console/designs');
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Design</h1>
        <p className="text-muted-foreground">
          Provide the required details and files for your design submission. All uploaded designs will undergo a review before being published.
        </p>
      </div>

      {/* Design Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Design Details</CardTitle>
          <CardDescription>Provide the core information about your design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="Enter design title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationErrors({ ...validationErrors, title: "" });
              }}
              required
              disabled={isUploading}
            />
            {validationErrors.title && (
              <p className="text-sm text-destructive">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              placeholder="Describe your design (max 500 characters)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value.slice(0, 500));
                setValidationErrors({ ...validationErrors, description: "" });
              }}
              maxLength={500}
              rows={4}
              disabled={isUploading}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
              {validationErrors.description && (
                <p className="text-sm text-destructive">{validationErrors.description}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading categories...</span>
              </div>
            ) : (
              <Select 
                value={categoryId ? String(categoryId) : ""} 
                onValueChange={(value: string) => {
                  setCategoryId(parseInt(value));
                  setValidationErrors({ ...validationErrors, category: "" });
                }}
                disabled={isUploading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {validationErrors.category && (
              <p className="text-sm text-destructive">{validationErrors.category}</p>
            )}
          </div>

          {/* Color (optional) */}
          <div className="space-y-2">
            <Label htmlFor="color">Color (optional)</Label>
            <Input
              id="color"
              placeholder="e.g., Red, Blue, #FF0000"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            {isLoadingTags ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading tags...</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Search and select tags"
                    value={tagInput}
                    onChange={(e) => handleSearchTag(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                {tagInput && (
                  <div className="border border-border rounded-md p-2 max-h-40 overflow-y-auto">
                    {tags
                      .filter(tag => 
                        tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                        !selectedTagIds.includes(tag.id)
                      )
                      .slice(0, 10)
                      .map((tag) => (
                        <div
                          key={tag.id}
                          className="p-2 hover:bg-muted cursor-pointer rounded"
                          onClick={() => {
                            handleAddTag(tag.id);
                            setTagInput("");
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    {tags.filter(tag => 
                      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                      !selectedTagIds.includes(tag.id)
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground p-2">No tags found</p>
                    )}
                  </div>
                )}
                {selectedTagIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTagIds.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <Badge key={tagId} variant="secondary" className="px-3 py-1">
                          {tag.name}
                          <X
                            className="w-3 h-3 ml-2 cursor-pointer"
                            onClick={() => handleRemoveTag(tagId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pricing Type</Label>
                <p className="text-sm text-muted-foreground">
                  Choose if this design is free or paid
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={pricingType === "free" ? "font-medium" : "text-muted-foreground"}>
                  Free
                </span>
                <Switch
                  checked={pricingType === "paid"}
                  onCheckedChange={(checked: boolean) => setPricingType(checked ? "paid" : "free")}
                />
                <span className={pricingType === "paid" ? "font-medium" : "text-muted-foreground"}>
                  Paid
                </span>
              </div>
            </div>

            {pricingType === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price in rupees"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setValidationErrors({ ...validationErrors, price: "" });
                  }}
                  min="1"
                  disabled={isUploading}
                />
                {validationErrors.price && (
                  <p className="text-sm text-destructive">{validationErrors.price}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>Upload your design files in the required formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Mode Toggle */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Label>Upload Mode:</Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUploadMode("single")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  uploadMode === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Single Design Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("bulk")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  uploadMode === "bulk"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Single Design Upload */}
          {uploadMode === "single" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload all five required file formats. Each file must match the specified format.
              </p>
              
              {(["eps", "cdr", "jpg", "png", "svg"] as const).map((fileType) => (
                <div key={fileType} className="space-y-2">
                  <Label htmlFor={fileType} className="flex items-center gap-2">
                    {fileType.toUpperCase()} File <span className="text-destructive">*</span>
                    {files[fileType] && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id={fileType}
                      type="file"
                      accept={`.${fileType}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(fileType, file);
                      }}
                      className="flex-1"
                      disabled={isUploading}
                    />
                    {files[fileType] && (
                      <span className="text-sm text-muted-foreground">
                        {files[fileType]?.name}
                      </span>
                    )}
                  </div>
                  {fileErrors[fileType] && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {fileErrors[fileType]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bulk Upload */}
          {uploadMode === "bulk" && (
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Bulk Upload Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Upload a single .zip file</li>
                  <li>The zip must contain multiple folders (or zip files)</li>
                  <li>Each folder/zip represents one design</li>
                  <li>Each design folder must include all 5 files: .eps, .cdr, .jpg, .png, .svg</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href="#" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Bulk Upload Template
                </a>
              </Button>

              <div className="space-y-2">
                <Label htmlFor="bulkFile">Bulk Upload File (.zip) <span className="text-destructive">*</span></Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    id="bulkFile"
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBulkFileUpload(file);
                    }}
                    className="hidden"
                  />
                  <Label htmlFor="bulkFile" className="cursor-pointer">
                    {bulkFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="font-medium">{bulkFile.name}</span>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">ZIP file only</p>
                      </div>
                    )}
                  </Label>
                </div>
                {fileErrors.bulk && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {fileErrors.bulk}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Uploading design...</span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.files && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{validationErrors.files}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => router.push('/designer-console/designs')}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          size="lg" 
          onClick={handleSubmit}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Submit for Review"
          )}
        </Button>
      </div>
    </div>
  );
}
