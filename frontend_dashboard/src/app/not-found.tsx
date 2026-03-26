import React from "react";
import Link from "next/link";

/**
 * Custom 404 page with navigation back to the dashboard.
 */
export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "8px" }}>
        404
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "8px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "24px", maxWidth: "400px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 20px",
          backgroundColor: "var(--color-primary)",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
