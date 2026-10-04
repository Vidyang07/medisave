import { PackageIcon } from "./Icons";
import { Button } from "./Button";

export function EmptyState({
  title = "No medicines found",
  description = "Try adjusting your search query, clearing filters, or browsing other categories.",
  actionLabel,
  onAction,
  icon: Icon = PackageIcon,
}) {
  return (
    <div className="bg-white rounded-xl border border-line p-8 sm:p-10 text-center max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-brand-tint text-brand flex items-center justify-center mx-auto mb-3.5 border border-brand-line">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-xs text-ink-muted leading-relaxed mb-5 max-w-xs mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
