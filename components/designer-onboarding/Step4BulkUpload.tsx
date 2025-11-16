"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertCircle, FileArchive, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { apiClient } from '@/lib/api';

interface Step4BulkUploadProps {
  onBack: () => void;
  onComplete: (bulkFile: File) => void;
}

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes
const MIN_DESIGNS = 50;
const REQUIRED_FILES = ['.eps', '.cdr', '.jpg', '.png'];

export default function Step4BulkUpload({ onBack, onComplete }: Step4BulkUploadProps) {
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [designCount, setDesignCount] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateZipFile = async (file: File): Promise<{ valid: boolean; errors: string[]; designCount: number }> => {
    const errors: string[] = [];
    let designCount = 0;

    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File size exceeds maximum limit of 1GB (1024 MB). Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
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
        errors.push('metadata.xlsx file not found in zip');
        return { valid: false, errors, designCount: 0 };
      }

      // Parse metadata.xlsx
      try {
        const metadataData = await metadataFile.async('arraybuffer');
        const workbook = XLSX.read(metadataData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Find folder_name column (handle variations like "folder_name", "Folder Name", etc.)
        const headerRow = data[0] || [];
        const folderNameColIndex = headerRow.findIndex((cell: any) => {
          const normalized = String(cell).toLowerCase().trim().replace(/\s+/g, '_');
          return normalized === 'folder_name';
        });

        if (folderNameColIndex === -1) {
          errors.push('folder_name column not found in metadata.xlsx');
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

        // Extract actual folders from zip
        const zipFolders = new Map<string, Set<string>>();
        for (const fileName of allFiles) {
          // Skip metadata.xlsx and directories
          if (fileName === metadataFileName || fileName.endsWith('/')) {
            continue;
          }

          // Extract folder name (everything before the last /)
          if (fileName.includes('/')) {
            const parts = fileName.split('/');
            const folderName = parts[0];
            const fileNameOnly = parts[parts.length - 1];
            const ext = fileNameOnly.substring(fileNameOnly.lastIndexOf('.')).toLowerCase();

            if (!zipFolders.has(folderName)) {
              zipFolders.set(folderName, new Set());
            }
            zipFolders.get(folderName)!.add(ext);
          }
        }

        designCount = zipFolders.size;

        // Validate folder count
        if (designCount < MIN_DESIGNS) {
          errors.push(`Minimum ${MIN_DESIGNS} design folders required. Found: ${designCount}`);
        }

        // Validate folder_name mapping
        const zipFolderNames = new Set(zipFolders.keys());
        const missingInZip = Array.from(excelFolders).filter(f => !zipFolderNames.has(f));
        const missingInExcel = Array.from(zipFolderNames).filter(f => !excelFolders.has(f));

        if (missingInZip.length > 0) {
          errors.push(`Folders in metadata.xlsx not found in zip: ${missingInZip.slice(0, 10).join(', ')}${missingInZip.length > 10 ? ` (and ${missingInZip.length - 10} more)` : ''}`);
        }

        if (missingInExcel.length > 0) {
          errors.push(`Folders in zip not found in metadata.xlsx: ${missingInExcel.slice(0, 10).join(', ')}${missingInExcel.length > 10 ? ` (and ${missingInExcel.length - 10} more)` : ''}`);
        }

        // Validate each design folder has required files
        const invalidFolders: string[] = [];
        for (const [folderName, files] of zipFolders.entries()) {
          const missingFiles = REQUIRED_FILES.filter(ext => !files.has(ext));
          if (missingFiles.length > 0) {
            invalidFolders.push(`${folderName}: missing ${missingFiles.join(', ')}`);
            if (invalidFolders.length >= 10) break; // Limit to first 10 errors
          }
        }

        if (invalidFolders.length > 0) {
          errors.push(`Folders with missing required files: ${invalidFolders.join('; ')}${invalidFolders.length >= 10 ? ' (showing first 10)' : ''}`);
        }

        return {
          valid: errors.length === 0,
          errors,
          designCount,
        };
      } catch (excelError: any) {
        errors.push(`Error reading metadata.xlsx: ${excelError.message || 'Invalid Excel file format'}`);
        return { valid: false, errors, designCount: 0 };
      }
    } catch (zipError: any) {
      errors.push(`Error reading zip file: ${zipError.message || 'Invalid zip file format'}`);
      return { valid: false, errors, designCount: 0 };
    }
  };

  const handleFileUpload = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'zip') {
      setError('File must be a .zip file');
      setBulkFile(null);
      setDesignCount(0);
      setValidationErrors([]);
      return;
    }

    // Check file size first
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds maximum limit of 1GB (1024 MB). Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setBulkFile(null);
      setDesignCount(0);
      setValidationErrors([]);
      return;
    }

    setIsValidating(true);
    setError('');
    setValidationErrors([]);

    try {
      const validation = await validateZipFile(file);
      
      if (validation.valid) {
        setBulkFile(file);
        setDesignCount(validation.designCount);
        setError('');
        setValidationErrors([]);
        toast.success(`Validation successful! Found ${validation.designCount} design folders.`);
      } else {
        setBulkFile(null);
        setDesignCount(0);
        setValidationErrors(validation.errors);
        const errorMessage = validation.errors.join('. ');
        setError(`Validation failed: ${errorMessage}`);
        toast.error('Zip file validation failed. Please check the errors below.');
      }
    } catch (error: any) {
      setBulkFile(null);
      setDesignCount(0);
      setError(`Validation error: ${error.message || 'Unknown error occurred'}`);
      toast.error('Failed to validate zip file');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!bulkFile) {
      setError('Please upload a bulk design file before continuing.');
      toast.error('Please upload a zip file');
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiClient.saveDesignerOnboardingStep4(bulkFile);

      if (response.error) {
        const errorMsg = response.error;
        const validationErrs = response.validationErrors || [];
        
        if (validationErrs.length > 0) {
          setValidationErrors(validationErrs);
          toast.error(`Upload failed: ${errorMsg}`);
        } else {
          toast.error(errorMsg);
        }
        setIsUploading(false);
        return;
      }

      toast.success('Designs uploaded successfully!');
      onComplete(bulkFile);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload zip file');
    } finally {
      setIsUploading(false);
    }
  };

  const isValid = bulkFile !== null && validationErrors.length === 0 && !error;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Upload Designs</h3>
                <p className="text-xs text-muted-foreground">
                  Upload a minimum of 50 designs to start selling on our platform
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Prepare your designs in a .zip file format
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Each design should be in its own subfolder
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Include .eps, .cdr, .jpg, .png files for each design
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Minimum 50 designs required to proceed
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Maximum file size: 1GB (1024 MB)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Download Template</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Get our folder structure template to organize your designs correctly
                  </p>
                  <Button variant="outline" size="sm" className="text-xs">
                    Download Template.zip
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Your Design Portfolio</h2>
              <p className="text-muted-foreground text-sm">
                Upload a minimum of 50 designs to activate your designer account and start earning
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-upload">
                  Bulk Upload <span className="text-destructive">*</span>
                </Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isValid
                      ? 'border-green-500 bg-green-500/5'
                      : error || validationErrors.length > 0
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <input
                    id="bulk-upload"
                    type="file"
                    accept=".zip"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isValidating}
                  />
                  
                  {isValidating ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Validating zip file...</p>
                    </div>
                  ) : bulkFile && isValid ? (
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
                        {designCount > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ {designCount} design folders validated
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
                          setDesignCount(0);
                          setError('');
                          setValidationErrors([]);
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

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium mb-1">Validation Error</p>
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium mb-2">Validation Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((err, idx) => (
                          <li key={idx} className="text-sm text-destructive">{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

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
                  <div className="pl-4">└── Design_050/</div>
                  <div className="pl-8">└── ...</div>
                  <div className="pl-4">└── metadata.xlsx</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: The metadata.xlsx file must contain a &quot;folder_name&quot; column that matches the folder names in your zip file.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onBack} disabled={isUploading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isUploading}
                className="min-w-32"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

