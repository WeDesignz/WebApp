"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DesignProcessingProgressProps {
  taskId: number | null;
  onComplete?: () => void;
}

interface ProgressData {
  processed_designs: number;
  total_designs: number;
  status: string;
}

export default function DesignProcessingProgress({ taskId }: DesignProcessingProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!taskId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDesignProcessingProgress(taskId);
      
      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data?.data) {
        const taskData = response.data.data;
        setProgress({
          processed_designs: taskData.processed_designs || 0,
          total_designs: taskData.total_designs || 0,
          status: taskData.status || 'pending',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch progress');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!taskId) {
    return null;
  }

  // Don't show if task is completed
  if (progress?.status === 'completed') {
    return null;
  }

  // Show loading state
  if (isLoading) {
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
                  Loading progress...
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

  // Show error state
  if (error) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Error loading progress
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
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

  // Show progress with counter
  const processedCount = progress?.processed_designs || 0;
  const totalCount = progress?.total_designs || 0;

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
                {processedCount}/{totalCount} designs have been processed
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

