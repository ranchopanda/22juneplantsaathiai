import { toast as sonnerToast } from 'sonner';
import { useState } from 'react';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: ToastOptions) => {
    const { title, description, duration = 3000, variant = 'default' } = options;
    
    // Add to local state
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    
    // Show with sonner
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
        duration,
      });
    } else {
      sonnerToast(title, {
        description,
        duration,
      });
    }

    // Remove from local state after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return {
    toast,
    toasts,
  };
};
