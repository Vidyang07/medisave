import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children, adminOnly = false, partnerOnly = false }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (partnerOnly) {
    const isPartner = user?.role === "partner";
    const isAdmin = user?.role === "admin";
    if (!isPartner && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
