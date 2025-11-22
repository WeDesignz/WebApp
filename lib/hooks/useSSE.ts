import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../api';

interface SSEProgressData {
  status: string;
  processed: number;
  total: number;
  failed: number;
  progress_percentage: number;
  error_message?: string;
}

interface SSEEvent {
  type: 'progress' | 'complete' | 'error';
  data: SSEProgressData;
}

interface UseSSEOptions {
  taskId: number | null;
  enabled?: boolean;
  onProgress?: (data: SSEProgressData) => void;
  onComplete?: (data: SSEProgressData) => void;
  onError?: (error: string) => void;
}

export function useSSE(options: UseSSEOptions) {
  const { taskId, enabled = true, onProgress, onComplete, onError } = options;
  const [progress, setProgress] = useState<SSEProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasOpenedRef = useRef(false);
  const isAuthErrorRef = useRef(false);

  const connect = useCallback(() => {
    if (!taskId || !enabled) {
      return;
    }

    // Don't reconnect if we've detected an auth error
    if (isAuthErrorRef.current) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = apiClient.streamDesignProcessingProgress(taskId);
      
      if (!eventSource) {
        console.error('Failed to create EventSource');
        onError?.('Failed to create SSE connection: No token available');
        isAuthErrorRef.current = true; // Likely an auth issue
        return;
      }

      eventSourceRef.current = eventSource;
      hasOpenedRef.current = false;
      reconnectAttempts.current = 0;

      // Set a timeout to detect immediate failures (likely auth errors)
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
      authCheckTimeoutRef.current = setTimeout(() => {
        // If connection is closed immediately and never opened, it's likely an auth error
        if (eventSource.readyState === EventSource.CLOSED && !hasOpenedRef.current) {
          console.error('SSE: Connection closed immediately, likely authentication error');
          isAuthErrorRef.current = true;
          setIsConnected(false);
          onError?.('Authentication failed. Please refresh the page and try again.');
          eventSource.close();
        }
        authCheckTimeoutRef.current = null;
      }, 1000); // Check after 1 second

      eventSource.onopen = () => {
        if (authCheckTimeoutRef.current) {
          clearTimeout(authCheckTimeoutRef.current);
          authCheckTimeoutRef.current = null;
        }
        hasOpenedRef.current = true;
        setIsConnected(true);
        reconnectAttempts.current = 0;
        isAuthErrorRef.current = false; // Reset auth error flag on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);
          
          if (sseEvent.type === 'progress') {
            setProgress(sseEvent.data);
            onProgress?.(sseEvent.data);
          } else if (sseEvent.type === 'complete') {
            setProgress(sseEvent.data);
            onComplete?.(sseEvent.data);
            // Close connection after completion
            eventSource.close();
            setIsConnected(false);
          } else if (sseEvent.type === 'error') {
            const errorMsg = sseEvent.data.error_message || 'Unknown error';
            onError?.(errorMsg);
            eventSource.close();
            setIsConnected(false);
            // Don't reconnect on explicit error events
            isAuthErrorRef.current = true;
          }
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        if (authCheckTimeoutRef.current) {
          clearTimeout(authCheckTimeoutRef.current);
          authCheckTimeoutRef.current = null;
        }
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Check if connection was never opened (likely auth error)
        if (!hasOpenedRef.current && eventSource.readyState === EventSource.CLOSED) {
          console.error('SSE: Connection failed immediately, likely authentication error');
          isAuthErrorRef.current = true;
          onError?.('Authentication failed. Please refresh the page and try again.');
          return; // Don't attempt to reconnect
        }
        
        // Only attempt to reconnect if we had a successful connection before
        if (hasOpenedRef.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff, max 10s
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (!hasOpenedRef.current) {
          // Never opened, likely auth error - don't retry
          isAuthErrorRef.current = true;
          onError?.('Failed to connect. Please check your authentication and try again.');
        } else {
          onError?.('Failed to connect to progress stream after multiple attempts');
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to create SSE connection');
      isAuthErrorRef.current = true;
    }
  }, [taskId, enabled, onProgress, onComplete, onError]);

  useEffect(() => {
    // Reset auth error flag when taskId or enabled changes
    isAuthErrorRef.current = false;
    hasOpenedRef.current = false;
    
    if (enabled && taskId) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
        authCheckTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, taskId, connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    progress,
    isConnected,
    disconnect,
    reconnect: connect,
  };
}

