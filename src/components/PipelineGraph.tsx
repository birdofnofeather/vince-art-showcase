import { useMemo, useState } from "react";
import type { PipelineEdge, PipelineNode } from "@/hooks/useProjectData";

type Props = { nodes: PipelineNode[]; edges: PipelineEdge[] };

const COL_X = [80, 320, 560, 800];
const ROW_Y = [80, 220, 360];

// Hand-tuned layout for the 7 sample nodes; falls back to grid for unknowns.
const FIXED: Record<string, { col: number; row: number }> = {
  news: { col: 0, row: 1 },
  assemble: { col: 1, row: 1 },
  image: { col: 2, row: 1 },
  diary: { col: 3, row: 0 },
  portfolio: { col: 3, row: 2 },
  letters: { col: 3, row: 0 },
  ted: { col: 3, row: 1 },
};

const statusColor = (s?: string) =>
  s === "ok" ? "#9ED69E" : s === "error" ? "#D69E9E" : "#8A8A8A";

const PipelineGraph = ({ nodes, edges }: Props) => {
  const [hover, setHover] = useState<string | null>(null);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    // Place known + spread duplicates
    const usedSlots = new Set<string>();
    nodes.forEach((n, i) => {
      const f = FIXED[n.id];
      let col: number, row: number;
      if (f && !usedSlots.has(`${f.col}-${f.row}`)) {
        col = f.col;
        row = f.row;
      } else {
        col = Math.min(i % COL_X.length, COL_X.length - 1);
        row = Math.floor(i / COL_X.length) % ROW_Y.length;
        while (usedSlots.has(`${col}-${row}`)) {
          row = (row + 1) % ROW_Y.length;
        }
      }
      usedSlots.add(`${col}-${row}`);
      map[n.id] = { x: COL_X[col], y: ROW_Y[row] };
    });
    // Special: stack diary/letters/ted vertically in col 3
    if (map.diary) map.diary = { x: COL_X[3], y: ROW_Y[0] };
    if (map.letters) map.letters = { x: COL_X[3] + 120, y: ROW_Y[0] };
    if (map.ted) map.ted = { x: COL_X[3] + 120, y: ROW_Y[1] };
    if (map.portfolio) map.portfolio = { x: COL_X[3], y: ROW_Y[2] };
    return map;
  }, [nodes]);

  const W = 1000;
  const H = 460;
  const NODE_W = 140;
  const NODE_H = 44;

  const activeNode = nodes.find((n) => n.id === hover);

  return (
    <div className="w-full">
      {/* Desktop / tablet SVG */}
      <div className="hidden md:block relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pipeline diagram">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#444" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const x1 = a.x + NODE_W / 2;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x - 0;
            const y2 = b.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
            return (
              <g key={i}>
                <path d={d} stroke="#2a2a2a" strokeWidth={1} fill="none" markerEnd="url(#arrow)" />
                <path d={d} stroke="#EDEDED" strokeWidth={1} fill="none" strokeDasharray="3 120" strokeDashoffset={0}>
                  <animate attributeName="stroke-dashoffset" from="123" to="0" dur="4s" repeatCount="indefinite" />
                </path>
              </g>
            );
          })}

          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const isHover = hover === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                style={{ cursor: "default" }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  fill={isHover ? "#141414" : "#0A0A0A"}
                  stroke="#222"
                  strokeWidth={1}
                />
                <circle cx={12} cy={NODE_H / 2} r={3} fill={statusColor(n.status)} />
                <text
                  x={24}
                  y={NODE_H / 2 + 4}
                  fill="#EDEDED"
                  fontFamily="'JetBrains Mono', ui-monospace, monospace"
                  fontSize={12}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-3 text-xs font-mono text-[#8A8A8A] min-h-[1.25rem]">
          {activeNode ? (
            <>
              <span className="text-[#EDEDED]">{activeNode.label}</span>
              {"  ·  status: "}{activeNode.status || "—"}
              {activeNode.lastRun ? `  ·  last run: ${activeNode.lastRun}` : ""}
            </>
          ) : (
            "hover a node for status"
          )}
        </div>
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden flex flex-col items-stretch">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex flex-col items-center">
            <div className="w-full max-w-xs border border-[#222] bg-[#0A0A0A] px-3 py-2 flex items-center gap-2 font-mono text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: statusColor(n.status) }}
              />
              <span className="text-[#EDEDED]">{n.label}</span>
              <span className="ml-auto text-[#8A8A8A]">{n.status || "—"}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className="h-6 w-px bg-[#222]" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineGraph;
