"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchOutcomes,
  createOutcome,
  fetchClaims,
  fetchInvestigators,
} from "@/lib/api";
import type {
  OutcomeResponse,
  OutcomeCreate,
  ClaimResponse,
  UserResponse,
} from "@/lib/api";

const OUTCOME_TYPES = [
  { value: "confirmed_fraud", label: "Confirmed Fraud", badge: "badge-high" },
  { value: "legitimate", label: "Legitimate", badge: "badge-low" },
  { value: "insufficient_evidence", label: "Insufficient Evidence", badge: "badge-medium" },
  { value: "referred_to_law_enforcement", label: "Referred to Law Enforcement", badge: "badge-info" },
  { value: "pending", label: "Pending", badge: "badge-neutral" },
];

/**
 * Outcomes page - log and review fraud investigation outcomes.
 * Supports creating new outcomes and filtering by type or investigator.
 */
export default function OutcomesPage() {
  const [outcomes, setOutcomes] = useState<OutcomeResponse[]>([]);
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [investigators, setInvestigators] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [outcomesData, claimsData, investigatorsData] = await Promise.all([
        fetchOutcomes({ outcome: outcomeFilter || undefined, limit: 100 }),
        fetchClaims({ limit: 200 }),
        fetchInvestigators(),
      ]);
      setOutcomes(outcomesData);
      setClaims(claimsData);
      setInvestigators(investigatorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outcomes");
    } finally {
      setLoading(false);
    }
  }, [outcomeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getClaimNumber = (id: string) => claims.find((c) => c.id === id)?.claim_number || id.slice(0, 8);
  const getInvestigatorName = (id: string) => investigators.find((i) => i.id === id)?.full_name || id.slice(0, 8);
  const getOutcomeBadge = (outcome: string) => OUTCOME_TYPES.find((o) => o.value === outcome)?.badge || "badge-neutral";
  const getOutcomeLabel = (outcome: string) => OUTCOME_TYPES.find((o) => o.value === outcome)?.label || outcome;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: OutcomeCreate = {
      claim_id: fd.get("claim_id") as string,
      investigator_id: fd.get("investigator_id") as string,
      outcome: fd.get("outcome") as string,
      recovery_amount: parseFloat(fd.get("recovery_amount") as string) || 0,
      summary: (fd.get("summary") as string) || null,
      evidence_notes: (fd.get("evidence_notes") as string) || null,
      resolution_date: (fd.get("resolution_date") as string) || null,
    };
    try {
      setCreating(true);
      await createOutcome(data);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create outcome");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardCheck size={24} /> Outcomes
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Log and review investigation outcomes
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Log Outcome
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-text-muted)" }} />
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} style={{ width: "220px" }}>
            <option value="">All Outcomes</option>
            {OUTCOME_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={loadData} style={{ padding: "8px" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} style={{ color: "#dc2626" }} /></button>
        </div>
      )}

      {/* Outcomes Table */}
      {loading ? (
        <LoadingSpinner message="Loading outcomes..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Investigator</th>
                <th>Outcome</th>
                <th>Recovery</th>
                <th>Resolution Date</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.length > 0 ? (
                outcomes.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/claims/${o.claim_id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                        {getClaimNumber(o.claim_id)}
                      </Link>
                    </td>
                    <td>{getInvestigatorName(o.investigator_id)}</td>
                    <td>
                      <span className={`badge ${getOutcomeBadge(o.outcome)}`}>
                        {getOutcomeLabel(o.outcome)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {o.recovery_amount ? `$${o.recovery_amount.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      {o.resolution_date || "N/A"}
                    </td>
                    <td style={{ maxWidth: "250px", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.summary || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                    No outcomes recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Outcome Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Log Investigation Outcome</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label>Claim *</label>
                  <select name="claim_id" required>
                    <option value="">Select claim</option>
                    {claims.map((c) => (
                      <option key={c.id} value={c.id}>{c.claim_number} - {c.claim_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Investigator *</label>
                  <select name="investigator_id" required>
                    <option value="">Select investigator</option>
                    {investigators.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Outcome *</label>
                  <select name="outcome" required>
                    <option value="">Select outcome</option>
                    {OUTCOME_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label>Recovery Amount ($)</label>
                    <input type="number" name="recovery_amount" min="0" step="0.01" defaultValue="0" />
                  </div>
                  <div>
                    <label>Resolution Date</label>
                    <input type="date" name="resolution_date" />
                  </div>
                </div>
                <div>
                  <label>Summary</label>
                  <textarea name="summary" rows={3} placeholder="Summary of findings..." />
                </div>
                <div>
                  <label>Evidence Notes</label>
                  <textarea name="evidence_notes" rows={3} placeholder="Evidence and documentation details..." />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Saving..." : "Log Outcome"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
