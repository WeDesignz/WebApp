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
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

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
      
      toast.success('Template downloaded successfully!');
    } catch (error: any) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template. Please try again.');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const validateZipFile = async (file: File): Promise<{ valid: boolean; errors: string[]; designCount: number }> => {
    const errors: string[] = [];
    let designCount = 0;

    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
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

        // Find folder_name column (handle variations like "folder_name", "Folder Name", etc.)
        const headerRow = data[0] || [];
        const folderNameColIndex = headerRow.findIndex((cell: any) => {
          const normalized = String(cell).toLowerCase().trim().replace(/\s+/g, '_');
          return normalized === 'folder_name';
        });

        if (folderNameColIndex === -1) {
          errors.push('❌ Missing required column: The metadata.xlsx file must have a column named "folder_name" (case-insensitive). This column should list all your design folder names.');
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
        
        // Find root folder (first folder in path, e.g., "dummy" from "dummy/WD1/file.eps")
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

        // Extract actual design folders from zip (skip root folder and system folders)
        const zipFolders = new Map<string, Set<string>>();
        for (const fileName of allFiles) {
          // Skip metadata.xlsx and directories
          if (fileName === metadataFileName || fileName.endsWith('/')) {
            continue;
          }

          // Extract folder structure
          if (fileName.includes('/')) {
            const parts = fileName.split('/');
            
            // Skip if not enough parts (should have at least root/folder/file)
            if (parts.length < 3) {
              continue;
            }

            const rootFolderName = parts[0].toLowerCase();
            const folderName = parts[1];
            const fileNameOnly = parts[parts.length - 1];
            const ext = fileNameOnly.substring(fileNameOnly.lastIndexOf('.')).toLowerCase();

            // Skip system folders
            if (SYSTEM_FOLDERS.includes(rootFolderName) || SYSTEM_FOLDERS.includes(folderName.toLowerCase())) {
              continue;
            }

            // Only process files in design folders (second level, e.g., dummy/WD1/file.eps)
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

        // Validate folder count
        if (designCount < MIN_DESIGNS) {
          errors.push(`❌ Insufficient design folders: You have ${designCount} design folders, but a minimum of ${MIN_DESIGNS} is required. Please add ${MIN_DESIGNS - designCount} more design folders.`);
        }

        // Validate folder_name mapping
        const zipFolderNames = new Set(validDesignFolders.keys());
        const missingInZip = Array.from(excelFolders).filter(f => !zipFolderNames.has(f));
        const missingInExcel = Array.from(zipFolderNames).filter(f => !excelFolders.has(f));

        if (missingInZip.length > 0) {
          const missingList = missingInZip.slice(0, 10);
          const moreCount = missingInZip.length > 10 ? missingInZip.length - 10 : 0;
          errors.push(`❌ Folders listed in metadata.xlsx but not found in zip file: ${missingList.join(', ')}${moreCount > 0 ? ` (and ${moreCount} more)` : ''}. Please ensure these folders exist in your zip file.`);
        }

        if (missingInExcel.length > 0) {
          const missingList = missingInExcel.slice(0, 10);
          const moreCount = missingInExcel.length > 10 ? missingInExcel.length - 10 : 0;
          errors.push(`❌ Folders found in zip file but not listed in metadata.xlsx: ${missingList.join(', ')}${moreCount > 0 ? ` (and ${moreCount} more)` : ''}. Please add these folders to the "folder_name" column in your metadata.xlsx file.`);
        }

        // Validate each design folder has required files (should already be filtered, but double-check)
        const invalidFolders: string[] = [];
        for (const [folderName, files] of validDesignFolders.entries()) {
          const missingFiles = REQUIRED_FILES.filter(ext => !files.has(ext));
          if (missingFiles.length > 0) {
            invalidFolders.push(`${folderName} (missing: ${missingFiles.join(', ')})`);
            if (invalidFolders.length >= 10) break; // Limit to first 10 errors
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
        errors.push(`❌ Error reading metadata.xlsx: ${excelError.message || 'The Excel file appears to be corrupted or in an invalid format. Please ensure it\'s a valid .xlsx file.'}`);
        return { valid: false, errors, designCount: 0 };
      }
    } catch (zipError: any) {
      errors.push(`❌ Error reading zip file: ${zipError.message || 'The zip file appears to be corrupted or in an invalid format. Please ensure it\'s a valid .zip file and try again.'}`);
      return { valid: false, errors, designCount: 0 };
    }
  };

  const handleFileUpload = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'zip') {
      setError('❌ Invalid file type: Please upload a .zip file. The file you selected is not a zip archive.');
      setBulkFile(null);
      setDesignCount(0);
      setValidationErrors([]);
      return;
    }

    // Check file size first
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`❌ File too large: Your file is ${fileSizeMB} MB, but the maximum allowed size is 1GB (1024 MB). Please compress your files or split them into smaller zip files.`);
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
        setError(''); // Don't show duplicate error message
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
    setError(''); // Clear previous errors
    setValidationErrors([]); // Clear previous validation errors
    
    try {
      console.log('Starting upload of zip file...');
      const response = await apiClient.saveDesignerOnboardingStep4(bulkFile);
      console.log('Upload response received:', response);

      if (response.error) {
        const errorMsg = response.error;
        const validationErrs = response.validationErrors || [];
        
        console.error('Upload error:', errorMsg, validationErrs);
        
        if (validationErrs.length > 0) {
          setValidationErrors(validationErrs);
          toast.error(`Upload failed: ${errorMsg}`);
        } else {
          toast.error(errorMsg);
        }
        setIsUploading(false);
        return;
      }

      // Check if we have data (response.data contains the backend response)
      // Backend returns: { message: '...', data: {...} }
      // API client wraps it: { data: { message: '...', data: {...} } }
      if (!response.data) {
        console.error('No data in response:', response);
        toast.error('Upload completed but no data was returned. Please check your designer console.');
        setIsUploading(false);
        return;
      }

      console.log('Upload successful:', response.data);
      // Backend now returns immediately with task_id
      // Processing happens in background, redirect immediately
      // Show success toast and redirect
      toast.success('🎉 Onboarding completed successfully! Your designs are being processed in the background. You can track progress in the Designer Console.', {
        duration: 5000,
      });
      // Call onComplete which will handle redirect
      onComplete(bulkFile);
    } catch (error: any) {
      console.error('Upload exception:', error);
      toast.error(error.message || 'Failed to upload zip file. Please try again.');
      setIsUploading(false);
    } finally {
      // Only set loading to false if we haven't called onComplete (which will navigate away)
      // The onComplete will navigate away, so we don't need to reset loading state
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={downloadTemplate}
                    disabled={isGeneratingTemplate}
                  >
                    {isGeneratingTemplate ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Download Template.zip
                      </>
                    )}
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

                {(error || validationErrors.length > 0) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive font-medium mb-2">
                        {validationErrors.length > 0 ? 'Validation Errors:' : 'Error:'}
                      </p>
                      {error && validationErrors.length === 0 && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}
                      {validationErrors.length > 0 && (
                        <ul className="list-disc list-inside space-y-2">
                          {validationErrors.map((err, idx) => (
                            <li key={idx} className="text-sm text-destructive">{err}</li>
                          ))}
                        </ul>
                      )}
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

