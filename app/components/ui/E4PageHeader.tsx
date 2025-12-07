"use client";

import * as React from "react";

interface E4PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // optional buttons on the right
}

export function E4PageHeader({ title, subtitle, actions }: E4PageHeaderProps) {
  return (
    <header className="e4-page-header">
      {/* LEFT SIDE: Title + Subtitle */}
      <div className="e4-page-header-left">
        <h1 className="e4-page-title">{title}</h1>

        {subtitle && (
          <p className="e4-page-subtitle">{subtitle}</p>
        )}
      </div>

      {/* RIGHT SIDE: Actions */}
      {actions && (
        <div className="e4-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
}
