import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: Toast | null;
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, success, error, warning, info }}>
      {children}
      {toast && (
        <>
          <div
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              padding: "1rem 1.5rem",
              backgroundColor: getBackgroundColor(toast.type),
              color: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10000,
              animation: "slideIn 0.3s ease-out",
              maxWidth: "400px",
            }}
          >
            {toast.message}
          </div>
          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}
    </ToastContext.Provider>
  );
}

function getBackgroundColor(type: ToastType): string {
  switch (type) {
    case "success":
      return "var(--success)";
    case "error":
      return "var(--error)";
    case "warning":
      return "var(--warning, #f59e0b)";
    case "info":
      return "var(--info, #3b82f6)";
    default:
      return "var(--success)";
  }
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

