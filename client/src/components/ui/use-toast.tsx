// Adapted from: https://ui.shadcn.com/docs/components/toast
import { useContext, createContext, useState, useCallback } from "react";
import type { ToastActionElement, ToastProps } from "./toast";

type ToastType = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToasterToast = ToastType & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const ToastContext = createContext<{
  toasts: ToasterToast[];
  addToast: (toast: ToastType) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = useCallback(
    (toast: ToastType) => {
      setToasts((prevToasts) => [...prevToasts, { ...toast, id: crypto.randomUUID() }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { toasts, addToast, removeToast } = useContext(ToastContext);

  const toast = useCallback(
    (props: ToastType) => {
      addToast(props);
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    toast,
    dismiss,
    toasts,
  };
}
