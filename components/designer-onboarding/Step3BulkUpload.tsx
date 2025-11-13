"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertCircle, FileArchive, Download, ArrowLeft } from 'lucide-react';

interface Step3BulkUploadProps {
  onBack: () => void;
  onComplete: (bulkFile: File) => void;
}

export default function Step3BulkUpload({ onBack, onComplete }: Step3BulkUploadProps) {
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [designCount, setDesignCount] = useState<number>(0);

  const handleFileUpload = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'zip') {
      setError("Your bulk upload must be a .zip file containing at least 50 design subfolders.");
      setBulkFile(null);
      setDesignCount(0);
      return;
    }

    setBulkFile(file);
    setDesignCount(0);
    setError('');
  };

  const handleSubmit = () => {
    if (!bulkFile) {
      setError("Please upload a bulk design file before continuing.");
      return;
    }

    onComplete(bulkFile);
  };

  const isValid = bulkFile !== null;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Bulk Upload Designs</h3>
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
                  Include .eps, .cdr, .jpg, .png, and .svg files for each design
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Minimum 50 designs required to proceed
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
                    bulkFile
                      ? 'border-green-500 bg-green-500/5'
                      : error
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
                  />
                  
                  {bulkFile ? (
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
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                        File uploaded - Will be validated server-side
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBulkFile(null);
                          setDesignCount(0);
                          setError('');
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
                        Maximum file size: 500 MB
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>

              {bulkFile && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium mb-1">Server-side Validation</p>
                    <p>
                      Your file will be validated after upload to ensure it contains at least 50 designs with all required file formats (.eps, .cdr, .jpg, .png, .svg). 
                      Your account will be activated once validation is successful.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium text-sm mb-2">Folder Structure Requirements:</h4>
                <div className="bg-background/50 p-3 rounded border border-border font-mono text-xs space-y-1">
                  <div>designs.zip/</div>
                  <div className="pl-4">├── Design_001/</div>
                  <div className="pl-8">├── design.eps</div>
                  <div className="pl-8">├── design.cdr</div>
                  <div className="pl-8">├── design.jpg</div>
                  <div className="pl-8">├── design.png</div>
                  <div className="pl-8">└── design.svg</div>
                  <div className="pl-4">├── Design_002/</div>
                  <div className="pl-8">└── ...</div>
                  <div className="pl-4">└── Design_050/</div>
                  <div className="pl-8">└── ...</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="min-w-32"
              >
                Complete Onboarding
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
