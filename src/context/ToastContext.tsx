"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, title?: string) => void;
  toast: (options: { message: string; variant?: ToastVariant; title?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, variant, title };
      
      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 visible toasts

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const toast = useCallback(
    (options: { message: string; variant?: ToastVariant; title?: string }) => {
      showToast(options.message, options.variant || "info", options.title);
    },
    [showToast]
  );

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
        };
      case "error":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-900",
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-900",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
        };
      case "info":
      default:
        return {
          bg: "bg-sky-50 border-sky-200 text-sky-900",
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "440px",
              maxWidth: "92vw",
              minWidth: "320px",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              pointerEvents: "none",
            }}
            aria-live="polite"
          >
            {toasts.map((t) => {
              const { bg, icon } = getVariantStyles(t.variant);
              return (
                <div
                  key={t.id}
                  style={{
                    width: "100%",
                    minWidth: "320px",
                    maxWidth: "440px",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                  className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-xl border shadow-2xl transition-all animate-in slide-in-from-top-5 duration-200 ${bg}`}
                >
                  {icon}
                  <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                    {t.title && (
                      <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90 block leading-tight">
                        {t.title}
                      </h4>
                    )}
                    <p className="text-xs sm:text-sm font-medium leading-normal block whitespace-normal">
                      {t.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity shrink-0 ml-1"
                    aria-label="Dismiss toast"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
