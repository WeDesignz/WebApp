"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, CheckCircle2, AlertCircle, Download } from "lucide-react";

type UploadMode = "single" | "bulk";
type PricingType = "free" | "paid";

interface FileUploadStatus {
  eps: File | null;
  cdr: File | null;
  jpg: File | null;
  png: File | null;
  svg: File | null;
}

const categories = [
  { value: "logo", label: "Logo Design", subcategories: ["Modern", "Vintage", "Minimal", "Abstract"] },
  { value: "print", label: "Print Design", subcategories: ["Business Card", "Flyer", "Brochure", "Poster"] },
  { value: "uiux", label: "UI/UX Design", subcategories: ["Mobile App", "Web App", "Dashboard", "Landing Page"] },
  { value: "icons", label: "Icon Set", subcategories: ["Line Icons", "Solid Icons", "Filled Icons", "Duotone"] },
  { value: "social", label: "Social Media", subcategories: ["Instagram", "Facebook", "Twitter", "LinkedIn"] },
];

export default function UploadDesignContent() {
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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

  const selectedCategory = categories.find(c => c.value === category);
  const subcategories = selectedCategory?.subcategories || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (fileType: keyof FileUploadStatus, file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== fileType) {
      setFileErrors({
        ...fileErrors,
        [fileType]: `Invalid file type. Please upload a valid .${fileType} file.`
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

    setBulkFile(file);
    setFileErrors({ bulk: "" });
  };

  const isFormValid = () => {
    if (!title || !category || !subcategory) return false;
    if (pricingType === "paid" && !price) return false;
    
    if (uploadMode === "single") {
      return Object.values(files).every(file => file !== null);
    } else {
      return bulkFile !== null;
    }
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      alert("Please fill all required fields and upload all necessary files.");
      return;
    }
    
    console.log("Form submitted:", {
      title,
      description,
      category,
      subcategory,
      tags,
      pricingType,
      price,
      uploadMode,
      files: uploadMode === "single" ? files : bulkFile
    });
    
    alert("Design uploaded successfully! It will be reviewed shortly.");
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
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your design (max 500 characters)"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500 characters
            </p>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(value: string) => {
                setCategory(value);
                setSubcategory("");
              }}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory <span className="text-destructive">*</span></Label>
              <Select 
                value={subcategory} 
                onValueChange={setSubcategory}
                disabled={!category}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub.toLowerCase()}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags to improve discoverability"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <X
                      className="w-3 h-3 ml-2 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
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
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                />
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

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="lg">
          Save as Draft
        </Button>
        <Button 
          size="lg" 
          onClick={handleSubmit}
          disabled={!isFormValid()}
        >
          Submit for Review
        </Button>
      </div>
    </div>
  );
}
