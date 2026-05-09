"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import AppShell from "../components/AppShell";
import { useTheme } from "../ThemeContext";
import { CenterNode, ClauseNode, DetailNode } from "./CustomNodes";

type Clause = {
  clause: string;
  risk_level: "FAIR" | "RISKY" | "ILLEGAL";
  explanation: string;
  law_reference: string;
};

type Result = {
  risk_score: number;
  clauses: Clause[];
};

const riskColors = {
  FAIR: "#22c55e",
  RISKY: "#f59e0b",
  ILLEGAL: "#ef4444",
};

const nodeTypes = {
  center: CenterNode,
  clause: ClauseNode,
  detail: DetailNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    // approximate dimensions
    let width = 160;
    let height = 80;
    if (node.type === "center") {
      width = 130;
      height = 130;
    } else if (node.type === "detail") {
      width = 260;
      height = 100;
    }
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - (node.type === "center" ? 65 : node.type === "detail" ? 130 : 80),
        y: nodeWithPosition.y - (node.type === "center" ? 65 : node.type === "detail" ? 50 : 40),
      },
    };
    return newNode as Node;
  });

  return { nodes: newNodes, edges };
};

export default function Visualizer() {
  const [result, setResult] = useState<Result | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // History state for Undo/Redo
  const [past, setPast] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [future, setFuture] = useState<{nodes: Node[], edges: Edge[]}[]>([]);

  const router = useRouter();
  const { colors, theme } = useTheme();

  const pushHistory = useCallback(() => {
    setPast((p) => [...p, { nodes, edges }].slice(-50));
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [ { nodes, edges }, ...f ]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  const handleResetLayout = useCallback(() => {
    pushHistory();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges, pushHistory]);

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    if (!stored) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(stored);
    setResult(parsed);
    
    // Build initial graph
    const initialNodes: Node[] = [
      {
        id: "center",
        type: "center",
        data: { label: "Employment Contract" },
        position: { x: 0, y: 0 },
      },
    ];
    
    const initialEdges: Edge[] = [];
    
    parsed.clauses.forEach((c: Clause, i: number) => {
      const cId = `clause-${i}`;
      initialNodes.push({
        id: cId,
        type: "clause",
        data: {
          label: `Clause ${i + 1}`,
          riskLevel: c.risk_level,
          color: riskColors[c.risk_level],
          clauseData: c,
          expanded: false
        },
        position: { x: 0, y: 0 },
      });
      
      initialEdges.push({
        id: `e-center-${cId}`,
        source: "center",
        target: cId,
        type: "smoothstep",
        animated: true,
        style: { stroke: riskColors[c.risk_level], strokeWidth: 2 },
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [router, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type !== "clause") return;

    pushHistory();

    setNodes((nds) => {
      const isExpanded = node.data.expanded;
      let newNodes = [...nds];
      let newEdges = [...edges];

      if (isExpanded) {
        // Collapse: remove detail nodes and edges
        newNodes = newNodes.filter((n) => !n.id.startsWith(`detail-${node.id}`));
        newEdges = newEdges.filter((e) => !e.target.startsWith(`detail-${node.id}`));
        
        // Update expanded state
        newNodes = newNodes.map((n) => 
          n.id === node.id ? { ...n, data: { ...n.data, expanded: false } } : n
        );
      } else {
        // Expand: add detail nodes relative to clicked node's position
        const c = node.data.clauseData as Clause;
        const details = [
          { type: "Explanation", text: c.explanation },
          { type: "Law", text: c.law_reference && c.law_reference !== "None" ? c.law_reference : "No specific law cited" }
        ];

        details.forEach((d, i) => {
          const dId = `detail-${node.id}-${i}`;
          newNodes.push({
            id: dId,
            type: "detail",
            data: { type: d.type, label: d.text },
            // Spawn below the node, offset left and right
            position: { x: node.position.x + (i === 0 ? -140 : 140), y: node.position.y + 120 },
          });

          newEdges.push({
            id: `e-${node.id}-${dId}`,
            source: node.id,
            target: dId,
            type: "smoothstep",
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: node.data.color as string },
            style: { stroke: node.data.color as string, strokeWidth: 1.5 },
          });
        });

        // Update expanded state
        newNodes = newNodes.map((n) => 
          n.id === node.id ? { ...n, data: { ...n.data, expanded: true } } : n
        );
      }

      setEdges(newEdges);
      return newNodes;
    });
  }, [edges, setEdges, setNodes, pushHistory]);

  if (!result) return null;

  return (
    <AppShell>
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, background: colors.bgCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textHeading, letterSpacing: 2, fontFamily: "monospace", margin: 0 }}>VISUALIZER</h1>
            <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, margin: 0 }}>Interactive Contract Node Graph</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary }}><span style={{ color: riskColors.FAIR }}>●</span> FAIR</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary }}><span style={{ color: riskColors.RISKY }}>●</span> RISKY</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary }}><span style={{ color: riskColors.ILLEGAL }}>●</span> ILLEGAL</div>
          </div>
        </div>
        <div style={{ flex: 1, background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={() => pushHistory()}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
          >
            <Background color={colors.border} gap={16} />
            <MiniMap nodeStrokeColor={(n) => n.data.color as string || colors.border} nodeColor={(n) => n.type === 'center' ? colors.accent : n.type === 'detail' ? colors.bgInput : colors.bgCard} maskColor={theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)'} style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }} />
            
            {/* Custom Zoom Controls */}
            <Panel position="bottom-left" style={{ display: 'flex', gap: 8, margin: 16 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : colors.bgCard,
                border: `1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : colors.borderHover}`,
                borderRadius: 12,
                padding: 8,
                boxShadow: theme === 'dark' 
                  ? '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.1)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
              }}>
                <button
                  onClick={() => {
                    const button = document.querySelector('[data-reactflow-zoom-in]') as HTMLButtonElement;
                    button?.click();
                  }}
                  title="Zoom in"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: `1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.4)' : colors.borderHover}`,
                    background: theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.15)' 
                      : 'rgba(99, 102, 241, 0.05)',
                    color: theme === 'dark' ? '#e0e7ff' : colors.accent,
                    cursor: 'pointer',
                    fontSize: 18,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: theme === 'dark'
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 2px 6px rgba(99, 102, 241, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.35)' 
                      : 'rgba(99, 102, 241, 0.1)';
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                    (e.target as HTMLElement).style.boxShadow = theme === 'dark'
                      ? '0 6px 16px rgba(99, 102, 241, 0.5)'
                      : '0 4px 10px rgba(99, 102, 241, 0.1)';
                    (e.target as HTMLElement).style.color = theme === 'dark' ? '#ffffff' : colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.15)' 
                      : 'rgba(99, 102, 241, 0.05)';
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                    (e.target as HTMLElement).style.boxShadow = theme === 'dark'
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 2px 6px rgba(99, 102, 241, 0.05)';
                    (e.target as HTMLElement).style.color = theme === 'dark' ? '#e0e7ff' : colors.accent;
                  }}
                >
                  +
                </button>
                <div style={{
                  width: '100%',
                  height: 1,
                  background: theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : colors.border,
                }} />
                <button
                  onClick={() => {
                    const button = document.querySelector('[data-reactflow-zoom-out]') as HTMLButtonElement;
                    button?.click();
                  }}
                  title="Zoom out"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: `1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.4)' : colors.borderHover}`,
                    background: theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.15)' 
                      : 'rgba(99, 102, 241, 0.05)',
                    color: theme === 'dark' ? '#e0e7ff' : colors.accent,
                    cursor: 'pointer',
                    fontSize: 20,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: theme === 'dark'
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 2px 6px rgba(99, 102, 241, 0.05)',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.35)' 
                      : 'rgba(99, 102, 241, 0.1)';
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                    (e.target as HTMLElement).style.boxShadow = theme === 'dark'
                      ? '0 6px 16px rgba(99, 102, 241, 0.5)'
                      : '0 4px 10px rgba(99, 102, 241, 0.1)';
                    (e.target as HTMLElement).style.color = theme === 'dark' ? '#ffffff' : colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = theme === 'dark' 
                      ? 'rgba(99, 102, 241, 0.15)' 
                      : 'rgba(99, 102, 241, 0.05)';
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                    (e.target as HTMLElement).style.boxShadow = theme === 'dark'
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 2px 6px rgba(99, 102, 241, 0.05)';
                    (e.target as HTMLElement).style.color = theme === 'dark' ? '#e0e7ff' : colors.accent;
                  }}
                >
                  −
                </button>
              </div>
              <button 
                onClick={undo} 
                disabled={past.length === 0} 
                style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', color: past.length === 0 ? colors.textMuted : colors.textPrimary, cursor: past.length === 0 ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}>
                ↩️ Undo
              </button>
              <button 
                onClick={redo} 
                disabled={future.length === 0} 
                style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', color: future.length === 0 ? colors.textMuted : colors.textPrimary, cursor: future.length === 0 ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}>
                ↪️ Redo
              </button>
              <button 
                onClick={handleResetLayout} 
                style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', color: colors.textPrimary, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', marginLeft: 8 }}>
                🔄 Reset Layout
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </AppShell>
  );
}
