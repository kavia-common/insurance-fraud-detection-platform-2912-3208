import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

// PUBLIC_INTERFACE
/**
 * StatCard displays a single dashboard metric with an icon,
 * value, title, and optional subtitle.
 */
export default function StatCard({ title, value, icon: Icon, color = "#3b82f6", subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
            {title}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: `${color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
