"use client";

import * as React from "react";

interface E4CardProps {
  children: React.ReactNode;
  className?: string;
}

export function E4Card({ children, className = "" }: E4CardProps) {
  return (
    <div className={`e4-card ${className}`}>
      <div className="e4-card-accent" />
      <div className="e4-card-body">{children}</div>
    </div>
  );
}
