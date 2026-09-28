import { useEffect } from "react";
import { XIcon } from "./Icons";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171717]/50 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-xl shadow-xl border border-[#e4e2dd] w-full ${maxWidth} z-10 overflow-hidden transform transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e4e2dd] bg-[#fafaf7]">
          <h3 className="text-base font-bold text-[#171717]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#f2f1ec] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 max-h-[calc(100vh-180px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
