import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useEffect, useState } from 'react';

// Type definitions
interface OrderComment {
  id: string;
  message: string;
  comment_type: 'customer' | 'admin' | 'system';
  created_by: {
    id: string | number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
  created_at: string;
  is_admin_response: boolean;
  is_read: boolean; // Added: indicates if current user has read this comment
  media?: any[];
  media_count?: number;
}

interface OrderCommentsResponse {
  order_id: number;
  order_type: string;
  order_title: string;
  comments: OrderComment[];
  total_comments: number;
}

const STORAGE_KEY_PREFIX = 'order_last_viewed_';

/**
 * Get the last viewed timestamp for an order from localStorage
 */
export function getLastViewedTimestamp(orderId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${orderId}`);
}

/**
 * Set the last viewed timestamp for an order in localStorage
 */
export function setLastViewedTimestamp(orderId: string, timestamp: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${orderId}`, timestamp);
}

/**
 * Clear the last viewed timestamp for an order
 */
export function clearLastViewedTimestamp(orderId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${orderId}`);
}

/**
 * Hook to get unread message count for an order
 */
export function useUnreadMessages(orderId: string | null, currentUserId?: string | number) {
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: commentsData } = useQuery<OrderCommentsResponse | null>({
    queryKey: ['orderComments', orderId, 'unread'],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        const response = await apiClient.getOrderComments(Number(orderId));
        if (response.error) {
          return null;
        }
        // The response.data should contain the OrderCommentsResponse structure
        // Transform the data to ensure all required fields are present
        const rawData = response.data as any;
        const data: OrderCommentsResponse = {
          ...rawData,
          comments: (rawData?.comments || []).map((comment: any) => ({
            ...comment,
            id: String(comment.id),
            is_admin_response: comment.is_admin_response ?? (comment.comment_type === 'admin' || comment.comment_type === 'system'),
            is_read: comment.is_read ?? false,
          })),
        };
        return data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // 10 seconds
  });

  useEffect(() => {
    if (!orderId) {
      setUnreadCount(0);
      return;
    }

    if (!commentsData?.comments) {
      // Comments haven't loaded yet, keep count at 0
      setUnreadCount(0);
      return;
    }

    // For customers: count unread admin/system messages (messages from admins that haven't been read)
    // Use the is_read field from the API response
    const unreadMessages = commentsData.comments.filter((comment: any) => {
      // Check if it's an admin/system message
      const isAdminOrSystem = comment.comment_type === 'admin' || comment.comment_type === 'system';
      // Also check is_admin_response as fallback
      const isAdminResponse = comment.is_admin_response === true;
      // Exclude customer's own messages
      const isNotFromCustomer = currentUserId ? String(comment.created_by?.id) !== String(currentUserId) : true;
      
      // Count if it's an admin/system message AND not read AND not from customer
      const shouldCount = (isAdminOrSystem || isAdminResponse) && !comment.is_read && isNotFromCustomer;
      
      return shouldCount;
    });

    const count = unreadMessages.length;
    setUnreadCount(count);
  }, [orderId, commentsData, currentUserId]);

  return unreadCount;
}

