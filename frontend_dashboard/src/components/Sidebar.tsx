"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Users,
  Network,
  ClipboardCheck,
  BarChart3,
  Settings,
} from "lucide-react";

/**
 * Navigation items for the sidebar menu.
 * Each item maps to a main section of the dashboard.
 */
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/claims", label: "Claims", icon: FileText },
  { href: "/assignments", label: "Assignments", icon: Users },
  { href: "/rules", label: "Fraud Rules", icon: Shield },
  { href: "/network", label: "Network View", icon: Network },
  { href: "/outcomes", label: "Outcomes", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

// PUBLIC_INTERFACE
/**
 * Sidebar component providing persistent navigation across the dashboard.
 * Highlights the currently active route.
 */
export default function Sidebar() {
  const pathname = usePathname();

  /**
   * Determine if a nav item is currently active based on path matching.
   */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minHeight: "100vh",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)" }}>
              Fraud Detection
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
              SIU Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-primary)" : "var(--color-secondary)",
                backgroundColor: active ? "rgba(59, 130, 246, 0.08)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--color-border)",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Settings size={14} />
          Insurance SIU v1.0
        </div>
      </div>
    </aside>
  );
}
