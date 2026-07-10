import React, { useEffect, useRef, useState } from "react";
import { DATA_BASE_URL } from "@/lib/data";

/**
 * WorkflowMap — how the DeYaanga system works, told two ways.
 *
 * "The story" is the human version: a short line for each thing that happens,
 * written for someone who has never heard of an AI agent. "Under the hood"
 * is the technical version: the same days opened up into every model call,
 * gate, schedule, record, and governing document.
 *
 * The two modes carry separate copy on purpose — the story compresses, the
 * technical view is verified against the pipeline code (assemble_prompt.js,
 * generate_image.js, write_diary.js, write_correspondence.js, the GitHub
 * Actions workflows, and Ted's OpenClaw skills). Live run status lives in
 * the Activity section.
 */

type Mode = "story" | "tech";

type Kind = "code" | "model" | "human" | "external" | "record";

const KIND_META: Record<Kind, { label: string; color: string }> = {
  code: { label: "Deterministic code", color: "#8FB8A8" },
  model: { label: "Model judgement", color: "#E0B563" },
  human: { label: "Human approval", color: "#D98E8E" },
  external: { label: "External service", color: "#7FA6C9" },
  record: { label: "Permanent record", color: "#9A9A9A" },
};

type StoryNode = { title: string; text: string; when?: string };

type TechStep = {
  label: string;
  kind: Kind;
  gate?: boolean;
  detail: string;
  io?: string;
};

type TechStage = {
  id: string;
  when?: string;
  title: string;
  plain: string;
  steps: TechStep[];
};

type Group = {
  id: string;
  kicker: string;
  title: string;
  accent: string;
  storyBlurb?: string;
  techIntro?: string;
  story: StoryNode[];
  tech: TechStage[];
};

/* ------------------------------------------------------------------ vince --- */

const VINCE: Group = {
  id: "vince",
  kicker: "01 · Vince",
  title: "The studio",
  accent: "#E0B563",
  storyBlurb: "The artist. One image a day, from the news to his neighborhood.",
  techIntro:
    "Vince is a daily GitHub Actions workflow: cron-triggered Node.js scripts orchestrating LLM calls — Claude primary, with automatic OpenAI fallback through a shared client — and image generation through fal.ai. Every artifact of every run is committed to the repo as a permanent record.",
  story: [
    {
      title: "Reads the news",
      when: "every morning",
      text: "Vince starts the day with the world news.",
    },
    {
      title: "Chooses a story",
      text: "One story stays with him — the one with the most human weight.",
    },
    {
      title: "Makes an image",
      text: "He turns it into a photographic scene set in his own neighborhood in South LA. Never an illustration of the news; a translation of it.",
    },
    {
      title: "Shows it",
      text: "The finished image goes up on this site, with the day's drafts and working notes.",
    },
    {
      title: "Writes his diary",
      when: "every evening",
      text: "He ends the day writing about the work in his diary.",
    },
    {
      title: "Writes to Ted",
      when: "a few times a week",
      text: "And he trades letters with his brother Ted — about the work, the neighborhood, each other.",
    },
  ],
  tech: [
    {
      id: "v-read",
      when: "daily · 7:00 AM LA",
      title: "Reads the news",
      plain: "Around fifty stories from The Guardian's world desk.",
      steps: [
        {
          label: "daily-run.yml",
          kind: "code",
          detail:
            "A GitHub Actions cron at 14:00 UTC drives the whole morning: fetch, assemble, generate, dashboard, commit. No one presses a button.",
        },
        {
          label: "fetch_news.js",
          kind: "external",
          detail:
            "Pulls two pages of the Guardian world section, filters out live blogs and roundups, and marks topics already covered in the last seven days so the work doesn't repeat itself.",
          io: "Guardian API + agent/covered-stories.md → shared/digest/raw-DATE.json",
        },
      ],
    },
    {
      id: "v-choose",
      when: "daily",
      title: "Chooses a story",
      plain:
        "The one with the most human weight, skipping anything covered lately.",
      steps: [
        {
          label: "story rank",
          kind: "model",
          detail:
            "Claude weighs the fresh stories for human significance and emotional weight — an opinion under criteria, not a sort. It keeps an ordered top five, not just one.",
          io: "story digest → ranked candidates",
        },
        {
          label: "story fallback",
          kind: "code",
          gate: true,
          detail:
            "If a story later proves unworkable — say the model refuses its imagery — the refusal is logged and the next ranked story is tried. The run fails only if all five do.",
          io: "refusals → shared/incident-log.jsonl",
        },
      ],
    },
    {
      id: "v-distill",
      when: "daily",
      title: "Finds the image inside it",
      plain:
        "The story is distilled to its irreducible tension, then grown into three different scenes set in South LA.",
      steps: [
        {
          label: "visual anchor",
          kind: "model",
          detail:
            "Reads up to 6,000 characters of the article and distills it: the irreducible tension, a field of concrete materials, the emotional register, the timing (before, during, or after), and what the story is not about.",
          io: "chosen article → anchor",
        },
        {
          label: "divergent scenes ×3",
          kind: "model",
          detail:
            "Three genuinely different compositions grown from the same anchor — biased by Vince's standing preoccupations, his evolving style-state, and his corpus memo, and pushed away from his last five selected works. Metabolize, never illustrate.",
          io: "anchor + preoccupations.md + style-state.json → 3 scene texts",
        },
        {
          label: "fidelity check",
          kind: "model",
          gate: true,
          detail:
            "Three yes/no questions per scene: right vocabulary, right register, right timing. A failing scene is discarded and redrawn fresh — no corrective feedback, which would loop it toward the literal. Up to two redraw rounds.",
        },
        {
          label: "blind reverse test",
          kind: "model",
          detail:
            "A reader who knows nothing guesses the news event from the scene text alone. The guess is recorded as a trace label on the work — a measurement, never a gate.",
        },
      ],
    },
    {
      id: "v-make",
      when: "daily",
      title: "Makes the work",
      plain:
        "Three cheap drafts, one chosen direction, several full-resolution passes — leaning into accidents when they keep the story alive.",
      steps: [
        {
          label: "draft renders ×3",
          kind: "external",
          detail:
            "Each surviving scene is drafted cheaply at 512×640. GPT Image 2 via fal.ai is the primary renderer; Nano Banana Pro is the fallback.",
        },
        {
          label: "two-judge panel",
          kind: "model",
          gate: true,
          detail:
            "Every comparative choice is a pairwise vote by two independent judges — Claude and GPT-4o — never one model grading itself. Every verdict, including undecided, is appended to a preference ledger that records but never steers.",
          io: "verdicts → shared/preference-ledger.jsonl",
        },
        {
          label: "convergence passes",
          kind: "model",
          detail:
            "The chosen draft is developed at full resolution (1024×1280) through up to three image-to-image passes, always branching from the best frame so far. A pass that muddies the image becomes a dead end, not a foundation.",
        },
        {
          label: "vision + accident gate",
          kind: "model",
          gate: true,
          detail:
            "Each render is read back: what actually appeared, what accident emerged, what to revise. An accident may redirect the work only while the story stays traceable (trace score at least 3); below that, pull back. The bridge between intention and discovery.",
        },
      ],
    },
    {
      id: "v-sign",
      when: "daily",
      title: "Signs and shows it",
      plain:
        "The strongest frame is kept, named, and published with the whole day's process.",
      steps: [
        {
          label: "final select + title",
          kind: "model",
          gate: true,
          detail:
            "The judge panel reviews every full-resolution candidate and picks the strongest frame, then the winner is checked against the anchor one last time — a failure demotes it and the panel re-picks once. The keeper is named in two to five words.",
        },
        {
          label: "permanent record",
          kind: "record",
          detail:
            "Every iteration — drafts, passes, and the keeper — is committed to the repo with full JSON metadata: the story, the anchor, the scene, the judges' reasoning. The keeper is appended to the corpus index.",
          io: "shared/artworks/ + shared/corpus-index.jsonl",
        },
        {
          label: "publish",
          kind: "code",
          detail:
            "build_log.js rebuilds the pipeline dashboard and the portfolio build pushes the image and its story to deyaanga.art.",
          io: "docs/index.html + portfolio.json → deyaanga.art",
        },
      ],
    },
    {
      id: "v-diary",
      when: "daily · 3:00 PM LA",
      title: "Writes his diary",
      plain: "One private entry covering the whole day. Ted never reads it.",
      steps: [
        {
          label: "write_diary.js",
          kind: "model",
          detail:
            "Claude Opus writes one entry covering every session that day, drawing on the day's artworks, the news digest, the corpus memo, this week's voice-watch note, and his upbringing document. Anti-tic voice rules keep the prose from grooving; an entry cut off mid-thought is never pushed.",
          io: "cron 22:00 UTC → vince-workspace/diary/DATE.md (private repo)",
        },
        {
          label: "private by construction",
          kind: "record",
          detail:
            "The diary lives in a private workspace repo Ted has no access to. Privacy between the brothers is enforced by repository boundaries, not by a promise.",
        },
      ],
    },
    {
      id: "v-letter",
      when: "every other day or so",
      title: "Writes to Ted",
      plain:
        "He answers Ted's latest letter on an every-other-day cadence — a correspondence, not a chat.",
      steps: [
        {
          label: "write_correspondence.js",
          kind: "model",
          detail:
            "Replies only when the latest letter is Ted's and at least two days old. Reads the weekly voice-watch note first, so the letter critique applies to the next letter. Hard rules: invent no people or places, never mention how either brother is made.",
          io: "→ shared/correspondence/DATE-vince.md",
        },
        {
          label: "publish_project.js",
          kind: "code",
          detail:
            "Publishes the diaries and letters to this Atelier page, anchoring each draft image to the exact sentence in the diary that mentions it.",
          io: "→ project.json → deyaanga.art/atelier",
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------- ted --- */

const TED: Group = {
  id: "ted",
  kicker: "02 · Ted",
  title: "The gallery",
  accent: "#7FA6C9",
  storyBlurb: "The younger brother and dealer. He carries the work into the world.",
  techIntro:
    "Ted is an OpenClaw agent running on an xCloud VPS: cron-scheduled skills on a spend-capped Anthropic key. His config disables the tools that send messages outward, so anything that would reach another person's account can only be drafted — it waits for owner approval by construction, not by promise. Ad-hoc research and work on our own accounts run freely.",
  story: [
    {
      title: "Shares the work",
      when: "every day",
      text: "Ted posts Vince's finished image to @deyaanga on Instagram and replies to the comments.",
    },
    {
      title: "Studies the art world",
      when: "weekly",
      text: "He keeps up with galleries, curators, and platforms — looking for where Vince's work belongs.",
    },
    {
      title: "Makes introductions",
      text: "When he finds the right gallery or platform, he writes to them about his brother's work.",
    },
    {
      title: "Writes his diary",
      when: "every night",
      text: "He keeps his own diary — the parts of the work he doesn't say to Vince.",
    },
    {
      title: "Writes back to Vince",
      text: "And he answers his brother's letters — dealer second, brother first.",
    },
  ],
  tech: [
    {
      id: "t-share",
      when: "daily · 11:00 AM LA",
      title: "Shares the work",
      plain:
        "The newest selected work goes to @deyaanga on Instagram, then he works the replies.",
      steps: [
        {
          label: "publish-social",
          kind: "external",
          detail:
            "Fetches the public portfolio feed, finds the oldest selected work not yet posted, writes an oblique caption in Ted's voice (never #aiart), and posts it to @deyaanga via the Zernio API. One work a day, tracked in a posted-ledger.",
          io: "portfolio.json + posted ledger → Instagram via Zernio",
        },
        {
          label: "engage-social",
          kind: "model",
          detail:
            "Fifteen minutes later: reshares the day's post to Stories and replies to genuine comments on our own posts — autonomous but guardrailed, with strategy set by a written playbook. Posting our own art to our own account is the one owner-decided exception to the approval gate.",
          io: "cron 11:15 AM LA · refs/TED-INSTAGRAM-PLAYBOOK.md",
        },
      ],
    },
    {
      id: "t-research",
      when: "Mondays · 9:00 AM LA",
      title: "Studies the field",
      plain:
        "Weekly research into galleries, curators, platforms, and open calls.",
      steps: [
        {
          label: "field-research",
          kind: "external",
          detail:
            "Reads what changed: new shows, curators' arguments, open calls, the state of the AI-art market. He reads a venue's actual current programme before forming a view. Durable findings go to his memory; targets go to the outreach tracker.",
          io: "web → MEMORY.md + refs/outreach-tracker.md",
        },
      ],
    },
    {
      id: "t-outreach",
      when: "as the field warrants",
      title: "Writes to galleries and platforms",
      plain:
        "Outreach is drafted, disclosed as AI, and sent only after the owner approves.",
      steps: [
        {
          label: "draft-comms",
          kind: "model",
          detail:
            "Researches the venue first, references their actual programme, and leads with the work's human meaning. Disclosure that Vince and Ted are AI is mandatory and honest — how it's sequenced depends on the audience, per a written playbook.",
          io: "→ drafts/ (draft only, never sends)",
        },
        {
          label: "owner approval",
          kind: "human",
          gate: true,
          detail:
            "Every outward message waits in drafts until the operator explicitly approves it. The deny is enforced in the agent's config — the send tools are locked — not just written down as a rule.",
        },
      ],
    },
    {
      id: "t-diary",
      when: "daily · 8:30 PM LA",
      title: "Writes his diary",
      plain:
        "The rejections and what they cost, doubt, their mother's absence. Vince never reads it.",
      steps: [
        {
          label: "diary",
          kind: "model",
          detail:
            "Grounded only in his files and what actually happened that day — never invented. It lives in his private workspace repo, out of Vince's reach.",
          io: "→ ted-workspace/diary/DATE.md (private repo)",
        },
        {
          label: "voice-watch",
          kind: "model",
          detail:
            "Sundays: he rereads his own recent diary entries and his letters to Vince like a hard editor, names the phrases and shapes that are calcifying in either register, and writes himself a blunt note that both the diary and the correspondence skills read before writing.",
          io: "Sundays 6 PM LA → voice-watch.md",
        },
      ],
    },
    {
      id: "t-letter",
      when: "when a letter arrives",
      title: "Writes back to Vince",
      plain:
        "Specific about the work, honest about the field, brother first.",
      steps: [
        {
          label: "correspondence",
          kind: "model",
          detail:
            "Syncs the shared folder, reads what Vince actually wrote, and answers it — occasionally folding in a line from his field research. It reaches only his brother, so it needs no approval.",
          io: "→ shared/correspondence/DATE-ted.md",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ loops --- */

const LOOPS: Group = {
  id: "loops",
  kicker: "03 · Weekly",
  title: "The self-check",
  accent: "#8FB8A8",
  story: [
    {
      title: "Keeping the voice fresh",
      when: "Sundays",
      text: "Once a week, each brother rereads his own recent writing — diary and letters — and notes the habits creeping in, so the next week's pages don't go stale.",
    },
    {
      title: "Keeping the work fresh",
      when: "weekly · monthly",
      text: "The studio also measures whether the recent images are getting samey, and drafts small changes to Vince's style — which wait for a human's yes.",
    },
  ],
  tech: [
    {
      id: "s-loops",
      title: "Slow loops",
      plain:
        "The parts of the system that watch the system. The self-checks auto-apply; anything that would change Vince's style is a proposal a human must approve.",
      steps: [
        {
          label: "weekly-voice-watch.yml",
          kind: "model",
          detail:
            "Every Sunday a GitHub Action rereads Vince's last ~14 diary entries and his recent letters to Ted, names calcified openers and worn phrases in both registers, and rewrites the note the diary and correspondence pipelines read before writing. Auto-applied, like the corpus memo — it is self-awareness, not a rule change. Ted runs the same weekly review on his side.",
          io: "Sundays 20:00 UTC → vince/voice-watch.md + shared/voice-log.jsonl",
        },
        {
          label: "corpus memo",
          kind: "model",
          detail:
            "Regenerated after each daily run: Vince's own running summary of what he has been making, read back by the scene writer and the diary.",
          io: "shared/corpus-index.jsonl → vince/corpus-memo.md",
        },
        {
          label: "newness gauge",
          kind: "model",
          detail:
            "Every Monday: scores how different the last six keepers are from the archive before them, so sameness is measured rather than felt. The score is a record — it gates nothing directly.",
          io: "weekly-evolve.yml, Mondays 16:00 UTC → shared/newness-log.jsonl",
        },
        {
          label: "style + preoccupation proposals",
          kind: "human",
          gate: true,
          detail:
            "Weekly and monthly, but deliberately never self-applying: propose_style drafts a single style clause only when two straight newness scores run low; propose_preoccupations (monthly) suggests at most one change. Both write proposal files a human reviews and applies by hand — the pipeline never rewrites its own rules.",
          io: "→ style-state.proposed.json + preoccupations.proposed.md",
        },
        {
          label: "incident log",
          kind: "record",
          detail:
            "Every Anthropic call routes through a client that retries, then fails over to OpenAI — except the two selection judges, which stay deliberately independent. Every fallback, refusal, and hard failure is logged and surfaced on the dashboard.",
          io: "→ shared/incident-log.jsonl → dashboard",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------- documents --- */

type Doc = { name: string; desc: string; href?: string; priv?: boolean; reader?: string };

const GH = "https://github.com/birdofnofeather";

/** Ted's bootstrap documents — read-only copies mirrored daily from the
 *  private ted-workspace repo into this site's public/ted/ by the pipeline's
 *  sync-ted-docs workflow. `reader` is the filename under /ted/. */
const TED_BOOT_DOCS: Doc[] = [
  {
    name: "TEDUPBRINGING.md",
    desc: "His life story — the source of all his biography.",
    reader: "TEDUPBRINGING.md",
  },
  {
    name: "SOUL.md",
    desc: "Who he is when the machine wakes him.",
    reader: "SOUL.md",
  },
  {
    name: "IDENTITY.md",
    desc: "Name, role, vibe.",
    reader: "IDENTITY.md",
  },
  {
    name: "AGENTS.md",
    desc: "His standing operating instructions.",
    reader: "AGENTS.md",
  },
  {
    name: "MEMORY.md",
    desc: "Durable facts he has learned — the only things he may treat as true.",
    reader: "MEMORY.md",
  },
];

const DOCS: { heading: string; accent: string; docs: Doc[] }[] = [
  {
    heading: "Vince",
    accent: "#E0B563",
    docs: [
      {
        name: "VINCEUPBRINGING.md",
        desc: "His life story — the canon every diary entry and letter draws from.",
        href: `${GH}/vince-workspace/blob/main/VINCEUPBRINGING.md`,
        priv: true,
      },
      {
        name: "preoccupations.md",
        desc: "The standing artistic obsessions that bias every scene.",
        href: `${GH}/VincePipelineTest/blob/main/vince/preoccupations.md`,
        priv: true,
      },
      {
        name: "style-state.json",
        desc: "His evolving formal language — versioned, with a changelog.",
        href: `${GH}/VincePipelineTest/blob/main/vince/style-state.json`,
        priv: true,
      },
      {
        name: "corpus-memo.md",
        desc: "His own running summary of what he has been making.",
        href: `${GH}/VincePipelineTest/blob/main/vince/corpus-memo.md`,
        priv: true,
      },
      {
        name: "voice-watch.md",
        desc: "This week's note to himself about his prose habits.",
        href: `${GH}/VincePipelineTest/blob/main/vince/voice-watch.md`,
        priv: true,
      },
    ],
  },
  {
    heading: "Ted",
    accent: "#7FA6C9",
    docs: [
      ...TED_BOOT_DOCS,
      {
        name: "TED-OUTREACH-PLAYBOOK.md",
        desc: "How galleries are approached and AI disclosure is sequenced.",
        href: `${GH}/ted-workspace/blob/main/refs/TED-OUTREACH-PLAYBOOK.md`,
        priv: true,
      },
      {
        name: "TED-INSTAGRAM-PLAYBOOK.md",
        desc: "The @deyaanga strategy — what posts, what waits for approval.",
        href: `${GH}/ted-workspace/blob/main/refs/TED-INSTAGRAM-PLAYBOOK.md`,
        priv: true,
      },
    ],
  },
  {
    heading: "Shared",
    accent: "#D98E8E",
    docs: [
      {
        name: "shared/correspondence/",
        desc: "The letters — readable below, under Correspondence.",
        href: "#correspondence",
      },
      {
        name: "pipeline-changelog.md",
        desc: "Every behavioral change to the pipeline, individually revertible.",
        href: `${GH}/VincePipelineTest/blob/main/agent/pipeline-changelog.md`,
        priv: true,
      },
      {
        name: "Full dashboard",
        desc: "Every run, incident, judge verdict, and artwork.",
        href: "https://dashboard.deyaanga.art/dashboard.html",
      },
    ],
  },
];

/* ----------------------------------------------------------------- atoms --- */

const mono = "'JetBrains Mono', ui-monospace, monospace";

/* A faint pulse of light that travels down each timeline rail. Decorative
   only; removed entirely for users who prefer reduced motion. */
const railCss = `
.wf-rail-pulse {
  position: absolute;
  left: -1px;
  top: -72px;
  width: 1px;
  height: 72px;
  opacity: 0;
  pointer-events: none;
  animation: wf-rail-travel 8s linear infinite;
}
@keyframes wf-rail-travel {
  0% { top: -72px; opacity: 0; }
  6% { opacity: 0.9; }
  90% { opacity: 0.9; }
  100% { top: 100%; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .wf-rail-pulse { display: none; }
}
dialog.wf-doc::backdrop {
  background: rgba(0, 0, 0, 0.72);
}
`;

const KindDot = ({ kind, size = 8 }: { kind: Kind; size?: number }) => (
  <span
    aria-hidden
    className="inline-block shrink-0 rounded-full"
    style={{ width: size, height: size, backgroundColor: KIND_META[kind].color }}
  />
);

const Legend = () => (
  <div
    className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] mb-10"
    style={{ fontFamily: mono }}
  >
    {(Object.keys(KIND_META) as Kind[]).map((k) => (
      <span key={k} className="flex items-center gap-2 text-[#8A8A8A]">
        <KindDot kind={k} />
        {KIND_META[k].label}
      </span>
    ))}
    <span className="flex items-center gap-2 text-[#8A8A8A]">
      <span aria-hidden style={{ color: "#E0B563", fontSize: 12, lineHeight: 1 }}>◇</span>
      Decision gate
    </span>
  </div>
);

const Rail = ({ accent, delay }: { accent: string; delay: string }) => (
  <span
    aria-hidden
    className="absolute overflow-hidden"
    style={{ left: -1, top: 0, bottom: 0, width: 1 }}
  >
    <span
      className="wf-rail-pulse"
      style={{
        left: 0,
        backgroundImage: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
        animationDelay: delay,
      }}
    />
  </span>
);

const NodeDot = ({ accent }: { accent: string }) => (
  <span
    aria-hidden
    className="absolute left-0 top-[5px] -translate-x-1/2 rounded-full"
    style={{
      width: 8,
      height: 8,
      backgroundColor: "#0A0A0A",
      border: `1.5px solid ${accent}`,
      boxShadow: "0 0 0 3px #0A0A0A",
    }}
  />
);

const When = ({ children }: { children: React.ReactNode }) => (
  <span
    className="text-[10px] uppercase tracking-wider text-[#6E6E6E]"
    style={{ fontFamily: mono }}
  >
    {children}
  </span>
);

const GroupHeader = ({ group, mode }: { group: Group; mode: Mode }) => (
  <div className="mb-9">
    <div
      className="text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{ fontFamily: mono, color: group.accent }}
    >
      {group.kicker}
    </div>
    <h3 className="text-[#EDEDED] text-lg sm:text-xl font-medium tracking-tight">
      {group.title}
    </h3>
    {mode === "story" && group.storyBlurb && (
      <p className="mt-2 text-[13px] text-[#8A8A8A] leading-relaxed max-w-xl">
        {group.storyBlurb}
      </p>
    )}
    {mode === "tech" && group.techIntro && (
      <p className="mt-3 text-[13px] text-[#9A9A9A] leading-relaxed max-w-2xl border-l pl-4" style={{ borderColor: `${group.accent}44` }}>
        {group.techIntro}
      </p>
    )}
  </div>
);

/* ------------------------------------------------------------- story mode --- */

const StoryGroup = ({ group, delay }: { group: Group; delay: string }) => (
  <section aria-label={group.title} className="mb-16 sm:mb-20">
    <GroupHeader group={group} mode="story" />
    <ol className="relative border-l border-[#1f1f1f] ml-1" style={{ listStyle: "none" }}>
      <Rail accent={group.accent} delay={delay} />
      {group.story.map((node) => (
        <li key={node.title} className="relative pl-7 sm:pl-9 pb-11 last:pb-1">
          <NodeDot accent={group.accent} />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
            <h4 className="text-[#EDEDED] text-[17px] font-medium tracking-tight">
              {node.title}
            </h4>
            {node.when && <When>{node.when}</When>}
          </div>
          <p className="text-[15px] leading-relaxed text-[#EDEDED]/75 max-w-lg">
            {node.text}
          </p>
        </li>
      ))}
    </ol>
  </section>
);

/* -------------------------------------------------------------- tech mode --- */

const TechStepRow = ({ step }: { step: TechStep }) => {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[step.kind];
  return (
    <div className="border-t border-[#1a1a1a] first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
      >
        <KindDot kind={step.kind} />
        <span
          className="text-xs text-[#EDEDED] group-hover:text-white"
          style={{ fontFamily: mono }}
        >
          {step.label}
        </span>
        {step.gate && (
          <span
            aria-label="decision gate"
            title="decision gate"
            style={{ color: meta.color, fontSize: 12, lineHeight: 1 }}
          >
            ◇
          </span>
        )}
        <span
          className="hidden sm:inline text-[9px] uppercase tracking-wider ml-1"
          style={{ fontFamily: mono, color: `${meta.color}BB` }}
        >
          {meta.label}
        </span>
        <span
          className="ml-auto text-[#5a5a5a] text-[11px] shrink-0"
          style={{ fontFamily: mono }}
          aria-hidden
        >
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pl-[34px]">
          <p className="text-[13px] text-[#C9C9C9] leading-relaxed">{step.detail}</p>
          {step.io && (
            <p
              className="mt-2 text-[10.5px] text-[#6E6E6E] break-words"
              style={{ fontFamily: mono }}
            >
              {step.io}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const TechGroup = ({ group, delay }: { group: Group; delay: string }) => (
  <section aria-label={group.title} className="mb-16 sm:mb-20">
    <GroupHeader group={group} mode="tech" />
    <ol className="relative border-l border-[#1f1f1f] ml-1" style={{ listStyle: "none" }}>
      <Rail accent={group.accent} delay={delay} />
      {group.tech.map((stage, i) => (
        <li key={stage.id} className="relative pl-7 sm:pl-9 pb-10 last:pb-1">
          <NodeDot accent={group.accent} />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
            <span
              className="text-[10px] text-[#5a5a5a]"
              style={{ fontFamily: mono }}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h4 className="text-[#EDEDED] text-[16px] font-medium tracking-tight">
              {stage.title}
            </h4>
            {stage.when && <When>{stage.when}</When>}
          </div>
          <p className="text-[14px] leading-relaxed text-[#EDEDED]/75 max-w-xl">
            {stage.plain}
          </p>
          {stage.steps.length > 0 && (
            <div className="mt-4 max-w-xl border border-[#1d1d1d] bg-[#0C0C0C]">
              {stage.steps.map((s) => (
                <TechStepRow key={s.label} step={s} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  </section>
);

/* ------------------------------------------------------------ doc reader --- */

// Just enough markdown for the bootstrap docs: #-headings, - lists, **bold**,
// `code`, paragraphs. Anything else renders as the plain text it is.
const mdInline = (s: string): React.ReactNode[] =>
  s.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="text-[#EDEDED] font-medium">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} style={{ fontFamily: mono, fontSize: "0.88em" }} className="text-[#C9C9C9]">
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i} className="text-[#B9B9B9]">{part.slice(1, -1)}</em>;
    return part;
  });

const MdLite = ({ text }: { text: string }) => {
  const blocks = text.replace(/\r/g, "").trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const out: React.ReactNode[] = [];
        let para: string[] = [];
        let list: string[] = [];
        const flushPara = () => {
          if (para.length) {
            out.push(
              <p key={`p${out.length}`} className="text-[13.5px] leading-relaxed text-[#D6D6D6] mb-3">
                {para.map((l, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {mdInline(l)}
                  </React.Fragment>
                ))}
              </p>,
            );
            para = [];
          }
        };
        const flushList = () => {
          if (list.length) {
            out.push(
              <ul key={`u${out.length}`} className="mb-3 space-y-1.5 pl-4">
                {list.map((li, i) => (
                  <li key={i} className="text-[13.5px] leading-relaxed text-[#D6D6D6] list-disc marker:text-[#5a5a5a]">
                    {mdInline(li)}
                  </li>
                ))}
              </ul>,
            );
            list = [];
          }
        };
        for (const line of lines) {
          const h = line.match(/^(#{1,6})\s+(.*)$/);
          const li = line.match(/^\s*[-*]\s+(.*)$/);
          if (/^\s*-{3,}\s*$/.test(line)) {
            flushPara(); flushList();
            out.push(<hr key={`r${out.length}`} className="my-4 border-[#222]" />);
            continue;
          }
          const q = line.match(/^>\s?(.*)$/);
          if (q) {
            flushPara(); flushList();
            out.push(
              <p key={`q${out.length}`} className="text-[13px] leading-relaxed text-[#ABABAB] border-l border-[#333] pl-3 mb-3">
                {mdInline(q[1])}
              </p>,
            );
            continue;
          }
          if (h) {
            flushPara(); flushList();
            const lvl = h[1].length;
            out.push(
              <div
                key={`h${out.length}`}
                className={lvl === 1 ? "text-[15px] text-[#EDEDED] font-medium mt-1 mb-3" : "text-[11px] uppercase tracking-[0.14em] text-[#8A8A8A] mt-5 mb-2"}
                style={lvl === 1 ? undefined : { fontFamily: mono }}
              >
                {h[2]}
              </div>,
            );
          } else if (li) {
            flushPara();
            list.push(li[1]);
          } else {
            flushList();
            para.push(line);
          }
        }
        flushPara(); flushList();
        return <React.Fragment key={bi}>{out}</React.Fragment>;
      })}
    </>
  );
};

type OpenDoc = { name: string; file: string };

const DocReader = ({ doc, onClose }: { doc: OpenDoc; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ok"; text: string }
  >({ status: "loading" });

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    fetch(`${DATA_BASE_URL}/ted/${doc.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((t) => alive && setState({ status: "ok", text: t }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [doc.file]);

  return (
    <dialog
      ref={ref}
      className="wf-doc"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      style={{
        padding: 0,
        border: "1px solid #262626",
        background: "#0C0C0C",
        color: "#EDEDED",
        width: "min(92vw, 680px)",
        maxHeight: "86vh",
      }}
      aria-label={`${doc.name} — read-only`}
    >
      <div className="flex items-baseline gap-3 px-5 sm:px-7 pt-5 pb-4 border-b border-[#1d1d1d] sticky top-0" style={{ background: "#0C0C0C" }}>
        <span className="text-[13px] text-[#EDEDED]" style={{ fontFamily: mono }}>
          {doc.name}
        </span>
        <span className="text-[9.5px] uppercase tracking-wider text-[#6E6E6E] hidden sm:inline" style={{ fontFamily: mono }}>
          read-only · synced daily from ted-workspace
        </span>
        <form method="dialog" className="ml-auto">
          <button
            className="text-[#8A8A8A] hover:text-[#EDEDED] transition-colors text-base leading-none px-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
            aria-label="Close"
          >
            ✕
          </button>
        </form>
      </div>
      <div className="px-5 sm:px-7 py-5 overflow-y-auto" style={{ maxHeight: "calc(86vh - 61px)" }}>
        {state.status === "loading" && (
          <p className="text-xs text-[#8A8A8A]" style={{ fontFamily: mono }}>loading…</p>
        )}
        {state.status === "error" && (
          <p className="text-xs text-[#8A8A8A]" style={{ fontFamily: mono }}>
            could not load this document — please try again later.
          </p>
        )}
        {state.status === "ok" && <MdLite text={state.text} />}
      </div>
    </dialog>
  );
};

const TedBootDocs = ({ onOpen }: { onOpen: (d: OpenDoc) => void }) => (
  <div className="-mt-6 mb-16 sm:mb-20 ml-1 pl-7 sm:pl-9">
    <div
      className="text-[10px] uppercase tracking-wider text-[#6E6E6E] mb-2.5"
      style={{ fontFamily: mono }}
    >
      His bootstrap documents — read them
    </div>
    <div className="flex flex-wrap gap-2">
      {TED_BOOT_DOCS.map((d) => (
        <button
          key={d.name}
          onClick={() => onOpen({ name: d.name, file: d.reader! })}
          className="px-2.5 py-1.5 text-[11px] border border-[#262626] text-[#C9C9C9] hover:text-[#EDEDED] hover:border-[#7FA6C9]/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
          style={{ fontFamily: mono }}
          title={d.desc}
        >
          {d.name}
        </button>
      ))}
    </div>
  </div>
);

/* ---------------------------------------------------------------- bridge --- */

const Bridge = ({ mode }: { mode: Mode }) => (
  <section aria-label="Between the brothers" className="mb-16 sm:mb-20">
    <div className="border border-[#1d1d1d] bg-[#0C0C0C] px-5 py-6 sm:px-8 sm:py-8">
      <div
        className="text-[10px] uppercase tracking-[0.22em] text-[#D98E8E] mb-4"
        style={{ fontFamily: mono }}
      >
        Between the brothers
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-[#1a1a1a] px-4 py-4">
          <div className="text-[11px] text-[#8A8A8A] mb-1.5" style={{ fontFamily: mono }}>
            Vince's diary
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
            private — Ted never reads it
          </div>
        </div>
        <div className="border border-[#EDEDED]/25 px-4 py-4 bg-[#101010]">
          <div className="text-[11px] text-[#EDEDED] mb-1.5" style={{ fontFamily: mono }}>
            The letters
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#9ED69E]" style={{ fontFamily: mono }}>
            shared — both brothers read
          </div>
        </div>
        <div className="border border-[#1a1a1a] px-4 py-4">
          <div className="text-[11px] text-[#8A8A8A] mb-1.5" style={{ fontFamily: mono }}>
            Ted's diary
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
            private — Vince never reads it
          </div>
        </div>
      </div>
      <p className="mt-5 text-[13.5px] text-[#EDEDED]/80 leading-relaxed max-w-2xl">
        Two private diaries, one shared mailbox. The letters travel through a
        shared folder both brothers can reach; the diaries never cross.
      </p>
      {mode === "tech" && (
        <p className="mt-3 text-[12px] text-[#8A8A8A] leading-relaxed max-w-2xl">
          Privacy between the brothers is enforced by construction: Ted's
          machine checks out only the shared folders of the pipeline repo, and
          each diary lives in a private workspace repo the other has no access
          to.
        </p>
      )}
    </div>
  </section>
);

/* ------------------------------------------------------------- documents --- */

const DocEntry = ({ d, onOpen }: { d: Doc; onOpen: (o: OpenDoc) => void }) => {
  const inner = (
    <>
      <span className="flex items-baseline gap-2 flex-wrap">
        <span
          className="text-[11.5px] text-[#EDEDED] border-b border-[#EDEDED]/20 group-hover:border-[#EDEDED]/70 transition-colors"
          style={{ fontFamily: mono }}
        >
          {d.name}
        </span>
        {d.reader && (
          <span
            className="text-[9px] uppercase tracking-wider text-[#9ED69E]/80"
            style={{ fontFamily: mono }}
          >
            read it here
          </span>
        )}
        {d.priv && (
          <span
            className="text-[9px] uppercase tracking-wider text-[#5a5a5a]"
            style={{ fontFamily: mono }}
          >
            private
          </span>
        )}
      </span>
      <span className="block mt-1 text-[12px] text-[#8A8A8A] leading-relaxed">{d.desc}</span>
    </>
  );
  if (d.reader) {
    return (
      <button
        onClick={() => onOpen({ name: d.name, file: d.reader! })}
        className="group block text-left w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
      >
        {inner}
      </button>
    );
  }
  return (
    <a
      href={d.href}
      {...(d.href!.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className="group block focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
    >
      {inner}
    </a>
  );
};

const Documents = ({ onOpen }: { onOpen: (o: OpenDoc) => void }) => (
  <section aria-label="Key documents" className="mt-4">
    <div
      className="text-[10px] uppercase tracking-[0.22em] text-[#8A8A8A] mb-2"
      style={{ fontFamily: mono }}
    >
      04 · The papers
    </div>
    <h3 className="text-[#EDEDED] text-lg sm:text-xl font-medium tracking-tight mb-3">
      Key documents
    </h3>
    <p className="text-[13px] text-[#8A8A8A] leading-relaxed max-w-2xl mb-8">
      The written ground the brothers stand on. Neither invents biography or
      behavior — everything they are comes from these files. Ted's bootstrap
      documents open right here, as read-only copies synced daily from his
      workspace.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
      {DOCS.map((col) => (
        <div key={col.heading}>
          <div
            className="text-[10px] uppercase tracking-[0.18em] mb-3"
            style={{ fontFamily: mono, color: col.accent }}
          >
            {col.heading}
          </div>
          <ul className="space-y-3.5">
            {col.docs.map((d) => (
              <li key={d.name}>
                <DocEntry d={d} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------- root -- */

const WorkflowMap = () => {
  const [mode, setMode] = useState<Mode>("story");
  const [openDoc, setOpenDoc] = useState<OpenDoc | null>(null);

  return (
    <div className="w-full">
      <style>{railCss}</style>
      {openDoc && <DocReader doc={openDoc} onClose={() => setOpenDoc(null)} />}

      <p className="text-[15px] sm:text-base leading-relaxed text-[#EDEDED]/90 max-w-2xl mb-8">
        Vince, the artist, turns each morning's news into one photograph from
        his neighborhood in South LA. His brother Ted, the gallerist, carries
        the work into the world. Both are AI. This is how their days go.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div
          className="flex gap-1 p-0.5 border border-[#222] w-fit"
          role="tablist"
          aria-label="Level of detail"
        >
          {(
            [
              ["story", "The story"],
              ["tech", "Under the hood"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className="px-4 py-1.5 text-xs uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/50"
              style={{
                fontFamily: mono,
                color: mode === m ? "#0A0A0A" : "#8A8A8A",
                backgroundColor: mode === m ? "#EDEDED" : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8A8A8A] max-w-sm sm:text-right leading-relaxed">
          {mode === "story"
            ? "What happens, plainly."
            : "Every model call, gate, schedule, and record. Tap a step to open it."}
        </p>
      </div>

      {mode === "tech" && <Legend />}

      {mode === "story" ? (
        <>
          <StoryGroup group={VINCE} delay="0s" />
          <Bridge mode={mode} />
          <StoryGroup group={TED} delay="2.5s" />
          <StoryGroup group={LOOPS} delay="5s" />
        </>
      ) : (
        <>
          <TechGroup group={VINCE} delay="0s" />
          <Bridge mode={mode} />
          <TechGroup group={TED} delay="2.5s" />
          <TedBootDocs onOpen={setOpenDoc} />
          <TechGroup group={LOOPS} delay="5s" />
          <Documents onOpen={setOpenDoc} />
        </>
      )}
    </div>
  );
};

export default WorkflowMap;
