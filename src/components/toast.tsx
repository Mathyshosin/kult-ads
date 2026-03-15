"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: { label: string; href: string };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (t: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  addToast: (t) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colors = {
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  error: "bg-red-500/10 border-red-500/30 text-red-400",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg animate-[slideIn_0.3s_ease-out] ${colors[toast.type]}`}
      style={{ minWidth: 280 }}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium text-foreground flex-1">{toast.message}</span>
      {toast.action && (
        <a
          href={toast.action.href}
          className="text-xs font-semibold text-primary hover:underline shrink-0"
        >
          {toast.action.label}
        </a>
      )}
      <button
        onClick={() => removeToast(toast.id)}
        className="p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
