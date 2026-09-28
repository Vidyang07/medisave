import { useState, useCallback } from "react";
import { CheckIcon, AlertCircleIcon, InfoIcon, XIcon } from "../components/common/Icons";
import { ToastContext } from "./toastContextDef";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 4000) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-md border text-xs sm:text-sm font-medium transition-all transform translate-y-0 duration-200 ${
              toast.type === "success"
                ? "bg-white border-[#c4ded9] text-[#171717]"
                : toast.type === "error"
                ? "bg-white border-rose-200 text-[#171717]"
                : "bg-white border-[#e4e2dd] text-[#171717]"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-xs">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  <AlertCircleIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === "info" && (
                <div className="w-5 h-5 rounded-full bg-[#e8f3f1] text-[#0f4c42] flex items-center justify-center font-bold text-xs">
                  <InfoIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="flex-1 pr-2 leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#737373] hover:text-[#171717] transition p-0.5 rounded cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
