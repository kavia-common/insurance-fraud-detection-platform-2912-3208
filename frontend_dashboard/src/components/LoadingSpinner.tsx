import React from "react";

// PUBLIC_INTERFACE
/**
 * LoadingSpinner displays a centered animated spinner.
 * Used as a loading indicator while data is being fetched.
 */
export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        gap: "12px",
      }}
    >
      <div className="spinner" />
      <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{message}</div>
    </div>
  );
}
