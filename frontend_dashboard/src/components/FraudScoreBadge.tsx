import React from "react";

interface FraudScoreBadgeProps {
  score: number;
  riskLevel?: string | null;
  showScore?: boolean;
}

// PUBLIC_INTERFACE
/**
 * FraudScoreBadge displays a color-coded badge showing the fraud risk score
 * and its corresponding risk level (low/medium/high).
 */
export default function FraudScoreBadge({ score, riskLevel, showScore = true }: FraudScoreBadgeProps) {
  const level = riskLevel || (score >= 70 ? "high" : score >= 40 ? "medium" : "low");
  const badgeClass = level === "high" ? "badge-high" : level === "medium" ? "badge-medium" : "badge-low";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {showScore && (
        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>
          {score}
        </span>
      )}
      <span className={`badge ${badgeClass}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    </div>
  );
}
