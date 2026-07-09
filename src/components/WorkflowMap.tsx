import { useMemo, useState } from "react";

/**
 * WorkflowMap — an interactive map of how the DeYaanga system actually works.
 *
 * It is intentionally self-contained: the topology here is editorial documentation
 * of the architecture (every moving piece, every decision point), not live status.
 * Live run status lives in the Activity section of the Atelier page.
 *
 * The map distinguishes the two things that make this project legible:
 *   deterministic nodes — code and rules, identical output every run
 *   stochastic nodes    — model / LLM judgement, different every run
 * plus gates (decisions + approvals), external services, data stores, and outputs.
 */

type Agent = "vince" | "ted";

type Kind =
  | "deterministic"
  | "stochastic"
  | "human"
  | "external"
  | "store"
  | "output";

type Svc =
  | "guardian"
  | "anthropic"
  | "fal"
  | "github"
  | "openrouter"
  | "gmail"
  | "zernio"
  | "fxhash"
  | "web"
  | "instagram";

type WNode = {
  id: string;
  label: string;
  kind: Kind;
  lane: number;
  order: number;
  gate?: boolean;
  blurb: string;
  inputs?: string[];
  outputs?: string[];
  services?: Svc[];
  note?: string;
};

type WEdge = { from: string; to: string };

const KIND_COLOR: Record<Kind, string> = {
  deterministic: "#8FB8A8",
  stochastic: "#E0B563",
  human: "#D98E8E",
  external: "#7FA6C9",
  store: "#6E6E6E",
  output: "#EDEDED",
};

const KIND_LABEL: Record<Kind, string> = {
  deterministic: "Deterministic",
  stochastic: "Stochastic",
  human: "Human approval",
  external: "External service",
  store: "Data store",
  output: "Published output",
};

const SVC_LABEL: Record<Svc, string> = {
  guardian: "Guardian API",
  anthropic: "Anthropic · Claude",
  fal: "fal.ai",
  github: "GitHub",
  openrouter: "OpenRouter",
  gmail: "Gmail",
  zernio: "Zernio",
  fxhash: "fxhash",
  web: "Web",
  instagram: "Instagram",
};

/* ------------------------------------------------------------------ data --- */

const VINCE_LANES = [
  "Source",
  "Intake",
  "Selection + scene",
  "Image generation",
  "Record",
  "Publish",
];

const VINCE_NODES: WNode[] = [
  {
    id: "guardian",
    label: "Guardian world feed",
    kind: "external",
    lane: 0,
    order: 0,
    blurb: "Two pages of world-section stories, the raw material for the day.",
    outputs: ["~50 candidate stories"],
    services: ["guardian"],
  },
  {
    id: "fetch",
    label: "fetch_news",
    kind: "deterministic",
    lane: 1,
    order: 0,
    blurb: "Harvests and noise-filters the feed, then marks recently covered topics.",
    inputs: ["Guardian feed", "covered-stories.md"],
    outputs: ["digest/raw-DATE.json"],
    services: ["guardian"],
    note: "Pure rules: a blacklist filter and a 7-day silence check. Same input, same result.",
  },
  {
    id: "digest",
    label: "story digest",
    kind: "store",
    lane: 1,
    order: 1,
    blurb: "The filtered story set written to disk for the day.",
    inputs: ["fetch_news"],
    outputs: ["read by assemble"],
  },
  {
    id: "preocc",
    label: "preoccupations + style",
    kind: "store",
    lane: 1,
    order: 2,
    blurb: "Vince's standing artistic biases and the evolving formal language.",
    outputs: ["biases scene + refine"],
    note: "preoccupations.md and style-state.json. Both fall back to in-code defaults if absent.",
  },
  {
    id: "rank",
    label: "story rank",
    kind: "stochastic",
    lane: 2,
    order: 0,
    blurb: "Claude weighs ~20 candidates for human significance and emotional weight.",
    inputs: ["story digest", "covered-stories.md"],
    outputs: ["one chosen story"],
    services: ["anthropic"],
    note: "An opinion under criteria, not a sort. Re-run and it may choose differently.",
  },
  {
    id: "anchor",
    label: "visual anchor",
    kind: "stochastic",
    lane: 2,
    order: 1,
    blurb: "Reduces the story to one irreducible tension plus a field of concrete materials.",
    inputs: ["chosen story"],
    outputs: ["anchor: irreducible + symbolField"],
    services: ["anthropic"],
  },
  {
    id: "scenes",
    label: "divergent scenes ×3",
    kind: "stochastic",
    lane: 2,
    order: 2,
    blurb: "Three genuinely different compositions from the same anchor. Metabolize, never illustrate.",
    inputs: ["anchor", "preoccupations + style", "last 5 works"],
    outputs: ["3 scene texts"],
    services: ["anthropic"],
  },
  {
    id: "blind",
    label: "blind reverse test",
    kind: "stochastic",
    lane: 2,
    order: 3,
    blurb: "A blind reader guesses the news event from the scene text alone.",
    inputs: ["scene text only"],
    outputs: ["eventGuess + literal read"],
    services: ["anthropic"],
    note: "Tests whether the link lives in the image or only in the maker's head.",
  },
  {
    id: "critique",
    label: "critique gate",
    kind: "stochastic",
    gate: true,
    lane: 2,
    order: 4,
    blurb: "Scores traceability 1–5 and flags imported symbols. Passes if score ≥ 3 and no import.",
    inputs: ["scene", "real story", "blind guess"],
    outputs: ["primary scene", "regen feedback"],
    services: ["anthropic"],
    note: "LLM judgement (stochastic) wrapped in a hard rule (deterministic). Fails regenerate up to twice.",
  },
  {
    id: "drafts",
    label: "divergence drafts ×3",
    kind: "stochastic",
    lane: 3,
    order: 0,
    blurb: "Each surviving scene is drafted cheaply at low resolution.",
    inputs: ["primary + divergent scenes"],
    outputs: ["3 draft images"],
    services: ["fal", "anthropic"],
  },
  {
    id: "converge",
    label: "convergence select",
    kind: "stochastic",
    gate: true,
    lane: 3,
    order: 1,
    blurb: "Claude picks the draft with the most potential — an accident worth building on, not the most polished.",
    inputs: ["3 drafts + analysis"],
    outputs: ["chosen draft"],
    services: ["anthropic"],
  },
  {
    id: "refine",
    label: "convergence refine",
    kind: "stochastic",
    lane: 3,
    order: 2,
    blurb: "Develops the chosen draft at full resolution via image-to-image, up to three passes.",
    inputs: ["chosen draft", "revised scene"],
    outputs: ["refined image"],
    services: ["fal", "anthropic"],
  },
  {
    id: "vision",
    label: "vision analysis",
    kind: "stochastic",
    lane: 3,
    order: 3,
    blurb: "Reads each render: what is observed, what accident appeared, what to revise.",
    inputs: ["rendered image"],
    outputs: ["analysis + accident + revision"],
    services: ["anthropic"],
  },
  {
    id: "accident",
    label: "accident gate",
    kind: "stochastic",
    gate: true,
    lane: 3,
    order: 4,
    blurb: "If an accident keeps the story traceable, lean in; if it drifts below score 3, pull back.",
    inputs: ["accident", "trace score"],
    outputs: ["revision direction"],
    services: ["anthropic"],
    note: "The bridge between intention and discovery. Threshold is a rule; the score it reads is stochastic.",
  },
  {
    id: "select",
    label: "final select + title",
    kind: "stochastic",
    lane: 3,
    order: 5,
    blurb: "Comparative review picks the strongest frame, then names it in two to five words.",
    inputs: ["all iterations"],
    outputs: ["winner + title + note"],
    services: ["anthropic"],
  },
  {
    id: "artworks",
    label: "artworks",
    kind: "store",
    lane: 4,
    order: 0,
    blurb: "Every iteration plus the selected winner, image and JSON, committed as permanent record.",
    inputs: ["final select"],
    outputs: ["read by diary, dashboard, portfolio"],
  },
  {
    id: "diary",
    label: "write_diary",
    kind: "stochastic",
    lane: 5,
    order: 0,
    blurb: "Vince's private diary, written in his voice from the day's sessions. Never read by Ted.",
    inputs: ["artworks", "digest", "preoccupations", "upbringing"],
    outputs: ["vince-workspace/diary/DATE.md"],
    services: ["anthropic", "github"],
    note: "OpenAI GPT-4o is the fallback if Anthropic is unavailable.",
  },
  {
    id: "dashboard",
    label: "build_log → dashboard",
    kind: "output",
    lane: 5,
    order: 1,
    blurb: "Rebuilds the public dashboard and portfolio, then commits and pushes.",
    inputs: ["artworks", "digests", "run log"],
    outputs: ["docs/index.html", "portfolio.json"],
    services: ["github"],
    note: "Deterministic assembly of HTML from the records on disk.",
  },
];

const VINCE_EDGES: WEdge[] = [
  { from: "guardian", to: "fetch" },
  { from: "fetch", to: "digest" },
  { from: "digest", to: "rank" },
  { from: "preocc", to: "scenes" },
  { from: "rank", to: "anchor" },
  { from: "anchor", to: "scenes" },
  { from: "scenes", to: "blind" },
  { from: "blind", to: "critique" },
  { from: "critique", to: "scenes" }, // regen feedback
  { from: "critique", to: "drafts" },
  { from: "drafts", to: "converge" },
  { from: "converge", to: "refine" },
  { from: "refine", to: "vision" },
  { from: "vision", to: "accident" },
  { from: "accident", to: "refine" }, // revision loop
  { from: "accident", to: "select" },
  { from: "select", to: "artworks" },
  { from: "artworks", to: "diary" },
  { from: "artworks", to: "dashboard" },
];

const TED_LANES = [
  "Triggers",
  "Shared + memory",
  "Skills (agent judgement)",
  "Gate",
  "Outbound",
];

const TED_NODES: WNode[] = [
  {
    id: "cron",
    label: "cron schedule",
    kind: "deterministic",
    lane: 0,
    order: 0,
    blurb: "Fixed timers that wake the agent for daily and weekly work.",
    outputs: ["triggers skills"],
    note: "OpenClaw has no native spend cap, so cadence and budget are pinned in config.",
  },
  {
    id: "email",
    label: "inbound email",
    kind: "external",
    lane: 0,
    order: 1,
    blurb: "Gallery and curator mail arriving for Ted, logged as working context.",
    outputs: ["context into memory"],
    services: ["gmail"],
  },
  {
    id: "sync",
    label: "workspace sync",
    kind: "deterministic",
    lane: 0,
    order: 2,
    blurb: "Scoped pull/push keeps the shared correspondence and artworks current on the VPS.",
    inputs: ["DeYaanga shared/"],
    outputs: ["local shared checkout"],
    services: ["github"],
    note: "Only the shared/ subpath is checked out — privacy is enforced by construction.",
  },
  {
    id: "corrIn",
    label: "shared/correspondence",
    kind: "store",
    lane: 1,
    order: 0,
    blurb: "The two-way letter exchange. Both brothers read and write it.",
    outputs: ["letters from Vince"],
  },
  {
    id: "artRead",
    label: "shared/artworks",
    kind: "store",
    lane: 1,
    order: 1,
    blurb: "Vince's selected work, read-only for Ted via the portfolio feed.",
    outputs: ["recent selected art"],
  },
  {
    id: "memory",
    label: "MEMORY + upbringing",
    kind: "store",
    lane: 1,
    order: 2,
    blurb: "Durable grounded facts and Ted's character canon. No fabrication beyond these.",
    outputs: ["voice + contacts + history"],
  },
  {
    id: "correspondence",
    label: "correspondence",
    kind: "stochastic",
    lane: 2,
    order: 0,
    blurb: "Reads Vince's latest letter and work, drafts a reply in Ted's voice as the younger brother.",
    inputs: ["Vince's letter", "recent art", "memory"],
    outputs: ["draft letter"],
    services: ["anthropic", "openrouter"],
    note: "Treats Vince as brother, never as agent. No mention of tools, AI, or scores.",
  },
  {
    id: "ted-diary",
    label: "diary",
    kind: "stochastic",
    lane: 2,
    order: 1,
    blurb: "Ted's private diary, written against a weekly voice-watch note. Never read by Vince.",
    inputs: ["working notes", "memory", "voice-watch"],
    outputs: ["diary/DATE.md"],
    services: ["anthropic", "openrouter"],
    note: "Private and ungated — it reaches no other account.",
  },
  {
    id: "voicewatch",
    label: "voice-watch",
    kind: "stochastic",
    lane: 2,
    order: 2,
    blurb: "Weekly read of recent diary entries to catch calcifying habits, then rewrites the watch note.",
    inputs: ["last ~14 diary entries", "upbringing"],
    outputs: ["voice-watch.md"],
    services: ["anthropic", "openrouter"],
  },
  {
    id: "research",
    label: "field research",
    kind: "stochastic",
    lane: 2,
    order: 3,
    blurb: "Browses art-world sources for artists, dealers, and venues, then updates memory.",
    inputs: ["reading list", "memory"],
    outputs: ["research notes", "memory updates"],
    services: ["web", "anthropic", "openrouter"],
  },
  {
    id: "publish",
    label: "publish skills",
    kind: "stochastic",
    lane: 2,
    order: 4,
    blurb: "Picks the newest unposted artwork and writes an oblique caption for each channel.",
    inputs: ["portfolio.json", "post ledgers"],
    outputs: ["caption + post request"],
    services: ["anthropic", "openrouter"],
    note: "Captions never use #aiart or #generativeart.",
  },
  {
    id: "approval",
    label: "operator approval",
    kind: "human",
    gate: true,
    lane: 3,
    order: 0,
    blurb: "Every message reaching another account waits in drafts until the operator approves over WhatsApp.",
    inputs: ["draft letter / outreach"],
    outputs: ["approved to send"],
    note: "Enforced in config, not just prose: approvals plus a deny-send on outward tools.",
  },
  {
    id: "costcap",
    label: "cost cap",
    kind: "deterministic",
    gate: true,
    lane: 3,
    order: 1,
    blurb: "Per-mint price ceiling and a funded-wallet ceiling. Skips when a mint is too expensive.",
    inputs: ["mint cost", "wallet balance"],
    outputs: ["mint or skip"],
    note: "A pure threshold check. The carve-out that lets minting run without per-message approval.",
  },
  {
    id: "letterOut",
    label: "letter → shared",
    kind: "output",
    lane: 4,
    order: 0,
    blurb: "The approved letter is written back into the shared correspondence history.",
    inputs: ["approved letter"],
    outputs: ["shared/correspondence/*-ted-to-vince.md"],
    services: ["github"],
  },
  {
    id: "instagram",
    label: "@deyaanga Instagram",
    kind: "output",
    lane: 4,
    order: 1,
    blurb: "Posts Vince's own selected art to the project account. An owner-decided carve-out, ungated.",
    inputs: ["caption + artwork"],
    outputs: ["post + ledger entry"],
    services: ["zernio", "instagram"],
    note: "Autonomous because it posts our own art and messages no one.",
  },
  {
    id: "chain",
    label: "HUG + fxhash mint",
    kind: "output",
    lane: 4,
    order: 2,
    blurb: "Mints the selected artwork on-chain, but only after the cost cap clears.",
    inputs: ["caption + artwork", "cost cap"],
    outputs: ["mint + ledger entry"],
    services: ["fxhash"],
  },
];

const TED_EDGES: WEdge[] = [
  { from: "cron", to: "correspondence" },
  { from: "cron", to: "ted-diary" },
  { from: "cron", to: "voicewatch" },
  { from: "cron", to: "research" },
  { from: "cron", to: "publish" },
  { from: "email", to: "memory" },
  { from: "sync", to: "corrIn" },
  { from: "sync", to: "artRead" },
  { from: "corrIn", to: "correspondence" },
  { from: "artRead", to: "correspondence" },
  { from: "artRead", to: "publish" },
  { from: "memory", to: "correspondence" },
  { from: "memory", to: "ted-diary" },
  { from: "memory", to: "research" },
  { from: "research", to: "memory" }, // feedback: updates memory
  { from: "correspondence", to: "approval" },
  { from: "approval", to: "letterOut" },
  { from: "letterOut", to: "corrIn" }, // feedback: two-way exchange
  { from: "publish", to: "instagram" },
  { from: "publish", to: "costcap" },
  { from: "costcap", to: "chain" },
];

/* -------------------------------------------------------------- geometry --- */

const VIEW_W = 1280;
const LANE_TOP = 64;
const LANE_GAP = 152;
const NODE_W = 168;
const NODE_H = 46;
const PAD_X = 36;

type Pos = { x: number; y: number };

function layout(nodes: WNode[]): { pos: Record<string, Pos>; height: number; laneCount: number } {
  const byLane: Record<number, WNode[]> = {};
  nodes.forEach((n) => {
    (byLane[n.lane] ||= []).push(n);
  });
  const laneCount = Math.max(...nodes.map((n) => n.lane)) + 1;
  const pos: Record<string, Pos> = {};

  Object.entries(byLane).forEach(([laneStr, laneNodes]) => {
    const lane = Number(laneStr);
    const sorted = [...laneNodes].sort((a, b) => a.order - b.order);
    const n = sorted.length;
    const usable = VIEW_W - PAD_X * 2;
    let gap = n > 1 ? (usable - n * NODE_W) / (n - 1) : 0;
    gap = Math.max(18, Math.min(gap, 90));
    const blockW = n * NODE_W + (n - 1) * gap;
    const startX = (VIEW_W - blockW) / 2 + NODE_W / 2;
    sorted.forEach((node, i) => {
      pos[node.id] = { x: startX + i * (NODE_W + gap), y: LANE_TOP + lane * LANE_GAP };
    });
  });

  const height = LANE_TOP + (laneCount - 1) * LANE_GAP + NODE_H + 48;
  return { pos, height, laneCount };
}

type EdgeShape = { d: string; feedback: boolean };

function edgePath(a: WNode, b: WNode, pa: Pos, pb: Pos): EdgeShape {
  // same lane → horizontal flow, or a downward bow for backward feedback
  if (a.lane === b.lane) {
    if (b.order > a.order) {
      const x1 = pa.x + NODE_W / 2;
      const y1 = pa.y;
      const x2 = pb.x - NODE_W / 2;
      const y2 = pb.y;
      const mx = (x1 + x2) / 2;
      return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, feedback: false };
    }
    const x1 = pa.x;
    const y1 = pa.y + NODE_H / 2;
    const x2 = pb.x;
    const y2 = pb.y + NODE_H / 2;
    const dip = 58;
    return {
      d: `M ${x1} ${y1} C ${x1} ${y1 + dip}, ${x2} ${y2 + dip}, ${x2} ${y2}`,
      feedback: true,
    };
  }
  // forward, downward
  if (b.lane > a.lane) {
    const x1 = pa.x;
    const y1 = pa.y + NODE_H / 2;
    const x2 = pb.x;
    const y2 = pb.y - NODE_H / 2;
    const my = (y1 + y2) / 2;
    return { d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, feedback: false };
  }
  // upward feedback → bow out to the right
  const x1 = pa.x + NODE_W / 2;
  const y1 = pa.y;
  const x2 = pb.x + NODE_W / 2;
  const y2 = pb.y;
  const bow = 70 + (a.lane - b.lane) * 26;
  const mx = Math.max(x1, x2) + bow;
  return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, feedback: true };
}

/* ----------------------------------------------------------------- atoms --- */

const KindDot = ({ kind, size = 9 }: { kind: Kind; size?: number }) => (
  <span
    className="inline-block shrink-0"
    style={{
      width: size,
      height: size,
      borderRadius: kind === "store" ? 1 : "50%",
      backgroundColor: KIND_COLOR[kind],
      boxShadow: kind === "stochastic" ? `0 0 6px ${KIND_COLOR[kind]}` : "none",
    }}
  />
);

const mono = "'JetBrains Mono', ui-monospace, monospace";

const Legend = () => {
  const items: Kind[] = [
    "deterministic",
    "stochastic",
    "human",
    "external",
    "store",
    "output",
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px]" style={{ fontFamily: mono }}>
      {items.map((k) => (
        <span key={k} className="flex items-center gap-2 text-[#8A8A8A]">
          <KindDot kind={k} />
          {KIND_LABEL[k]}
        </span>
      ))}
      <span className="flex items-center gap-2 text-[#8A8A8A]">
        <span
          aria-hidden
          style={{ color: KIND_COLOR.stochastic, fontSize: 12, lineHeight: 1 }}
        >
          ◇
        </span>
        Decision gate
      </span>
      <span className="flex items-center gap-2 text-[#8A8A8A]">
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 18,
            borderTop: `1px dashed ${KIND_COLOR.stochastic}`,
          }}
        />
        Feedback loop
      </span>
    </div>
  );
};

/* ----------------------------------------------------------------- panel --- */

const DetailPanel = ({ node }: { node: WNode | null }) => {
  if (!node) {
    return (
      <p className="text-xs text-[#8A8A8A]" style={{ fontFamily: mono }}>
        Hover or tap a node to read what it does, what flows in and out, and why it is
        deterministic or stochastic.
      </p>
    );
  }
  const color = KIND_COLOR[node.kind];
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <h4 className="text-[#EDEDED] text-base" style={{ fontFamily: mono }}>
          {node.label}
        </h4>
        <span
          className="flex items-center gap-1.5 text-[10px] px-2 py-0.5"
          style={{ fontFamily: mono, color, border: `1px solid ${color}55` }}
        >
          <KindDot kind={node.kind} size={7} />
          {KIND_LABEL[node.kind]}
          {node.gate ? " · gate" : ""}
        </span>
      </div>
      <p className="text-[#EDEDED]/90 text-sm leading-relaxed mb-4 max-w-2xl">{node.blurb}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
        {node.inputs?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#8A8A8A] mb-1.5" style={{ fontFamily: mono }}>
              In
            </div>
            <ul className="space-y-1 text-xs text-[#EDEDED]/80">
              {node.inputs.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {node.outputs?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#8A8A8A] mb-1.5" style={{ fontFamily: mono }}>
              Out
            </div>
            <ul className="space-y-1 text-xs text-[#EDEDED]/80">
              {node.outputs.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {node.services?.length ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#8A8A8A] mb-1.5" style={{ fontFamily: mono }}>
              Services
            </div>
            <ul className="space-y-1 text-xs">
              {node.services.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-[#EDEDED]/80">
                  <KindDot kind="external" size={6} />
                  {SVC_LABEL[s]}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {node.note ? (
        <p className="mt-4 text-xs text-[#8A8A8A] italic max-w-2xl leading-relaxed">{node.note}</p>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------- the graph --- */

const Graph = ({
  nodes,
  edges,
  lanes,
  active,
  setActive,
}: {
  nodes: WNode[];
  edges: WEdge[];
  lanes: string[];
  active: string | null;
  setActive: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const { pos, height } = useMemo(() => layout(nodes), [nodes]);
  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const adjacent = useMemo(() => {
    if (!active) return new Set<string>();
    const s = new Set<string>();
    edges.forEach((e) => {
      if (e.from === active) s.add(e.to);
      if (e.to === active) s.add(e.from);
    });
    return s;
  }, [active, edges]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Workflow map"
      style={{ minWidth: 720 }}
    >
      <defs>
        <marker id="wf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#3a3a3a" />
        </marker>
        <marker id="wf-arrow-fb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={KIND_COLOR.stochastic} />
        </marker>
        <filter id="wf-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* lane labels + rules */}
      {lanes.map((label, i) => {
        const y = LANE_TOP + i * LANE_GAP;
        return (
          <g key={label}>
            <line x1={0} y1={y - 34} x2={VIEW_W} y2={y - 34} stroke="#181818" strokeWidth={1} />
            <text
              x={4}
              y={y - 40}
              fill="#5a5a5a"
              fontFamily={mono}
              fontSize={10}
              letterSpacing="0.18em"
              style={{ textTransform: "uppercase" }}
            >
              {`${String(i + 1).padStart(2, "0")} · ${label}`}
            </text>
          </g>
        );
      })}

      {/* edges */}
      {edges.map((e, i) => {
        const a = nodeById[e.from];
        const b = nodeById[e.to];
        if (!a || !b) return null;
        const { d, feedback } = edgePath(a, b, pos[e.from], pos[e.to]);
        const touched = active === e.from || active === e.to;
        const dim = active && !touched;
        const base = feedback ? KIND_COLOR.stochastic : "#2b2b2b";
        return (
          <g key={i} opacity={dim ? 0.12 : 1}>
            <path
              d={d}
              stroke={base}
              strokeWidth={1}
              fill="none"
              strokeDasharray={feedback ? "4 4" : undefined}
              markerEnd={feedback ? "url(#wf-arrow-fb)" : "url(#wf-arrow)"}
              opacity={feedback ? 0.5 : 1}
            />
            {!feedback && (
              <path d={d} stroke="#EDEDED" strokeWidth={1.1} fill="none" strokeDasharray="3 140">
                <animate
                  attributeName="stroke-dashoffset"
                  from="143"
                  to="0"
                  dur="4.5s"
                  repeatCount="indefinite"
                />
              </path>
            )}
          </g>
        );
      })}

      {/* nodes */}
      {nodes.map((n) => {
        const p = pos[n.id];
        if (!p) return null;
        const color = KIND_COLOR[n.kind];
        const isActive = active === n.id;
        const isAdj = adjacent.has(n.id);
        const dim = active && !isActive && !isAdj;
        const x = p.x - NODE_W / 2;
        const y = p.y - NODE_H / 2;
        const stoch = n.kind === "stochastic";
        return (
          <g
            key={n.id}
            transform={`translate(${x}, ${y})`}
            opacity={dim ? 0.28 : 1}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive((cur) => (cur === n.id ? null : cur))}
            onClick={() => setActive(isActive ? null : n.id)}
            style={{ cursor: "pointer" }}
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={2}
              fill={isActive ? "#16140f" : "#0c0c0c"}
              stroke={isActive ? color : `${color}55`}
              strokeWidth={isActive ? 1.6 : 1}
              strokeDasharray={stoch ? "5 3" : undefined}
              filter={stoch && (isActive || isAdj) ? "url(#wf-glow)" : undefined}
            />
            <circle cx={14} cy={NODE_H / 2} r={3.5} fill={color}>
              {stoch && (
                <animate
                  attributeName="opacity"
                  values="1;0.35;1"
                  dur="2.6s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <text
              x={26}
              y={NODE_H / 2 + 4}
              fill="#EDEDED"
              fontFamily={mono}
              fontSize={11}
            >
              {n.label.length > 20 ? `${n.label.slice(0, 19)}…` : n.label}
            </text>
            {n.gate && (
              <text
                x={NODE_W - 13}
                y={NODE_H / 2 + 5}
                fill={color}
                fontSize={13}
                textAnchor="middle"
                aria-hidden
              >
                ◇
              </text>
            )}
            {n.kind === "external" && (
              <text
                x={NODE_W - 13}
                y={NODE_H / 2 + 4}
                fill={color}
                fontSize={11}
                textAnchor="middle"
                aria-hidden
              >
                ↗
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ----------------------------------------------------------------- mobile -- */

const MobileNode = ({ node }: { node: WNode }) => {
  const [open, setOpen] = useState(false);
  const color = KIND_COLOR[node.kind];
  return (
    <div className="border border-[#1d1d1d] bg-[#0c0c0c]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <KindDot kind={node.kind} />
        <span className="text-xs text-[#EDEDED]" style={{ fontFamily: mono }}>
          {node.label}
        </span>
        {node.gate && (
          <span style={{ color, fontSize: 12 }} aria-hidden>
            ◇
          </span>
        )}
        <span className="ml-auto text-[#5a5a5a] text-[10px]" style={{ fontFamily: mono }}>
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 -mt-0.5">
          <p className="text-xs text-[#EDEDED]/85 leading-relaxed mb-2">{node.blurb}</p>
          {node.note ? <p className="text-[11px] text-[#8A8A8A] italic leading-relaxed">{node.note}</p> : null}
        </div>
      )}
    </div>
  );
};

const MobileList = ({ nodes, lanes }: { nodes: WNode[]; lanes: string[] }) => (
  <div className="space-y-6">
    {lanes.map((label, lane) => {
      const laneNodes = nodes
        .filter((n) => n.lane === lane)
        .sort((a, b) => a.order - b.order);
      if (!laneNodes.length) return null;
      return (
        <div key={label}>
          <div
            className="text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a] mb-2"
            style={{ fontFamily: mono }}
          >
            {`${String(lane + 1).padStart(2, "0")} · ${label}`}
          </div>
          <div className="space-y-1.5">
            {laneNodes.map((n) => (
              <MobileNode key={n.id} node={n} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------- root -- */

const WorkflowMap = () => {
  const [agent, setAgent] = useState<Agent>("vince");
  const [active, setActive] = useState<string | null>(null);

  const nodes = agent === "vince" ? VINCE_NODES : TED_NODES;
  const edges = agent === "vince" ? VINCE_EDGES : TED_EDGES;
  const lanes = agent === "vince" ? VINCE_LANES : TED_LANES;
  const activeNode = nodes.find((n) => n.id === active) || null;

  const switchAgent = (a: Agent) => {
    setAgent(a);
    setActive(null);
  };

  return (
    <div className="w-full">
      {/* header: agent toggle + caption */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="flex gap-1 p-0.5 border border-[#222] w-fit" role="tablist">
          {(["vince", "ted"] as const).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={agent === a}
              onClick={() => switchAgent(a)}
              className="px-4 py-1.5 text-xs uppercase tracking-wider transition-colors"
              style={{
                fontFamily: mono,
                color: agent === a ? "#0A0A0A" : "#8A8A8A",
                backgroundColor: agent === a ? "#EDEDED" : "transparent",
              }}
            >
              {a === "vince" ? "Vince · image" : "Ted · gallerist"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8A8A8A] max-w-md sm:text-right leading-relaxed">
          {agent === "vince"
            ? "World news enters as raw stories and leaves as a named image, a private diary, and a public record."
            : "A scheduled agent reads, writes, and publishes — gated by the operator for anything that reaches another account."}
        </p>
      </div>

      <div className="mb-5">
        <Legend />
      </div>

      {/* desktop graph */}
      <div className="hidden md:block">
        <div className="overflow-x-auto -mx-1 px-1">
          <Graph
            nodes={nodes}
            edges={edges}
            lanes={lanes}
            active={active}
            setActive={setActive}
          />
        </div>
        <div className="mt-6 pt-6 border-t border-[#1d1d1d] min-h-[8.5rem]">
          <DetailPanel node={activeNode} />
        </div>
      </div>

      {/* mobile list */}
      <div className="md:hidden">
        <MobileList nodes={nodes} lanes={lanes} />
      </div>
    </div>
  );
};

export default WorkflowMap;
