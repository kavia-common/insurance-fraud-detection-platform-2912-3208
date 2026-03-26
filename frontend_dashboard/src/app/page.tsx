"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchDashboardSummary, fetchClaims } from "@/lib/api";
import type { DashboardSummary, ClaimResponse } from "@/lib/api";
import FraudScoreBadge from "@/components/FraudScoreBadge";
import Link from "next/link";

/**
 * Dashboard home page - displays aggregated statistics, claim counts,
 * risk distribution, and a table of recently flagged claims.
 */
export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentClaims, setRecentClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, claimsData] = await Promise.all([
        fetchDashboardSummary(),
        fetchClaims({ limit: 10, risk_level: "high" }),
      ]);
      setSummary(summaryData);
      setRecentClaims(claimsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px" }}>
        <AlertTriangle size={40} style={{ color: "var(--color-error)", margin: "0 auto 12px" }} />
        <h3 style={{ marginBottom: "8px" }}>Error loading dashboard</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const stats = summary || {
    total_claims: 0,
    flagged_claims: 0,
    high_risk_claims: 0,
    under_investigation: 0,
    confirmed_fraud: 0,
    total_recovery: 0,
    avg_fraud_score: 0,
    claims_by_status: {},
    claims_by_risk: {},
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Overview of claims, fraud detection, and investigation status
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard title="Total Claims" value={stats.total_claims} icon={FileText} color="#3b82f6" />
        <StatCard title="Flagged Claims" value={stats.flagged_claims} icon={AlertTriangle} color="#f59e0b" />
        <StatCard title="High Risk" value={stats.high_risk_claims} icon={ShieldAlert} color="#ef4444" />
        <StatCard
          title="Under Investigation"
          value={stats.under_investigation}
          icon={Search}
          color="#8b5cf6"
        />
        <StatCard title="Confirmed Fraud" value={stats.confirmed_fraud} icon={ShieldAlert} color="#dc2626" />
        <StatCard
          title="Total Recovery"
          value={`$${(stats.total_recovery || 0).toLocaleString()}`}
          icon={DollarSign}
          color="#06b6d4"
        />
        <StatCard
          title="Avg Fraud Score"
          value={Math.round(stats.avg_fraud_score || 0)}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <StatCard
          title="Investigators Active"
          value={Object.keys(stats.claims_by_status).length}
          icon={Users}
          color="#64748b"
        />
      </div>

      {/* Distribution Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {/* Claims by Status */}
        <div className="card">
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={16} />
            Claims by Status
          </h3>
          {Object.entries(stats.claims_by_status).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(stats.claims_by_status).map(([status, count]) => (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</span>
                  <span className="badge badge-info">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No data available</p>
          )}
        </div>

        {/* Claims by Risk */}
        <div className="card">
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={16} />
            Claims by Risk Level
          </h3>
          {Object.entries(stats.claims_by_risk).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(stats.claims_by_risk).map(([risk, count]) => (
                <div key={risk} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>{risk}</span>
                  <span className={`badge badge-${risk}`}>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No data available</p>
          )}
        </div>
      </div>

      {/* Recent High-Risk Claims Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Recent High-Risk Claims</h3>
          <Link href="/claims?risk_level=high" className="btn btn-secondary" style={{ fontSize: "0.8125rem", textDecoration: "none" }}>
            View All
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Fraud Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.length > 0 ? (
                recentClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <Link href={`/claims/${claim.id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                        {claim.claim_number}
                      </Link>
                    </td>
                    <td>{claim.claim_type}</td>
                    <td>${claim.claim_amount.toLocaleString()}</td>
                    <td><FraudScoreBadge score={claim.fraud_score} riskLevel={claim.risk_level} /></td>
                    <td><span className="badge badge-info">{claim.status}</span></td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>{claim.incident_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                    No high-risk claims found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
