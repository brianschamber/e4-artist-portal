"use client";

import * as React from "react";

type E4InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function E4Input({
  label,
  id,
  className = "",
  value,
  ...rest
}: E4InputProps) {
  // Avoid React warning for null / undefined value
  const normalizedValue =
    value === null || value === undefined ? "" : value;

  return (
    <div className="e4-input-wrapper">
      {label && (
        <label
          htmlFor={id}
          className="e4-input-label"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        value={normalizedValue as any}
        className={`e4-input ${className}`}
        {...rest}
      />
    </div>
  );
}
