"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Network,
  Users,
} from "lucide-react";
import FraudScoreBadge from "@/components/FraudScoreBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchClaim,
  fetchClaimSignals,
  rescoreClaim,
  fetchClaimNetwork,
} from "@/lib/api";
import type {
  ClaimResponse,
  FraudSignalResponse,
  NetworkGraphResponse,
} from "@/lib/api";

/**
 * Claim detail page - shows full claim info, fraud score with triggered signals,
 * network relationships, and action buttons for re-scoring and assignment.
 */
export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [signals, setSignals] = useState<FraudSignalResponse[]>([]);
  const [network, setNetwork] = useState<NetworkGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "signals" | "network">("details");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimData, signalsData, networkData] = await Promise.all([
        fetchClaim(claimId),
        fetchClaimSignals(claimId),
        fetchClaimNetwork(claimId),
      ]);
      setClaim(claimData);
      setSignals(signalsData);
      setNetwork(networkData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claim details");
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Handle fraud re-scoring */
  const handleRescore = async () => {
    try {
      setRescoring(true);
      await rescoreClaim(claimId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-scoring failed");
    } finally {
      setRescoring(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading claim details..." />;

  if (error || !claim) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px" }}>
        <AlertTriangle size={40} style={{ color: "var(--color-error)", margin: "0 auto 12px" }} />
        <h3 style={{ marginBottom: "8px" }}>Error loading claim</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>{error || "Claim not found"}</p>
        <button className="btn btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const triggeredSignals = signals.filter((s) => s.triggered);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <button
            onClick={() => router.push("/claims")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "var(--color-text-muted)", fontSize: "0.8125rem", marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Back to Claims
          </button>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={24} />
            {claim.claim_number}
            <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
              {(claim.status || "new").replace(/_/g, " ")}
            </span>
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {claim.claim_type} Claim · Filed {claim.filed_date || claim.incident_date}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={handleRescore} disabled={rescoring}>
            <RefreshCw size={16} className={rescoring ? "spinning" : ""} />
            {rescoring ? "Scoring..." : "Re-Score"}
          </button>
          <Link href={`/assignments?claim_id=${claim.id}`} className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Users size={16} /> Assign
          </Link>
        </div>
      </div>

      {/* Fraud Score Banner */}
      <div
        className="card"
        style={{
          marginBottom: "20px",
          background: claim.fraud_score >= 70
            ? "linear-gradient(135deg, rgba(239,68,68,0.05), white)"
            : claim.fraud_score >= 40
              ? "linear-gradient(135deg, rgba(245,158,11,0.05), white)"
              : "linear-gradient(135deg, rgba(34,197,94,0.05), white)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              Fraud Risk Score
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-text)" }}>
                {claim.fraud_score}
              </span>
              <FraudScoreBadge score={claim.fraud_score} riskLevel={claim.risk_level} showScore={false} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {triggeredSignals.length} of {signals.length} signals triggered
            </div>
            {/* Score bar */}
            <div style={{ width: "200px", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", marginTop: "8px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${claim.fraud_score}%`,
                  height: "100%",
                  borderRadius: "4px",
                  backgroundColor: claim.fraud_score >= 70 ? "#ef4444" : claim.fraud_score >= 40 ? "#f59e0b" : "#22c55e",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid var(--color-border)" }}>
        {(["details", "signals", "network"] as const).map((tab) => (
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
            {tab === "signals" ? `Signals (${signals.length})` : tab === "network" ? "Network View" : "Claim Details"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="card">
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px" }}>Claim Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <DetailRow icon={FileText} label="Claim Number" value={claim.claim_number} />
              <DetailRow icon={FileText} label="Type" value={claim.claim_type} />
              <DetailRow icon={DollarSign} label="Amount" value={`$${claim.claim_amount.toLocaleString()}`} />
              <DetailRow icon={Calendar} label="Incident Date" value={claim.incident_date} />
              <DetailRow icon={Calendar} label="Filed Date" value={claim.filed_date || "N/A"} />
              <DetailRow icon={MapPin} label="Location" value={claim.location || "N/A"} />
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px" }}>Additional Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <DetailRow
                icon={Shield}
                label="Police Report"
                value={claim.police_report_filed ? `Yes (${claim.police_report_number || "No #"})` : "No"}
              />
              <DetailRow icon={Users} label="Witnesses" value={String(claim.witnesses || 0)} />
              <DetailRow icon={FileText} label="Ingestion Source" value={claim.ingestion_source || "manual"} />
              <DetailRow icon={Calendar} label="Created" value={claim.created_at || "N/A"} />
            </div>
            {claim.description && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                  Description
                </div>
                <p style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>{claim.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "signals" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Score</th>
                <th>Explanation</th>
                <th>Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {signals.length > 0 ? (
                signals.map((signal) => (
                  <tr key={signal.id}>
                    <td>
                      {signal.triggered ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626" }}>
                          <XCircle size={16} /> Triggered
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a" }}>
                          <CheckCircle size={16} /> Passed
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>+{signal.signal_score}</span>
                    </td>
                    <td style={{ maxWidth: "400px" }}>
                      <span style={{ fontSize: "0.875rem" }}>{signal.explanation || "No explanation"}</span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      {signal.evaluated_at || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                    No fraud signals evaluated yet. Click &quot;Re-Score&quot; to evaluate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "network" && (
        <div className="card">
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Network size={16} />
            Relationship Network
          </h3>
          {network && (network.nodes.length > 0 || network.edges.length > 0) ? (
            <div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <span className="badge badge-info">{network.nodes.length} Entities</span>
                <span className="badge badge-neutral">{network.edges.length} Relationships</span>
              </div>
              {/* Simple network visualization */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-muted)" }}>Entities</h4>
                  {network.nodes.map((node) => (
                    <div key={node.id} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`badge ${node.type === "claim" ? "badge-high" : node.type === "policyholder" ? "badge-info" : "badge-neutral"}`}>
                        {node.type}
                      </span>
                      <span style={{ fontSize: "0.875rem" }}>{node.label}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-muted)" }}>Relationships</h4>
                  {network.edges.map((edge) => (
                    <div key={edge.id} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "6px", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--color-primary)" }}>{edge.source_type}</span>
                      {" → "}
                      <span className="badge badge-neutral">{edge.relationship_type}</span>
                      {" → "}
                      <span style={{ color: "var(--color-primary)" }}>{edge.target_type}</span>
                      {edge.strength && edge.strength !== 1 && (
                        <span style={{ color: "var(--color-text-muted)", marginLeft: "8px" }}>
                          (strength: {edge.strength})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "40px" }}>
              No network relationships found for this claim.
            </p>
          )}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <Link href={`/network?claim_id=${claim.id}`} className="btn btn-secondary" style={{ textDecoration: "none" }}>
              <Network size={16} /> View Full Network
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper component for rendering labeled detail rows with icons.
 */
function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number }>; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Icon size={15} />
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{label}</div>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
