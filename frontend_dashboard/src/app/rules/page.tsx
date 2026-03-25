"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
} from "@/lib/api";
import type { FraudRuleResponse, FraudRuleCreate } from "@/lib/api";

/**
 * Fraud Rules page - manage configurable fraud detection rules.
 * Supports creating, editing, toggling, and deleting rules.
 */
export default function RulesPage() {
  const [rules, setRules] = useState<FraudRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FraudRuleResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRules({
        category: categoryFilter || undefined,
      });
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  /** Create or update a rule */
  const handleSaveRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: FraudRuleCreate = {
      rule_name: formData.get("rule_name") as string,
      description: formData.get("description") as string,
      category: (formData.get("category") as string) || "custom",
      score_weight: parseInt(formData.get("score_weight") as string) || 10,
      is_active: formData.get("is_active") === "true",
    };

    try {
      setSaving(true);
      if (editingRule) {
        await updateRule(editingRule.id, data);
      } else {
        await createRule(data);
      }
      setShowCreateModal(false);
      setEditingRule(null);
      loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  /** Toggle rule active status */
  const handleToggle = async (rule: FraudRuleResponse) => {
    try {
      await updateRule(rule.id, { is_active: !rule.is_active });
      loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  /** Delete a rule */
  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await deleteRule(ruleId);
      loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  /** Category badge color */
  const getCategoryBadge = (category: string) => {
    const map: Record<string, string> = {
      amount: "badge-high",
      frequency: "badge-medium",
      timing: "badge-info",
      location: "badge-low",
      pattern: "badge-neutral",
      network: "badge-info",
      custom: "badge-neutral",
    };
    return map[category] || "badge-neutral";
  };

  const categories = ["amount", "frequency", "timing", "location", "pattern", "network", "custom"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={24} /> Fraud Rules
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Configure fraud detection rules and scoring weights
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingRule(null); setShowCreateModal(true); }}>
          <Plus size={16} /> New Rule
        </button>
      </div>

      {/* Category Filter */}
      <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Category:</span>
          <button
            className={`btn ${!categoryFilter ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "4px 12px", fontSize: "0.75rem" }}
            onClick={() => setCategoryFilter("")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${categoryFilter === cat ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 12px", fontSize: "0.75rem", textTransform: "capitalize" }}
              onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
            >
              {cat}
            </button>
          ))}
          <button className="btn btn-secondary" onClick={loadRules} style={{ padding: "6px", marginLeft: "auto" }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} style={{ color: "#dc2626" }} /></button>
        </div>
      )}

      {/* Rules Grid */}
      {loading ? (
        <LoadingSpinner message="Loading rules..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {rules.length > 0 ? (
            rules.map((rule) => (
              <div key={rule.id} className="card" style={{ opacity: rule.is_active ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{rule.rule_name}</div>
                    <span className={`badge ${getCategoryBadge(rule.category)}`} style={{ textTransform: "capitalize", marginTop: "4px" }}>
                      {rule.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggle(rule)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                    title={rule.is_active ? "Deactivate" : "Activate"}
                  >
                    {rule.is_active ? (
                      <ToggleRight size={24} style={{ color: "#16a34a" }} />
                    ) : (
                      <ToggleLeft size={24} style={{ color: "#94a3b8" }} />
                    )}
                  </button>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
                  {rule.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Weight: </span>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{rule.score_weight}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px" }}
                      onClick={() => { setEditingRule(rule); setShowCreateModal(true); }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "4px 8px" }}
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <Shield size={40} style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--color-text-muted)" }}>No fraud rules configured yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingRule(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                {editingRule ? "Edit Rule" : "New Fraud Rule"}
              </h2>
              <button onClick={() => { setShowCreateModal(false); setEditingRule(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveRule}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label>Rule Name *</label>
                  <input type="text" name="rule_name" required defaultValue={editingRule?.rule_name || ""} placeholder="e.g., High Amount Threshold" />
                </div>
                <div>
                  <label>Description *</label>
                  <textarea name="description" required rows={3} defaultValue={editingRule?.description || ""} placeholder="Describe what this rule detects..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label>Category</label>
                    <select name="category" defaultValue={editingRule?.category || "custom"}>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} style={{ textTransform: "capitalize" }}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Score Weight (0-100)</label>
                    <input type="number" name="score_weight" min="0" max="100" defaultValue={editingRule?.score_weight || 10} />
                  </div>
                </div>
                <div>
                  <label>Active</label>
                  <select name="is_active" defaultValue={String(editingRule?.is_active ?? true)}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setEditingRule(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
