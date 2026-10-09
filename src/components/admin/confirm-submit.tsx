"use client";

import type { ReactNode } from "react";

/** Submit button that asks for confirmation first (deletes). */
export function ConfirmSubmit({ message, children, className = "" }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
