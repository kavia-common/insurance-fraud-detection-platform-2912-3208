"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Filter,
  RefreshCw,
  X,
  CheckCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchAssignments,
  createAssignment,
  updateAssignment,
  fetchInvestigators,
  fetchClaims,
} from "@/lib/api";
import type {
  AssignmentResponse,
  AssignmentCreate,
  UserResponse,
  ClaimResponse,
} from "@/lib/api";
import Link from "next/link";

/**
 * Assignments page - manages investigator assignments and work queues.
 * Supports filtering by investigator and status, creating new assignments,
 * and updating assignment status.
 */
export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [investigators, setInvestigators] = useState<UserResponse[]>([]);
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [investigatorFilter, setInvestigatorFilter] = useState("");

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignmentsData, investigatorsData, claimsData] = await Promise.all([
        fetchAssignments({
          status: statusFilter || undefined,
          investigator_id: investigatorFilter || undefined,
          limit: 100,
        }),
        fetchInvestigators(),
        fetchClaims({ limit: 200 }),
      ]);
      setAssignments(assignmentsData);
      setInvestigators(investigatorsData);
      setClaims(claimsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, investigatorFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Create a new assignment */
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: AssignmentCreate = {
      claim_id: formData.get("claim_id") as string,
      investigator_id: formData.get("investigator_id") as string,
      priority: parseInt(formData.get("priority") as string) || 5,
      notes: (formData.get("notes") as string) || null,
    };
    try {
      setCreating(true);
      await createAssignment(data);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  /** Update assignment status */
  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    try {
      await updateAssignment(assignmentId, { status: newStatus });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment");
    }
  };

  /** Get investigator name by ID */
  const getInvestigatorName = (id: string) => {
    const inv = investigators.find((i) => i.id === id);
    return inv ? inv.full_name : id.slice(0, 8);
  };

  /** Get claim number by ID */
  const getClaimNumber = (id: string) => {
    const claim = claims.find((c) => c.id === id);
    return claim ? claim.claim_number : id.slice(0, 8);
  };

  /** Status badge styling */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return "badge-medium";
      case "accepted": case "in_progress": return "badge-info";
      case "completed": return "badge-low";
      case "rejected": return "badge-high";
      default: return "badge-neutral";
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={24} /> Assignments
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Manage investigator assignments and work queues
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Investigator Queue Cards */}
      {investigators.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "12px" }}>Investigator Workloads</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {investigators.map((inv) => (
              <div
                key={inv.id}
                className="stat-card"
                style={{ cursor: "pointer", border: investigatorFilter === inv.id ? "2px solid var(--color-primary)" : undefined }}
                onClick={() => setInvestigatorFilter(investigatorFilter === inv.id ? "" : inv.id)}
              >
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{inv.full_name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  {inv.department || "SIU"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                    {inv.current_caseload || 0}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    / {inv.max_caseload || 20} max
                  </span>
                </div>
                {/* Caseload bar */}
                <div style={{ width: "100%", height: "4px", backgroundColor: "#e5e7eb", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(100, ((inv.current_caseload || 0) / (inv.max_caseload || 20)) * 100)}%`,
                    height: "100%",
                    backgroundColor: (inv.current_caseload || 0) >= (inv.max_caseload || 20) ? "#ef4444" : "#3b82f6",
                    borderRadius: "2px",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-text-muted)" }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "160px" }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={investigatorFilter} onChange={(e) => setInvestigatorFilter(e.target.value)} style={{ width: "200px" }}>
            <option value="">All Investigators</option>
            {investigators.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.full_name}</option>
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

      {/* Assignments Table */}
      {loading ? (
        <LoadingSpinner message="Loading assignments..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Investigator</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
                assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/claims/${a.claim_id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                        {getClaimNumber(a.claim_id)}
                      </Link>
                    </td>
                    <td>{getInvestigatorName(a.investigator_id)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(a.status)}`} style={{ textTransform: "capitalize" }}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: a.priority >= 8 ? "#dc2626" : a.priority >= 5 ? "#d97706" : "#16a34a" }}>
                        {a.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td style={{ maxWidth: "200px", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.notes || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {a.status === "pending" && (
                          <button className="btn btn-success" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => handleStatusUpdate(a.id, "accepted")}>
                            <CheckCircle size={12} /> Accept
                          </button>
                        )}
                        {(a.status === "accepted" || a.status === "in_progress") && (
                          <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => handleStatusUpdate(a.id, "completed")}>
                            <CheckCircle size={12} /> Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                    No assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>New Assignment</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label>Claim *</label>
                  <select name="claim_id" required>
                    <option value="">Select claim</option>
                    {claims.map((c) => (
                      <option key={c.id} value={c.id}>{c.claim_number} - {c.claim_type} (${c.claim_amount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Investigator *</label>
                  <select name="investigator_id" required>
                    <option value="">Select investigator</option>
                    {investigators.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.full_name} ({inv.current_caseload || 0}/{inv.max_caseload || 20})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Priority (1-10)</label>
                  <input type="number" name="priority" min="1" max="10" defaultValue="5" />
                </div>
                <div>
                  <label>Notes</label>
                  <textarea name="notes" rows={3} placeholder="Assignment notes..." />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
