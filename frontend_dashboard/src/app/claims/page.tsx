"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import FraudScoreBadge from "@/components/FraudScoreBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchClaims,
  uploadClaimsCSV,
  createClaim,
  rescoreClaim,
} from "@/lib/api";
import type { ClaimResponse, ClaimCreate, CSVUploadResponse } from "@/lib/api";

/**
 * Claims list page - displays all claims in a searchable, filterable table.
 * Supports CSV upload, manual claim entry via modal forms, and per-row
 * Score/Re-score buttons that call the backend scoring endpoint and
 * refresh the displayed fraud_score immediately.
 */
export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  // Scoring state: track claim IDs currently being scored
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchClaims({
        status: statusFilter || undefined,
        risk_level: riskFilter || undefined,
        search: searchTerm || undefined,
        limit: 100,
      });
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, riskFilter, searchTerm]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  /** Handle CSV file upload */
  const handleCSVUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadClaimsCSV(file);
      setUploadResult(result);
      loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV upload failed");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle scoring/re-scoring a single claim.
   * Calls POST /api/claims/{id}/score then refreshes the claims list so the
   * updated fraud_score is immediately visible in the table.
   */
  const handleScoreClaim = async (claimId: string) => {
    try {
      setScoringIds((prev) => new Set(prev).add(claimId));
      await rescoreClaim(claimId);
      await loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score claim");
    } finally {
      setScoringIds((prev) => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  /**
   * Handle manual claim creation.
   * Reads all form fields including claimant_name, claimant_address,
   * policy_number, and third_parties fields.
   */
  const handleCreateClaim = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: ClaimCreate = {
      claim_number: formData.get("claim_number") as string,
      claim_type: formData.get("claim_type") as string,
      claim_amount: parseFloat(formData.get("claim_amount") as string),
      incident_date: formData.get("incident_date") as string,
      claimant_name: (formData.get("claimant_name") as string) || null,
      claimant_address: (formData.get("claimant_address") as string) || null,
      policy_number: (formData.get("policy_number") as string) || null,
      description: (formData.get("description") as string) || null,
      location: (formData.get("location") as string) || null,
      police_report_filed: formData.get("police_report_filed") === "true",
      witnesses: parseInt(formData.get("witnesses") as string) || 0,
      third_parties: (formData.get("third_parties") as string) || null,
    };

    try {
      setCreating(true);
      await createClaim(data);
      setShowCreateModal(false);
      loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={24} />
            Claims
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Manage and review insurance claims
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> Upload CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Claim
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "200px" }}>
            <Search size={16} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={16} style={{ color: "var(--color-text-muted)" }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "150px" }}>
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ width: "150px" }}>
            <option value="">All Risk</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="btn btn-secondary" onClick={loadClaims} style={{ padding: "8px" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={16} style={{ color: "#dc2626" }} />
          </button>
        </div>
      )}

      {/* Claims Table */}
      {loading ? (
        <LoadingSpinner message="Loading claims..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Claimant</th>
                  <th>Policy #</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Fraud Score</th>
                  <th>Status</th>
                  <th>Incident Date</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link
                          href={`/claims/${claim.id}`}
                          style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                        >
                          {claim.claim_number}
                        </Link>
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {claim.claimant_name || "—"}
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {claim.policy_number || "—"}
                      </td>
                      <td>{claim.claim_type}</td>
                      <td style={{ fontWeight: 500 }}>${claim.claim_amount.toLocaleString()}</td>
                      <td>
                        <FraudScoreBadge score={claim.fraud_score} riskLevel={claim.risk_level} />
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                          {(claim.status || "new").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                        {claim.incident_date}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{claim.ingestion_source || "manual"}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                          disabled={scoringIds.has(claim.id)}
                          onClick={() => handleScoreClaim(claim.id)}
                          title={
                            claim.fraud_score > 0
                              ? "Re-score this claim against all active fraud rules"
                              : "Score this claim against all active fraud rules"
                          }
                        >
                          <RefreshCw
                            size={12}
                            className={scoringIds.has(claim.id) ? "spinning" : ""}
                          />
                          {scoringIds.has(claim.id)
                            ? "Scoring..."
                            : claim.fraud_score > 0
                              ? "Re-score"
                              : "Score"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                      No claims found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); setUploadResult(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Upload Claims CSV</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadResult(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {uploadResult ? (
              <div>
                <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "16px" }}>
                  <p style={{ fontWeight: 600, color: "#16a34a" }}>Upload Complete</p>
                  <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                    Total rows: {uploadResult.total_rows} | Ingested: {uploadResult.successfully_ingested} | Failed: {uploadResult.failed_rows}
                  </p>
                </div>
                {uploadResult.errors.length > 0 && (
                  <div style={{ padding: "12px", background: "#fef2f2", borderRadius: "8px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "0.875rem" }}>Errors:</p>
                    {uploadResult.errors.map((err, i) => (
                      <p key={i} style={{ fontSize: "0.8125rem", color: "#dc2626" }}>{JSON.stringify(err)}</p>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary" onClick={() => { setShowUploadModal(false); setUploadResult(null); }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCSVUpload}>
                <div style={{ marginBottom: "16px" }}>
                  <label>CSV File</label>
                  <input type="file" name="file" accept=".csv" required />
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                    Expected columns: claim_number, claimant_name, claimant_address, policy_number,
                    claim_type, claim_amount, incident_date, description, location,
                    police_report_filed, witnesses, third_parties
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    Optional columns: policy_id, policyholder_id, police_report_number, filed_date
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Claim Modal – includes fields: claimant_name, claimant_address, policy_number, third_parties */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>New Claim</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClaim}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Row 1: Claim Number, Claim Type */}
                <div>
                  <label>Claim Number *</label>
                  <input type="text" name="claim_number" required placeholder="CLM-001" />
                </div>
                <div>
                  <label>Claim Type *</label>
                  <select name="claim_type" required>
                    <option value="">Select type</option>
                    <option value="Collision">Collision</option>
                    <option value="Theft">Theft</option>
                    <option value="Property">Property</option>
                    <option value="Liability">Liability</option>
                    <option value="Medical">Medical</option>
                    <option value="Fire">Fire</option>
                    <option value="Water Damage">Water Damage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Row 2: Claimant Name, Policy Number */}
                <div>
                  <label>Claimant Name</label>
                  <input type="text" name="claimant_name" placeholder="Full name of claimant" />
                </div>
                <div>
                  <label>Policy Number</label>
                  <input type="text" name="policy_number" placeholder="POL-12345" />
                </div>

                {/* Row 3: Claimant Address (full width) */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Claimant Address</label>
                  <input type="text" name="claimant_address" placeholder="123 Main St, City, State, ZIP" />
                </div>

                {/* Row 4: Claim Amount, Incident Date */}
                <div>
                  <label>Claim Amount ($) *</label>
                  <input type="number" name="claim_amount" required min="0" step="0.01" placeholder="10000" />
                </div>
                <div>
                  <label>Incident Date *</label>
                  <input type="date" name="incident_date" required />
                </div>

                {/* Row 5: Description (full width) */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Description</label>
                  <textarea name="description" rows={3} placeholder="Describe the incident..." />
                </div>

                {/* Row 6: Location, Witnesses */}
                <div>
                  <label>Location</label>
                  <input type="text" name="location" placeholder="City, State" />
                </div>
                <div>
                  <label>Witnesses</label>
                  <input type="number" name="witnesses" min="0" defaultValue="0" />
                </div>

                {/* Row 7: Police Report, Third Parties */}
                <div>
                  <label>Police Report Filed</label>
                  <select name="police_report_filed">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label>Third Parties</label>
                  <input type="text" name="third_parties" placeholder="e.g., John Doe, ABC Corp" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
