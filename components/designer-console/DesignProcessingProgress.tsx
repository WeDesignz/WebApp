"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface DesignProcessingProgressProps {
  taskId: number | null;
  onComplete?: () => void;
}

export default function DesignProcessingProgress({ taskId }: DesignProcessingProgressProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!taskId) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Processing your designs.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Refresh the page to see the latest progress.
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

