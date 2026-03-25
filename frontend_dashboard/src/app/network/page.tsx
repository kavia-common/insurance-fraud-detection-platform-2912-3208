"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Network,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchNetworkGraph, fetchClaimNetwork } from "@/lib/api";
import type { NetworkGraphResponse, NetworkNodeResponse, NetworkEdgeResponse } from "@/lib/api";

/** Color map for entity types */
const NODE_COLORS: Record<string, string> = {
  claim: "#ef4444",
  policyholder: "#3b82f6",
  policy: "#8b5cf6",
  provider: "#06b6d4",
  address: "#f59e0b",
  phone: "#64748b",
  default: "#94a3b8",
};

/**
 * Network view page - displays entity relationship graph for fraud investigation.
 * Uses a canvas-based force-directed layout to render nodes and edges.
 */
export default function NetworkPage() {
  const [graph, setGraph] = useState<NetworkGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimIdFilter, setClaimIdFilter] = useState("");
  const [selectedNode, setSelectedNode] = useState<NetworkNodeResponse | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: NetworkGraphResponse;
      if (claimIdFilter) {
        data = await fetchClaimNetwork(claimIdFilter);
      } else {
        data = await fetchNetworkGraph(200);
      }
      setGraph(data);
      // Initialize positions using circular layout
      positionsRef.current = new Map();
      const nodeCount = data.nodes.length;
      data.nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / Math.max(nodeCount, 1);
        const radius = 200 + Math.random() * 50;
        positionsRef.current.set(node.id, {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load network");
    } finally {
      setLoading(false);
    }
  }, [claimIdFilter]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  /** Draw the network graph on canvas */
  useEffect(() => {
    if (!graph || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Apply zoom
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);

    // Draw edges
    graph.edges.forEach((edge: NetworkEdgeResponse) => {
      const sourcePos = positionsRef.current.get(edge.source);
      const targetPos = positionsRef.current.get(edge.target);
      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = Math.max(1, (edge.strength || 1) * 1.5);
      ctx.stroke();

      // Edge label
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      ctx.font = "9px system-ui";
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.fillText(edge.relationship_type, midX, midY - 4);
    });

    // Draw nodes
    graph.nodes.forEach((node: NetworkNodeResponse) => {
      const pos = positionsRef.current.get(node.id);
      if (!pos) return;

      const color = NODE_COLORS[node.type] || NODE_COLORS.default;
      const isSelected = selectedNode?.id === node.id;
      const radius = isSelected ? 18 : 14;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      ctx.font = `${isSelected ? "bold " : ""}11px system-ui`;
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.fillText(node.label.slice(0, 20), pos.x, pos.y + radius + 14);
    });

    ctx.restore();
  }, [graph, zoom, selectedNode]);

  /** Handle canvas click to select nodes */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graph || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    let found: NetworkNodeResponse | null = null;
    for (const node of graph.nodes) {
      const pos = positionsRef.current.get(node.id);
      if (!pos) continue;
      const dx = pos.x - x;
      const dy = pos.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        found = node;
        break;
      }
    }
    setSelectedNode(found);
  };

  // Read claim_id from URL search params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cid = urlParams.get("claim_id");
    if (cid) setClaimIdFilter(cid);
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Network size={24} /> Network View
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualize entity relationships and fraud patterns
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
            <ZoomOut size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
            <ZoomIn size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => setZoom(1)}>
            <Maximize2 size={16} />
          </button>
          <button className="btn btn-primary" onClick={loadGraph}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ marginBottom: 0, whiteSpace: "nowrap" }}>Filter by Claim ID:</label>
          <input
            type="text"
            value={claimIdFilter}
            onChange={(e) => setClaimIdFilter(e.target.value)}
            placeholder="Enter claim UUID or leave empty for full graph"
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary" onClick={() => { setClaimIdFilter(""); }}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
          <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading network graph..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
          {/* Canvas */}
          <div className="card" style={{ padding: "8px", overflow: "hidden" }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              style={{ width: "100%", height: "600px", cursor: "pointer", borderRadius: "8px", backgroundColor: "#fafbfc" }}
            />
            {graph && (
              <div style={{ padding: "8px 12px", display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <span>{graph.nodes.length} nodes</span>
                <span>{graph.edges.length} edges</span>
                <span>Zoom: {Math.round(zoom * 100)}%</span>
              </div>
            )}
          </div>

          {/* Sidebar - Legend & Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Legend */}
            <div className="card">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>Legend</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(NODE_COLORS).filter(([k]) => k !== "default").map(([type, color]) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color }} />
                    <span style={{ fontSize: "0.8125rem", textTransform: "capitalize" }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="card">
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>Selected Entity</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Label</div>
                    <div style={{ fontWeight: 500 }}>{selectedNode.label}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Type</div>
                    <span className={`badge ${selectedNode.type === "claim" ? "badge-high" : "badge-info"}`} style={{ textTransform: "capitalize" }}>
                      {selectedNode.type}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ID</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {selectedNode.id}
                    </div>
                  </div>
                  {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Metadata</div>
                      <pre style={{ fontSize: "0.6875rem", background: "#f1f5f9", padding: "8px", borderRadius: "6px", overflow: "auto", maxHeight: "120px" }}>
                        {JSON.stringify(selectedNode.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nodes List */}
            {graph && graph.nodes.length > 0 && (
              <div className="card" style={{ maxHeight: "300px", overflowY: "auto" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>
                  Entities ({graph.nodes.length})
                </h3>
                {graph.nodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      marginBottom: "4px",
                      backgroundColor: selectedNode?.id === node.id ? "rgba(59,130,246,0.08)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: NODE_COLORS[node.type] || NODE_COLORS.default, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {node.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
