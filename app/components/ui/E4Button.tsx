"use client";

import * as React from "react";

type Variant = "gold" | "outline" | "ghost";

interface E4ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function E4Button({
  variant = "gold",
  children,
  className = "",
  ...props
}: E4ButtonProps) {
  const variantClass =
    variant === "gold"
      ? "e4-btn-gold"
      : variant === "outline"
      ? "e4-btn-outline"
      : "e4-btn-ghost";

  return (
    <button
      className={`e4-btn ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
