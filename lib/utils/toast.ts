/**
 * Toast utility helper
 * Provides convenient functions for showing toast notifications
 */

import { toast as toastFn } from "@/hooks/use-toast";

export const toast = {
  success: (title: string, description?: string) => {
    toastFn({
      title,
      description,
      variant: "default",
    });
  },

  error: (title: string, description?: string) => {
    toastFn({
      title,
      description,
      variant: "destructive",
    });
  },

  info: (title: string, description?: string) => {
    toastFn({
      title,
      description,
      variant: "default",
    });
  },

  warning: (title: string, description?: string) => {
    toastFn({
      title,
      description,
      variant: "default",
    });
  },
};

