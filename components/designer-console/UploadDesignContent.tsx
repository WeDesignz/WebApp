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
import { X, Upload, CheckCircle2, AlertCircle, Download, Loader2, FileArchive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";
import * as XLSX from "xlsx";

type UploadMode = "single" | "bulk";
type PricingType = "free" | "paid";

interface FileUploadStatus {
  eps: File | null;
  cdr: File | null;
  jpg: File | null;
  png: File | null;
  mockup: File | null; // mockup.jpg or mockup.png (optional)
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for single files
const MAX_BULK_FILE_SIZE = 1024 * 1024 * 1024; // 1GB for bulk upload
const REQUIRED_FILES = ['.eps', '.cdr', '.jpg', '.png'];
// Note: No minimum design requirement for regular uploads (only for onboarding)

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
    mockup: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [bulkValidationErrors, setBulkValidationErrors] = useState<string[]>([]);
  const [isValidatingBulk, setIsValidatingBulk] = useState(false);
  const [bulkDesignCount, setBulkDesignCount] = useState<number>(0);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

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
    
    // Special handling for mockup (can be jpg or png)
    if (fileType === 'mockup') {
      if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png') {
        setFileErrors({
          ...fileErrors,
          [fileType]: `Invalid file type. Mockup must be .jpg or .png file.`
        });
        return;
      }
    } else {
      // Validate file type for required files
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

    setFiles({ ...files, [fileType]: file });
    setFileErrors({ ...fileErrors, [fileType]: "" });
  };

  // Download template function (same as onboarding step 4)
  const downloadTemplate = async () => {
    setIsGeneratingTemplate(true);
    try {
      const zip = new JSZip();
      const rootFolder = 'designs';
      
      // Create sample design folders (3 examples)
      const sampleFolders = ['Design_001', 'Design_002', 'Design_003'];
      const requiredFiles = ['design.eps', 'design.cdr', 'design.jpg', 'design.png'];
      
      // Create dummy file content (empty or minimal content)
      const dummyContent = new Uint8Array(0); // Empty file
      
      // Add sample design folders with required files
      for (const folderName of sampleFolders) {
        for (const fileName of requiredFiles) {
          const filePath = `${rootFolder}/${folderName}/${fileName}`;
          zip.file(filePath, dummyContent);
        }
      }
      
      // Create metadata.xlsx
      const metadataData = [
        ['folder_name', 'title', 'description', 'category', 'subcategory', 'Plan', 'color', 'price', 'Visible', 'Tags'],
        ['Design_001', 'Sample Design 1', 'This is a sample design', 'ecommerce', 'residential', '0', 'Red', '100', '1', 'tag1,tag2'],
        ['Design_002', 'Sample Design 2', 'This is a sample design', 'ecommerce', 'commercial', '1', 'Blue', '200', '1', 'tag3,tag4'],
        ['Design_003', 'Sample Design 3', 'This is a sample design', 'other', 'other', '2', 'Green', '300', '1', 'tag5,tag6'],
      ];
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Convert workbook to binary string
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      // Add metadata.xlsx to zip
      zip.file(`${rootFolder}/metadata.xlsx`, excelBuffer);
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'designs-template.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Template downloaded successfully!",
        description: "The template zip file has been downloaded.",
      });
    } catch (error: any) {
      console.error('Error generating template:', error);
      toast({
        title: "Failed to generate template",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  // Validate bulk zip file (same logic as onboarding step 4)
  const validateZipFile = async (file: File): Promise<{ valid: boolean; errors: string[]; designCount: number }> => {
    const errors: string[] = [];
    let designCount = 0;

    try {
      // Check file size
      if (file.size > MAX_BULK_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`❌ File too large: Your file is ${fileSizeMB} MB, but the maximum allowed size is 1GB (1024 MB). Please compress your files or split them into smaller zip files.`);
        return { valid: false, errors, designCount: 0 };
      }

      // Load zip file
      const zip = await JSZip.loadAsync(file);
      const allFiles = Object.keys(zip.files);

      // Find metadata.xlsx
      let metadataFile: JSZip.JSZipObject | null = null;
      let metadataFileName = '';
      for (const fileName of allFiles) {
        const normalizedName = fileName.toLowerCase();
        if (normalizedName === 'metadata.xlsx' || normalizedName.endsWith('/metadata.xlsx')) {
          metadataFile = zip.files[fileName];
          metadataFileName = fileName;
          break;
        }
      }

      if (!metadataFile) {
        errors.push('❌ metadata.xlsx file not found: Your zip file must contain a file named "metadata.xlsx" at the root level (inside the main folder).');
        return { valid: false, errors, designCount: 0 };
      }

      // Parse metadata.xlsx
      try {
        const metadataData = await metadataFile.async('arraybuffer');
        const workbook = XLSX.read(metadataData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Find folder_name column
        const headerRow = data[0] || [];
        const folderNameColIndex = headerRow.findIndex((cell: any) => {
          const normalized = String(cell).toLowerCase().trim().replace(/\s+/g, '_');
          return normalized === 'folder_name';
        });

        if (folderNameColIndex === -1) {
          errors.push('❌ Missing required column: The metadata.xlsx file must have a column named "folder_name" (case-insensitive).');
          return { valid: false, errors, designCount: 0 };
        }

        // Extract folder names from Excel
        const excelFolders = new Set<string>();
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row && row[folderNameColIndex]) {
            const folderName = String(row[folderNameColIndex]).trim();
            if (folderName) {
              excelFolders.add(folderName);
            }
          }
        }

        // System folders to ignore
        const SYSTEM_FOLDERS = ['__macosx', '.ds_store', 'rar', '.rar', 'thumbs.db'];
        
        // Find root folder
        let rootFolder = '';
        for (const fileName of allFiles) {
          if (fileName.includes('/') && !fileName.endsWith('/')) {
            const parts = fileName.split('/');
            if (parts.length >= 2) {
              rootFolder = parts[0];
              break;
            }
          }
        }

        // Extract actual design folders from zip
        const zipFolders = new Map<string, Set<string>>();
        for (const fileName of allFiles) {
          if (fileName === metadataFileName || fileName.endsWith('/')) {
            continue;
          }

          if (fileName.includes('/')) {
            const parts = fileName.split('/');
            
            if (parts.length < 3) {
              continue;
            }

            const rootFolderName = parts[0].toLowerCase();
            const folderName = parts[1];
            const fileNameOnly = parts[parts.length - 1];
            const ext = fileNameOnly.substring(fileNameOnly.lastIndexOf('.')).toLowerCase();

            if (SYSTEM_FOLDERS.includes(rootFolderName) || SYSTEM_FOLDERS.includes(folderName.toLowerCase())) {
              continue;
            }

            if (parts.length === 3 && REQUIRED_FILES.includes(ext)) {
              if (!zipFolders.has(folderName)) {
                zipFolders.set(folderName, new Set());
              }
              zipFolders.get(folderName)!.add(ext);
            }
          }
        }

        // Filter folders that have all required files
        const validDesignFolders = new Map<string, Set<string>>();
        for (const [folderName, files] of zipFolders.entries()) {
          const hasAllRequired = REQUIRED_FILES.every(ext => files.has(ext));
          if (hasAllRequired) {
            validDesignFolders.set(folderName, files);
    }
        }

        designCount = validDesignFolders.size;

        // Validate folder_name mapping
        const zipFolderNames = new Set(validDesignFolders.keys());
        const missingInZip = Array.from(excelFolders).filter(f => !zipFolderNames.has(f));
        const missingInExcel = Array.from(zipFolderNames).filter(f => !excelFolders.has(f));

        if (missingInZip.length > 0) {
          const missingList = missingInZip.slice(0, 10);
          const moreCount = missingInZip.length > 10 ? missingInZip.length - 10 : 0;
          errors.push(`❌ Folders listed in metadata.xlsx but not found in zip file: ${missingList.join(', ')}${moreCount > 0 ? ` (and ${moreCount} more)` : ''}.`);
        }

        if (missingInExcel.length > 0) {
          const missingList = missingInExcel.slice(0, 10);
          const moreCount = missingInExcel.length > 10 ? missingInExcel.length - 10 : 0;
          errors.push(`❌ Folders found in zip file but not listed in metadata.xlsx: ${missingList.join(', ')}${moreCount > 0 ? ` (and ${moreCount} more)` : ''}.`);
        }

        // Validate each design folder has required files
        const invalidFolders: string[] = [];
        for (const [folderName, files] of validDesignFolders.entries()) {
          const missingFiles = REQUIRED_FILES.filter(ext => !files.has(ext));
          if (missingFiles.length > 0) {
            invalidFolders.push(`${folderName} (missing: ${missingFiles.join(', ')})`);
            if (invalidFolders.length >= 10) break;
          }
        }

        if (invalidFolders.length > 0) {
          const moreCount = invalidFolders.length >= 10 ? invalidFolders.length - 10 : 0;
          errors.push(`❌ Some design folders are missing required files. Each folder must contain all 4 file types (.eps, .cdr, .jpg, .png). Affected folders: ${invalidFolders.join('; ')}${moreCount > 0 ? ` (and ${moreCount} more)` : ''}`);
        }

        return {
          valid: errors.length === 0,
          errors,
          designCount,
        };
      } catch (excelError: any) {
        errors.push(`❌ Error reading metadata.xlsx: ${excelError.message || 'The Excel file appears to be corrupted or in an invalid format.'}`);
        return { valid: false, errors, designCount: 0 };
      }
    } catch (zipError: any) {
      errors.push(`❌ Error reading zip file: ${zipError.message || 'The zip file appears to be corrupted or in an invalid format.'}`);
      return { valid: false, errors, designCount: 0 };
    }
  };

  const handleBulkFileUpload = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'zip') {
      setFileErrors({
        bulk: "Your bulk upload must be a .zip file containing subfolders, each with .eps, .cdr, .jpg, and .png files."
      });
      setBulkFile(null);
      setBulkDesignCount(0);
      setBulkValidationErrors([]);
      return;
    }

    setIsValidatingBulk(true);
    setFileErrors({ bulk: "" });
    setBulkValidationErrors([]);

    try {
      const validation = await validateZipFile(file);
      
      if (validation.valid) {
        setBulkFile(file);
        setBulkDesignCount(validation.designCount);
        setBulkValidationErrors([]);
        toast({
          title: "Validation successful!",
          description: `Found ${validation.designCount} design folders.`,
        });
      } else {
        setBulkFile(null);
        setBulkDesignCount(0);
        setBulkValidationErrors(validation.errors);
        toast({
          title: "Validation failed",
          description: "Please check the errors below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setBulkFile(null);
      setBulkDesignCount(0);
      setFileErrors({ bulk: `Validation error: ${error.message || 'Unknown error occurred'}` });
      toast({
        title: "Validation error",
        description: "Failed to validate zip file",
        variant: "destructive",
      });
    } finally {
      setIsValidatingBulk(false);
    }
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
      // Check for required files: eps, cdr, jpg, png (mockup is optional)
      const requiredFiles = ['eps', 'cdr', 'jpg', 'png'] as const;
      const missingFiles = requiredFiles.filter(fileType => !files[fileType]);
      if (missingFiles.length > 0) {
        errors.files = `Missing required files: ${missingFiles.map(f => `.${f}`).join(', ')}`;
      }
    } else {
      if (!bulkFile) {
        errors.bulk = "Bulk upload file is required";
      }
      if (bulkValidationErrors.length > 0) {
        errors.bulk = "Bulk upload validation failed. Please check the errors below.";
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
      // Map pricing type: 'free' -> 'basic', 'paid' -> 'prime'
      formData.append('product_plan_type', pricingType === "free" ? "basic" : "prime");

      if (pricingType === "paid" && price) {
        formData.append('price', price);
      }

      if (color.trim()) {
        formData.append('color', color.trim());
      }

      // Add design files
      if (uploadMode === "single") {
        // Add required files (eps, cdr, jpg, png) and optional mockup
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
        mockup: null,
      });
      setBulkFile(null);
      setBulkDesignCount(0);
      setBulkValidationErrors([]);
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
                Upload required file formats: .cdr, .eps, .png, .jpg. Mockup (.jpg or .png) is optional.
              </p>
              
              {(["eps", "cdr", "jpg", "png"] as const).map((fileType) => (
                <div key={fileType} className="space-y-2">
                  <Label htmlFor={fileType} className="flex items-center gap-2">
                    {fileType.toUpperCase()} File <span className="text-destructive">*</span>
                    {files[fileType] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
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
              
              {/* Optional Mockup */}
              <div className="space-y-2">
                <Label htmlFor="mockup" className="flex items-center gap-2">
                  Mockup (JPG or PNG) <span className="text-muted-foreground text-xs">(Optional)</span>
                  {files.mockup && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="mockup"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('mockup', file);
                    }}
                    className="flex-1"
                    disabled={isUploading}
                  />
                  {files.mockup && (
                    <span className="text-sm text-muted-foreground">
                      {files.mockup?.name}
                    </span>
                  )}
                </div>
                {fileErrors.mockup && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {fileErrors.mockup}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Upload */}
          {uploadMode === "bulk" && (
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Bulk Upload Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Upload a single .zip file</li>
                  <li>The zip must contain multiple design folders</li>
                  <li>Each folder represents one design</li>
                  <li>Each design folder must include all 4 required files: .eps, .cdr, .jpg, .png</li>
                  <li>Include metadata.xlsx file at the root level</li>
                  <li>Maximum file size: 1GB (1024 MB)</li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={downloadTemplate}
                disabled={isGeneratingTemplate}
              >
                {isGeneratingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Bulk Upload Template
                  </>
                )}
              </Button>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium text-sm mb-2">Folder Structure Requirements:</h4>
                <div className="bg-background/50 p-3 rounded border border-border font-mono text-xs space-y-1">
                  <div>designs.zip/</div>
                  <div className="pl-4">├── Design_001/</div>
                  <div className="pl-8">├── design.eps</div>
                  <div className="pl-8">├── design.cdr</div>
                  <div className="pl-8">├── design.jpg</div>
                  <div className="pl-8">└── design.png</div>
                  <div className="pl-4">├── Design_002/</div>
                  <div className="pl-8">└── ...</div>
                  <div className="pl-4">└── Design_XXX/</div>
                  <div className="pl-8">└── ...</div>
                  <div className="pl-4">└── metadata.xlsx</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: The metadata.xlsx file must contain a &quot;folder_name&quot; column that matches the folder names in your zip file.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkFile">Bulk Upload File (.zip) <span className="text-destructive">*</span></Label>
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  bulkFile && bulkValidationErrors.length === 0
                    ? 'border-green-500 bg-green-500/5'
                    : (fileErrors.bulk || bulkValidationErrors.length > 0)
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border hover:border-primary'
                }`}>
                  <input
                    id="bulkFile"
                    type="file"
                    accept=".zip"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBulkFileUpload(file);
                    }}
                    disabled={isValidatingBulk || isUploading}
                  />
                  
                  {isValidatingBulk ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Validating zip file...</p>
                    </div>
                  ) : bulkFile && bulkValidationErrors.length === 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <FileArchive className="w-4 h-4 text-green-500" />
                          <p className="font-medium text-sm">{bulkFile.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(bulkFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {bulkDesignCount > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ {bulkDesignCount} design folders validated
                          </p>
                        )}
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                        File validated successfully
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBulkFile(null);
                          setBulkDesignCount(0);
                          setBulkValidationErrors([]);
                          setFileErrors({ bulk: "" });
                        }}
                        className="text-xs"
                      >
                        Change File
                      </Button>
                      </div>
                    ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Drop your .zip file here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 1GB (1024 MB)
                      </p>
                      </div>
                    )}
                </div>

                {(fileErrors.bulk || bulkValidationErrors.length > 0) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium mb-2">
                        {bulkValidationErrors.length > 0 ? 'Validation Errors:' : 'Error:'}
                      </p>
                      {fileErrors.bulk && bulkValidationErrors.length === 0 && (
                        <p className="text-sm text-destructive">{fileErrors.bulk}</p>
                      )}
                      {bulkValidationErrors.length > 0 && (
                        <ul className="list-disc list-inside space-y-2">
                          {bulkValidationErrors.map((err, idx) => (
                            <li key={idx} className="text-sm text-destructive">{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
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
