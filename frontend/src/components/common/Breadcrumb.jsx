import React from "react";
import { Link } from "react-router-dom";

export function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center text-xs sm:text-sm text-ink-muted py-2" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <li>
          <Link to="/" className="hover:text-brand transition">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li className="text-ink-subtle/60">/</li>
              <li>
                {isLast || !item.href ? (
                  <span className="text-ink font-medium truncate max-w-[200px] sm:max-w-none inline-block align-bottom">
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.href} className="hover:text-brand transition">
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
