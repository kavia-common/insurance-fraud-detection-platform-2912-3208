"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Calendar,
  Filter,
  X,
  TrendingUp,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import FraudScoreBadge from "@/components/FraudScoreBadge";
import {
  generateReport,
  fetchReportHistory,
  fetchInvestigators,
} from "@/lib/api";
import type {
  ReportResponse,
  ReportFilters,
  UserResponse,
} from "@/lib/api";

/**
 * Checks if an object looks like a claim record based on known claim fields.
 * Used to decide whether to render items in a claims table or as raw data.
 */
function isClaimLike(item: unknown): item is Record<string, unknown> {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return false;
  }
  const obj = item as Record<string, unknown>;
  // A claim-like object should have at least claim_number or claim_type and an id
  return (
    ("claim_number" in obj || "claim_type" in obj) &&
    ("id" in obj || "claim_amount" in obj)
  );
}

/**
 * Determines the risk level string from a claim-like object.
 * Falls back to score-based derivation if risk_level field is missing.
 */
function getClaimRiskLevel(claim: Record<string, unknown>): string {
  if (typeof claim.risk_level === "string" && claim.risk_level) {
    return claim.risk_level;
  }
  const score = typeof claim.fraud_score === "number" ? claim.fraud_score : 0;
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Formats a currency value with dollar sign and locale grouping.
 */
function formatCurrency(value: unknown): string {
  if (typeof value === "number") {
    return `$${value.toLocaleString()}`;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return `$${parsed.toLocaleString()}`;
  }
  return "$0";
}

/**
 * Reports page - generate filtered reports and view report history.
 * Supports date range, status, risk level, investigator, and claim type filters.
 */
export default function ReportsPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [history, setHistory] = useState<ReportResponse[]>([]);
  const [investigators, setInvestigators] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [investigatorFilter, setInvestigatorFilter] = useState("");
  const [claimTypeFilter, setClaimTypeFilter] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const [histData, invData] = await Promise.all([
        fetchReportHistory({ limit: 20 }),
        fetchInvestigators(),
      ]);
      setHistory(histData);
      setInvestigators(invData);
    } catch (err) {
      // History might not be available, that is OK
      console.error("Failed to load report history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /** Generate a report with current filters */
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: ReportFilters = {
        start_date: startDate || null,
        end_date: endDate || null,
        status: statusFilter || null,
        risk_level: riskFilter || null,
        investigator_id: investigatorFilter || null,
        claim_type: claimTypeFilter || null,
      };
      const result = await generateReport(filters);
      setReport(result);
      loadHistory(); // Refresh history
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  /** Clear all filters */
  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setRiskFilter("");
    setInvestigatorFilter("");
    setClaimTypeFilter("");
    setReport(null);
  };

  /**
   * Renders an array of claim-like objects as a styled, scrollable table
   * reusing the same visual patterns as the main Claims list page.
   */
  const renderClaimsTable = (claims: Record<string, unknown>[]) => {
    return (
      <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Claim #
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Type
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Amount
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Fraud Score
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Status
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Incident Date
              </th>
              <th style={{ position: "sticky", top: 0, background: "var(--color-surface)", padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)" }}>
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim, idx) => {
              const claimId = String(claim.id || "");
              const claimNumber = String(claim.claim_number || `Claim-${idx + 1}`);
              const claimType = String(claim.claim_type || "N/A");
              const claimAmount = claim.claim_amount;
              const fraudScore = typeof claim.fraud_score === "number" ? claim.fraud_score : 0;
              const riskLevel = getClaimRiskLevel(claim);
              const status = String(claim.status || "new");
              const incidentDate = String(claim.incident_date || "N/A");
              const location = claim.location ? String(claim.location) : "—";

              return (
                <tr key={claimId || idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>
                    {claimId ? (
                      <Link
                        href={`/claims/${claimId}`}
                        style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                      >
                        {claimNumber}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 500 }}>{claimNumber}</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.8125rem" }}>
                    {claimType}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "0.8125rem", fontWeight: 500 }}>
                    {formatCurrency(claimAmount)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <FraudScoreBadge score={fraudScore} riskLevel={riskLevel} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span className="badge badge-info" style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>
                      {status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    {incidentDate}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    {location}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /** Render a report data section */
  const renderReportData = (data: Record<string, unknown>) => {
    return Object.entries(data).map(([key, value]) => {
      // Handle nested objects/arrays
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return (
          <div key={key} style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "8px", textTransform: "capitalize" }}>
              {key.replace(/_/g, " ")}
            </h4>
            <div style={{ paddingLeft: "12px", borderLeft: "2px solid var(--color-border)" }}>
              {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--color-text-muted)", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                  <span style={{ fontWeight: 500 }}>{typeof v === "number" ? v.toLocaleString() : String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Handle arrays — detect claim-like items and render as a proper table
      if (Array.isArray(value)) {
        const claimItems = value.filter(isClaimLike);
        const isClaimsArray = claimItems.length > 0 && claimItems.length === value.length;

        return (
          <div key={key} style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "8px", textTransform: "capitalize" }}>
              {key.replace(/_/g, " ")} ({value.length})
            </h4>
            {isClaimsArray ? (
              /* Render claim-like items as a structured table */
              renderClaimsTable(claimItems)
            ) : (
              /* Fallback: render non-claim arrays as simple list items */
              <div style={{ maxHeight: "200px", overflowY: "auto", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                {value.map((item, i) => (
                  <div key={i} style={{ padding: "8px 12px", fontSize: "0.8125rem", borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "var(--color-surface)" : "transparent" }}>
                    {typeof item === "object" && item !== null ? (
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                          <span key={k} style={{ color: "var(--color-text-muted)" }}>
                            <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{k.replace(/_/g, " ")}:</span>{" "}
                            {String(v)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      String(item)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textTransform: "capitalize" }}>
            {key.replace(/_/g, " ")}
          </span>
          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
            {typeof value === "number" ? value.toLocaleString() : String(value ?? "N/A")}
          </span>
        </div>
      );
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 size={24} /> Reports
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Generate filtered reports and view historical data
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid var(--color-border)" }}>
        {(["generate", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-muted)",
              fontSize: "0.875rem",
              textTransform: "capitalize",
            }}
          >
            {tab === "generate" ? "Generate Report" : "Report History"}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} style={{ color: "#dc2626" }} /></button>
        </div>
      )}

      {activeTab === "generate" && (
        <div>
          {/* Filters Card */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={16} /> Report Filters
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div>
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label>Risk Level</label>
                <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label>Investigator</label>
                <select value={investigatorFilter} onChange={(e) => setInvestigatorFilter(e.target.value)}>
                  <option value="">All</option>
                  {investigators.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Claim Type</label>
                <select value={claimTypeFilter} onChange={(e) => setClaimTypeFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Collision">Collision</option>
                  <option value="Theft">Theft</option>
                  <option value="Property">Property</option>
                  <option value="Liability">Liability</option>
                  <option value="Medical">Medical</option>
                  <option value="Fire">Fire</option>
                  <option value="Water Damage">Water Damage</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Clear Filters
              </button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>Generating...</>
                ) : (
                  <><TrendingUp size={16} /> Generate Report</>
                )}
              </button>
            </div>
          </div>

          {/* Report Result */}
          {loading && <LoadingSpinner message="Generating report..." />}

          {report && !loading && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{report.report_type}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Generated: {report.generated_at || new Date().toISOString()}
                  </p>
                </div>
                {report.filters && Object.values(report.filters).some(Boolean) && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {Object.entries(report.filters)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <span key={k} className="badge badge-info" style={{ fontSize: "0.6875rem" }}>
                          {k}: {String(v)}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <div>{renderReportData(report.data)}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {historyLoading ? (
            <LoadingSpinner message="Loading report history..." />
          ) : history.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {history.map((r, index) => (
                <div key={r.id || index} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={16} style={{ color: "var(--color-primary)" }} />
                      <span style={{ fontWeight: 600 }}>{r.report_type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {r.generated_at || "N/A"}
                      </span>
                    </div>
                  </div>
                  {r.filters && Object.values(r.filters).some(Boolean) && (
                    <div style={{ marginBottom: "12px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {Object.entries(r.filters)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <span key={k} className="badge badge-neutral" style={{ fontSize: "0.6875rem" }}>
                            {k}: {String(v)}
                          </span>
                        ))}
                    </div>
                  )}
                  {/* Show summary stats from report data */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {Object.entries(r.data)
                      .filter(([, v]) => typeof v === "number")
                      .slice(0, 5)
                      .map(([k, v]) => (
                        <div key={k} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                            {typeof v === "number" ? v.toLocaleString() : String(v)}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                            {k.replace(/_/g, " ")}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <BarChart3 size={40} style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--color-text-muted)" }}>No reports generated yet.</p>
              <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={() => setActiveTab("generate")}>
                Generate First Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
