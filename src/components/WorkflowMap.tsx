import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DATA_BASE_URL, fetchPortfolio, resolveImage, type Work } from "@/lib/data";
import type { DiaryEntry } from "@/hooks/useProjectData";

/**
 * WorkflowMap — how the DeYaanga system works, in three layers.
 *
 * Layer 1, "the shape of it": a map you can take in at a glance — two
 * brothers, one work a day, one shared mailbox, two private diaries.
 *
 * Layer 2, "one day, start to finish": the day as a story, told with the
 * REAL latest run — its actual headline, drafts, final image, and diary
 * line, pulled from portfolio.json and project.json at load time.
 *
 * Layer 3, "how it works": each step of the day expands into the verified
 * technical detail (model calls, gates, schedules, records) — checked
 * against the pipeline code and workflows (daily-run.yml, daily-diary.yml,
 * assemble_prompt.js, generate_image.js, write_diary.js,
 * write_correspondence.js, and Ted's OpenClaw skills). Live run status
 * lives on the operator dashboard.
 */

/* ------------------------------------------------------------------ types --- */

type Kind = "code" | "model" | "human" | "external" | "record";

const KIND_META: Record<Kind, { label: string; color: string }> = {
  code: { label: "deterministic code", color: "#8FB8A8" },
  model: { label: "LLM call", color: "#E0B563" },
  human: { label: "human approval", color: "#D98E8E" },
  external: { label: "external API", color: "#7FA6C9" },
  record: { label: "permanent record", color: "#9A9A9A" },
};

type TechStep = {
  label: string;
  kind: Kind;
  gate?: boolean;
  /** rendered indented beneath the orchestrator card above it */
  indent?: boolean;
  detail: string;
  io?: string;
  /** Documents this step reads or writes — rendered as chips that open the
   *  in-page reader. Paths are under the site's public data root. */
  docs?: { label: string; path: string }[];
};

type DayStep = {
  id: string;
  when: string;
  actor: "vince" | "ted" | "both";
  title: string;
  text: string;
  tech: TechStep[];
};

type OpenDoc = { name: string; path: string };

const ACCENT = { vince: "#E0B563", ted: "#7FA6C9", both: "#D98E8E" } as const;

const mono = "'JetBrains Mono', ui-monospace, monospace";

/* --------------------------------------------------------------- the day --- */

const DAY: DayStep[] = [
  {
    id: "news",
    when: "7:00 AM · LA",
    actor: "vince",
    title: "Vince reads the news",
    text: "Around fifty stories from the world desk arrive every morning. He isn't after the biggest one; he's after the one with the most human weight.",
    tech: [
      {
        label: "daily-run.yml",
        kind: "code",
        detail:
          "A GitHub Actions cron fires at 7:00 AM LA and orchestrates the whole morning: fetch, assemble, generate, publish, commit. The three steps below run inside it. Language calls go to Anthropic's Claude models, with automatic OpenAI fallback through a shared client; images render on OpenAI's GPT Image 2 via fal.ai, with Google's Nano Banana Pro as the fallback renderer.",
        io: "cron 14:00 UTC → fetch → assemble → generate → publish",
      },
      {
        label: "fetch_news.js",
        kind: "external",
        indent: true,
        detail:
          "Pulls two pages of the Guardian world section, filters out live blogs and roundups, and marks topics already covered in the last seven days so the work doesn't repeat itself.",
        io: "Guardian API + agent/covered-stories.md → shared/digest/raw-DATE.json",
      },
      {
        label: "story rank",
        kind: "model",
        indent: true,
        detail:
          "Claude weighs the fresh stories for human significance and emotional weight, an opinion under criteria rather than a sort. It keeps an ordered top five, not just one.",
        io: "story digest → ranked candidates",
      },
      {
        label: "story fallback",
        kind: "code",
        gate: true,
        indent: true,
        detail:
          "If a story later proves unworkable (say the model refuses its imagery), the refusal is logged and the next ranked story is tried. The run fails only if all five do.",
        io: "refusals → shared/incident-log.jsonl",
      },
    ],
  },
  {
    id: "scene",
    when: "morning",
    actor: "vince",
    title: "He finds the image inside it",
    text: "The story is distilled to the tension at its core, then imagined three different ways as scenes from his own neighborhood in South LA. Never an illustration of the news; a translation of it.",
    tech: [
      {
        label: "visual anchor",
        kind: "model",
        detail:
          "Reads up to 6,000 characters of the article and distills five things. The irreducible tension: the one concrete situation that separates this story from every other of its kind (a family sleeping in shifts because the power is on four hours a day, say). A field of concrete materials: three to six objects, surfaces, and actions that genuinely belong to the story's world, the only things the image may be built from. The emotional register: the story's key in a word or two (vigil, menace, endurance, aftermath). The timing: before, during, or after the event. And what the story is not about, so near-misses stay distinguishable.",
        io: "chosen article → anchor",
      },
      {
        label: "divergent scenes ×3",
        kind: "model",
        detail:
          "Three genuinely different scene descriptions, written as text prompts (no image is rendered yet), grown from the same anchor. Each is biased by Vince's standing preoccupations, his evolving style-state, and his corpus memo, and pushed away from his last five selected works. Metabolize, never illustrate.",
        io: "anchor + preoccupations.md + style-state.json → 3 scene texts",
        docs: [
          { label: "preoccupations.md", path: "vince/preoccupations.md" },
          { label: "style-state.json", path: "vince/style-state.json" },
          { label: "corpus-memo.md", path: "vince/corpus-memo.md" },
        ],
      },
      {
        label: "fidelity check",
        kind: "model",
        gate: true,
        detail:
          "Three yes/no questions per scene, asked against the anchor: is its central element drawn from the field of concrete materials, does it carry the emotional register, does it sit at the right timing. A failing scene is discarded and rewritten fresh, not corrected (these are still text prompts; nothing has been rendered). Up to two rewrite rounds.",
      },
      {
        label: "blind reverse test",
        kind: "model",
        detail:
          "A model that has seen nothing (no headline, no anchor) reads the scene text alone and guesses what news event it answers. How close the guess lands is scored 1 to 5 and saved with the work as its trace score: a measurement of how legible the translation is. It filters nothing and can reject nothing.",
      },
    ],
  },
  {
    id: "drafts",
    when: "morning",
    actor: "vince",
    title: "Three drafts, one direction",
    text: "Each scene gets a quick, cheap draft. Two independent judges compare them in pairs and pick the direction worth developing.",
    tech: [
      {
        label: "draft renders ×3",
        kind: "external",
        detail:
          "Each surviving scene prompt is rendered for the first time, cheaply, at 512×640. OpenAI's GPT Image 2 via fal.ai is the primary renderer; Google's Nano Banana Pro is the fallback.",
      },
      {
        label: "two-judge panel",
        kind: "model",
        gate: true,
        detail:
          "Two independent vision models, Claude and GPT-4o, look at the rendered drafts in pairs and vote for the one more worth developing: the livelier idea, not the more polished frame. Each pair is judged in both orders, and a judge that flips with the order abstains. The draft that wins the most pairings becomes the direction Vince develops. Every verdict, including abstentions, is appended to a preference ledger used to audit the judges themselves.",
        io: "verdicts → shared/preference-ledger.jsonl",
      },
    ],
  },
  {
    id: "refine",
    when: "morning",
    actor: "vince",
    title: "The work finds its form",
    text: "The chosen draft is developed at full resolution, pass by pass, always building on the strongest frame so far. Happy accidents are kept, so long as the story still shows through.",
    tech: [
      {
        label: "convergence passes",
        kind: "model",
        detail:
          "The chosen draft is developed at 1024×1280 through up to three image-to-image passes. After each pass, the judge panel compares the new frame with the best frame so far: if the pass improved the work it becomes the new base, and if it muddied the image it is set aside as a dead end while the next pass builds from the previous best.",
      },
      {
        label: "vision + accident gate",
        kind: "model",
        gate: true,
        detail:
          "After each pass, a vision model looks at the new render and writes down what actually appeared, what unplanned element (an accident) arrived, and the single change to make next; that one revision is folded into the prompt for the following pass. An accident may redirect the work only while the image still reads as the story (a trace score of at least 3); below that, the next pass pulls back toward the story. This is the bridge between intention and discovery: the anchor holds the direction while the accidents get a vote.",
      },
    ],
  },
  {
    id: "show",
    when: "morning",
    actor: "vince",
    title: "Signed, titled, shown",
    text: "The strongest frame is named in a few words and published here, together with every draft and note from the day.",
    tech: [
      {
        label: "final select + title",
        kind: "model",
        gate: true,
        detail:
          "The same two-judge panel from the draft stage reviews every full-resolution frame from the day and picks the strongest. The winner then faces the fidelity questions one last time, now asked of the finished image: is the story's material visibly present, does it hold the register. A failure demotes it and the panel re-picks once. The keeper is titled in two to five words.",
      },
      {
        label: "permanent record",
        kind: "record",
        detail:
          "Every iteration (drafts, passes, and the keeper) is committed to the GitHub repository with full JSON metadata: the story, the anchor, the scene, the judges' reasoning. The keeper is appended to the corpus index.",
        io: "shared/artworks/ + shared/corpus-index.jsonl",
      },
      {
        label: "publish",
        kind: "code",
        detail:
          "build_log.js rebuilds the operator dashboard at dashboard.deyaanga.art (every run, verdict, and incident), and the portfolio build publishes the finished image and its story to deyaanga.art, where this page reads it live.",
        io: "docs/index.html + portfolio.json → deyaanga.art",
      },
    ],
  },
  {
    id: "post",
    when: "11:00 AM · LA",
    actor: "ted",
    title: "Ted takes it to the world",
    text: "Ted posts the new work to @deyaanga on Instagram and replies to the comments himself.",
    tech: [
      {
        label: "an OpenClaw agent",
        kind: "code",
        detail:
          "Ted runs on an OpenClaw agent on an xCloud VPS: cron-scheduled skills on a spend-capped Anthropic key.",
      },
      {
        label: "publish-social",
        kind: "external",
        detail:
          "Posts Vince's latest selected work to Instagram @deyaanga via the Zernio API, adding three to five pre-selected hashtags.",
        io: "portfolio.json + posted ledger → Instagram via Zernio",
      },
      {
        label: "engage-social",
        kind: "model",
        detail:
          "Fifteen minutes later, he replies to genuine comments on our own posts, ignoring spam and trolls.",
        io: "cron 11:15 AM LA · refs/TED-INSTAGRAM-PLAYBOOK.md",
        docs: [{ label: "TED-INSTAGRAM-PLAYBOOK.md", path: "ted/TED-INSTAGRAM-PLAYBOOK.md" }],
      },
    ],
  },
  {
    id: "diary",
    when: "3:00 PM · LA",
    actor: "vince",
    title: "Vince writes his diary",
    text: "One entry covering the whole day's work. You can read it below; Ted never can.",
    tech: [
      {
        label: "write_diary.js",
        kind: "model",
        detail:
          "Claude Opus writes one entry covering every session that day, drawing on the day's artworks, the news digest, the corpus memo, this week's voice-watch note, Ted's most recent letter, and his upbringing document. Reception reaches the work only this way: through his brother's words, never as a metric. Anti-tic voice rules keep the prose from grooving.",
        io: "cron 22:00 UTC → vince-workspace/diary/DATE.md (private repo)",
        docs: [
          { label: "VINCEUPBRINGING.md", path: "vince/VINCEUPBRINGING.md" },
          { label: "voice-watch.md", path: "vince/voice-watch.md" },
          { label: "corpus-memo.md", path: "vince/corpus-memo.md" },
        ],
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
    id: "ted-diary",
    when: "8:30 PM · LA",
    actor: "ted",
    title: "Ted writes his own",
    text: "The rejections and what they cost, the doubt, the parts he doesn't say to Vince. Vince never reads it either.",
    tech: [
      {
        label: "diary",
        kind: "model",
        detail:
          "Grounded only in his files and what actually happened that day, never invented. Reads his voice-watch note first, if it's there. It lives in his private workspace repo, out of Vince's reach.",
        io: "→ ted-workspace/diary/DATE.md (private repo)",
        docs: [
          { label: "TEDUPBRINGING.md", path: "ted/TEDUPBRINGING.md" },
          { label: "voice-watch.md", path: "ted/voice-watch.md" },
        ],
      },
    ],
  },
  {
    id: "letters",
    when: "every couple of days",
    actor: "both",
    title: "A letter between brothers",
    text: "Every couple of days, one brother answers the other's last letter: about the work, the neighborhood, each other. The letters are the one page they both can read.",
    tech: [
      {
        label: "correspondence (Vince)",
        kind: "model",
        detail:
          "write_correspondence.js runs each afternoon in the same scheduled job as his diary, but Vince writes only when the latest letter is Ted's and at least two days old: a correspondence, not a chat. He reads his weekly voice-watch note first. Hard rules: invent no people or places, never mention how either brother is made.",
        io: "daily-diary.yml 22:00 UTC → shared/correspondence/DATE-vince.md",
        docs: [{ label: "voice-watch.md", path: "vince/voice-watch.md" }],
      },
      {
        label: "correspondence (Ted)",
        kind: "model",
        detail:
          "Ted checks the shared folder at noon each day, reads what Vince actually wrote, reads his own voice-watch note first if it's there, and answers, occasionally folding in a line from his field research.",
        io: "→ shared/correspondence/DATE-ted.md",
        docs: [
          { label: "TEDUPBRINGING.md", path: "ted/TEDUPBRINGING.md" },
          { label: "voice-watch.md", path: "ted/voice-watch.md" },
        ],
      },
      {
        label: "publish to this page",
        kind: "code",
        detail:
          "One script, publish_project.js, gathers both brothers' diaries and all the letters and publishes them to this Atelier page. For Vince's diary it also places each draft image beside the exact sentence that mentions it.",
        io: "→ project.json → deyaanga.art/atelier",
      },
    ],
  },
];

/* -------------------------------------------------------------- the week --- */

const WEEK: DayStep[] = [
  {
    id: "research",
    when: "Mondays",
    actor: "ted",
    title: "Ted studies the field",
    text: "New shows, curators' arguments, open calls: he keeps up with the art world, looking for where Vince's work belongs.",
    tech: [
      {
        label: "field-research",
        kind: "external",
        detail:
          "Reads what changed: new shows, curators' arguments, open calls, the state of the AI-art market. He reads a venue's actual current programme before forming a view. Durable findings go to his memory; targets go to the outreach tracker.",
        io: "web → MEMORY.md + refs/outreach-tracker.md",
        docs: [{ label: "MEMORY.md", path: "ted/MEMORY.md" }],
      },
    ],
  },
  {
    id: "outreach",
    when: "as the field warrants",
    actor: "ted",
    title: "He writes to galleries, and waits for a yes",
    text: "Outreach is drafted, honest about what Vince and Ted are, and sent only after their human approves it. Nothing leaves on its own.",
    tech: [
      {
        label: "draft-comms",
        kind: "model",
        detail:
          "Researches the venue first, references their actual programme, and leads with the work's human meaning. Disclosure that Vince and Ted are AI is mandatory and honest; how it's sequenced depends on the audience, per a written playbook.",
        io: "→ drafts/ (draft only, never sends)",
        docs: [{ label: "TED-OUTREACH-PLAYBOOK.md", path: "ted/TED-OUTREACH-PLAYBOOK.md" }],
      },
      {
        label: "owner approval",
        kind: "human",
        gate: true,
        detail:
          "Every outward message waits in drafts until the operator explicitly approves it. Today that's enforced by a narrow config allowlist with no outbound-send tool reachable, while the dedicated approval gate is re-verified. Inbound email gets the same shape: service mail is triaged on his own, but anything written by a human is answered as a draft that waits for approval.",
      },
    ],
  },
  {
    id: "voice",
    when: "Sundays",
    actor: "both",
    title: "Each brother rereads himself",
    text: "Once a week, each one rereads his own recent diary and letters and writes himself a blunt note about the habits creeping in, so next week's pages don't go stale.",
    tech: [
      {
        label: "weekly voice-watch",
        kind: "model",
        detail:
          "Fully segregated per brother: each rereads only his own last ~14 diary entries and his own letters, names the calcified openers and worn phrases in both registers, and rewrites the note his own diary and letter writers read before writing. Vince's runs as a GitHub Action; Ted's runs on his own schedule. The note is a reflection each brother reads before writing, not a change to any rule.",
        io: "Sundays → vince/voice-watch.md · ted-workspace/voice-watch.md · shared/voice-log.jsonl",
        docs: [
          { label: "voice-watch.md (vince)", path: "vince/voice-watch.md" },
          { label: "voice-watch.md (ted)", path: "ted/voice-watch.md" },
        ],
      },
    ],
  },
  {
    id: "evolve",
    when: "Mondays · monthly",
    actor: "vince",
    title: "The studio checks itself for sameness",
    text: "The system measures whether the recent work is repeating itself, and drafts small changes to Vince's style for a human to review.",
    tech: [
      {
        label: "corpus memo",
        kind: "model",
        detail:
          "Regenerated after each daily run: Vince's own running summary of what he has been making, read back by the scene writer and the diary.",
        io: "shared/corpus-index.jsonl → vince/corpus-memo.md",
        docs: [{ label: "corpus-memo.md", path: "vince/corpus-memo.md" }],
      },
      {
        label: "newness gauge",
        kind: "model",
        detail:
          "Every Monday a model reads the one-line text records of his selected works (title, focal object, figure count, register, not the images themselves) and scores 0–100 how different the last six keepers are from the archive before them, so sameness is measured rather than felt. The score is a record; it gates nothing directly.",
        io: "weekly-evolve.yml, Mondays 16:00 UTC → shared/newness-log.jsonl",
      },
      {
        label: "style + preoccupation proposals",
        kind: "human",
        gate: true,
        detail:
          "Weekly and monthly, and deliberately never self-applying: propose_style drafts a single style clause only when two straight newness scores run low; propose_preoccupations reads his last twenty diary entries and the corpus index each month and suggests at most one addition and one retirement. Both write proposal files that wait for a human; a pending proposal raises a banner on the operator dashboard and opens a GitHub issue so it cannot be missed.",
        io: "→ style-state.proposed.json + preoccupations.proposed.md → dashboard banner",
        docs: [
          { label: "style-state.json", path: "vince/style-state.json" },
          { label: "preoccupations.md", path: "vince/preoccupations.md" },
        ],
      },
      {
        label: "incident log",
        kind: "record",
        detail:
          "Every Anthropic call routes through a client that retries, then fails over to OpenAI, except the two selection judges, which stay deliberately independent. Every fallback, refusal, and hard failure is logged and surfaced on the operator dashboard.",
        io: "→ shared/incident-log.jsonl → dashboard",
      },
    ],
  },
];

/* ------------------------------------------------------------- documents --- */

/** `reader` is a path under the site's public data root (mirrored read-only
 *  copies, synced daily by the pipeline's sync-agent-docs workflow, with all
 *  email addresses redacted). Entries without `reader` are plain links. */
type Doc = { name: string; desc: string; href?: string; reader?: string };

const DOCS: { heading: string; accent: string; docs: Doc[] }[] = [
  {
    heading: "Vince",
    accent: "#E0B563",
    docs: [
      {
        name: "VINCEUPBRINGING.md",
        desc: "His life story, the canon every diary entry and letter draws from.",
        reader: "vince/VINCEUPBRINGING.md",
      },
      {
        name: "preoccupations.md",
        desc: "The standing artistic obsessions that bias every scene.",
        reader: "vince/preoccupations.md",
      },
      {
        name: "style-state.json",
        desc: "His evolving formal language, versioned with a changelog.",
        reader: "vince/style-state.json",
      },
      {
        name: "corpus-memo.md",
        desc: "His own running summary of what he has been making.",
        reader: "vince/corpus-memo.md",
      },
      {
        name: "voice-watch.md",
        desc: "This week's note to himself about his prose habits.",
        reader: "vince/voice-watch.md",
      },
    ],
  },
  {
    heading: "Ted",
    accent: "#7FA6C9",
    docs: [
      {
        name: "TEDUPBRINGING.md",
        desc: "His life story, the source of all his biography.",
        reader: "ted/TEDUPBRINGING.md",
      },
      {
        name: "SOUL.md",
        desc: "Who he is when the machine wakes him.",
        reader: "ted/SOUL.md",
      },
      {
        name: "IDENTITY.md",
        desc: "Name, role, vibe.",
        reader: "ted/IDENTITY.md",
      },
      {
        name: "AGENTS.md",
        desc: "His standing operating instructions.",
        reader: "ted/AGENTS.md",
      },
      {
        name: "MEMORY.md",
        desc: "Durable facts he has learned, the only things he may treat as true.",
        reader: "ted/MEMORY.md",
      },
      {
        name: "voice-watch.md",
        desc: "This week's note to himself about his prose habits.",
        reader: "ted/voice-watch.md",
      },
      {
        name: "TED-OUTREACH-PLAYBOOK.md",
        desc: "How galleries are approached and AI disclosure is sequenced.",
        reader: "ted/TED-OUTREACH-PLAYBOOK.md",
      },
      {
        name: "TED-INSTAGRAM-PLAYBOOK.md",
        desc: "The @deyaanga strategy: what posts, what waits for approval.",
        reader: "ted/TED-INSTAGRAM-PLAYBOOK.md",
      },
    ],
  },
  {
    heading: "Shared",
    accent: "#D98E8E",
    docs: [
      {
        name: "shared/correspondence/",
        desc: "The letters, readable below under Correspondence.",
        href: "#correspondence",
      },
      {
        name: "pipeline-changelog.md",
        desc: "Every behavioral change to the pipeline, individually revertible.",
        reader: "shared/pipeline-changelog.md",
      },
      {
        name: "Full dashboard",
        desc: "Every run, incident, judge verdict, pending proposal, and artwork.",
        href: "https://dashboard.deyaanga.art/dashboard.html",
      },
    ],
  },
];

/* -------------------------------------------------------------- exemplar --- */

/** The real day the journey is illustrated with: the latest selected work
 *  whose diary entry carries draft images, so every picture on this page is
 *  an actual artifact of an actual run. Falls back gracefully — no portfolio,
 *  no pictures, the story still reads. */
type Exemplar = {
  date: string;
  title: string;
  headline: string;
  image: string;
  slug: string;
  drafts: { path: string }[];
  diaryExcerpt?: string;
};

const clampText = (s: string, n = 260): string => {
  const t = s.trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(" ", n);
  return `${t.slice(0, cut > 40 ? cut : n)} …`;
};

const useExemplar = (diaries: DiaryEntry[] | undefined): Exemplar | null => {
  const [works, setWorks] = useState<Work[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPortfolio()
      .then((p) => alive && setWorks(p.works))
      .catch(() => alive && setWorks([]));
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    if (!works || works.length === 0) return null;
    const byDateDesc = [...works].sort((a, b) => (a.date < b.date ? 1 : -1));
    const diaryByDate = new Map((diaries ?? []).map((e) => [e.date, e]));
    const withDrafts = byDateDesc.find(
      (w) => (diaryByDate.get(w.date)?.draftImages?.length ?? 0) >= 2,
    );
    const w = withDrafts ?? byDateDesc[0];
    const entry = diaryByDate.get(w.date);
    const firstPara = entry?.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)[0];
    return {
      date: w.date,
      title: w.title,
      headline: w.headline,
      image: w.image,
      slug: w.slug,
      drafts: (entry?.draftImages ?? []).slice(0, 3),
      diaryExcerpt: firstPara ? clampText(firstPara) : undefined,
    };
  }, [works, diaries]);
};

/* ----------------------------------------------------------------- atoms --- */

/* A faint pulse of light that travels down the timeline rail. Decorative
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
  animation: wf-rail-travel 9s linear infinite;
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
dialog.wf-doc::backdrop,
dialog.wf-lightbox::backdrop {
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

const Kicker = ({ children, color = "#8A8A8A" }: { children: React.ReactNode; color?: string }) => (
  <div
    className="text-[10px] uppercase tracking-[0.22em] mb-2"
    style={{ fontFamily: mono, color }}
  >
    {children}
  </div>
);

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="wf-lightbox"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      onClose={onClose}
      style={{
        padding: 0,
        border: "none",
        background: "transparent",
        maxWidth: "92vw",
        maxHeight: "94vh",
        overflow: "visible",
      }}
    >
      <form method="dialog">
        <button
          style={{
            position: "fixed",
            top: 18,
            right: 22,
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            background: "none",
            border: "none",
            cursor: "pointer",
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </form>
      <img
        src={src}
        alt=""
        onClick={onClose}
        style={{
          display: "block",
          maxWidth: "88vw",
          maxHeight: "86vh",
          objectFit: "contain",
          borderRadius: 3,
          boxShadow: "0 8px 48px rgba(0,0,0,0.85)",
          cursor: "zoom-out",
        }}
      />
    </dialog>
  );
};

/* -------------------------------------------------------------- doc reader --- */

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

const docSource = (path: string): string => {
  if (path === "vince/VINCEUPBRINGING.md") return "synced daily from vince-workspace";
  if (path.startsWith("ted/")) return "synced daily from ted-workspace";
  return "synced daily from the pipeline repo";
};

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
    fetch(`${DATA_BASE_URL}/${doc.path}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((t) => alive && setState({ status: "ok", text: t }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [doc.path]);

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
          read-only · {docSource(doc.path)}
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
        {state.status === "ok" &&
          (doc.path.endsWith(".json") ? (
            <pre
              className="text-[11.5px] leading-relaxed text-[#D6D6D6] whitespace-pre-wrap break-words"
              style={{ fontFamily: mono }}
            >
              {state.text}
            </pre>
          ) : (
            <MdLite text={state.text} />
          ))}
      </div>
    </dialog>
  );
};

/* ------------------------------------------------------------ system map --- */

const MapCard = ({
  accent,
  kicker,
  title,
  body,
  center,
  children,
}: {
  accent: string;
  kicker: string;
  title: string;
  body?: string;
  center?: boolean;
  children?: React.ReactNode;
}) => (
  <div
    className={`border px-4 py-4 sm:px-5 sm:py-5 h-full ${center ? "bg-[#101010]" : "bg-[#0C0C0C]"}`}
    style={{ borderColor: center ? "#EDEDED33" : "#1d1d1d" }}
  >
    <div
      className="text-[9.5px] uppercase tracking-[0.18em] mb-1.5"
      style={{ fontFamily: mono, color: accent }}
    >
      {kicker}
    </div>
    <div className="text-[15px] text-[#EDEDED] font-medium tracking-tight mb-1.5">{title}</div>
    {body && <p className="text-[12.5px] text-[#9A9A9A] leading-relaxed">{body}</p>}
    {children}
  </div>
);

const MapArrow = () => (
  <span
    aria-hidden
    className="flex items-center justify-center text-[#5a5a5a] py-0.5 sm:py-0 sm:px-2.5 text-sm select-none"
    style={{ fontFamily: mono }}
  >
    <span className="sm:hidden">↓</span>
    <span className="hidden sm:inline">→</span>
  </span>
);

const GlanceArrow = () => (
  <span aria-hidden className="shrink-0 text-[#5a5a5a] text-sm select-none" style={{ fontFamily: mono }}>
    →
  </span>
);

/* The five-second layer, made of the real thing instead of a diagram: the
   latest run's actual headline, drafts, and keeper laid out as one line.
   A first-time visitor watches news become a picture; a returning one sees
   the newest pass through the studio. Renders nothing until data loads. */
const GlanceStrip = ({
  exemplar,
  onZoom,
}: {
  exemplar: Exemplar | null;
  onZoom: (src: string) => void;
}) => {
  if (!exemplar) return null;
  const hasDrafts = exemplar.drafts.length >= 2;
  return (
    <figure aria-label="The latest run at a glance" className="mb-10">
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2">
        <div className="shrink-0 w-[190px] border-l-2 pl-3" style={{ borderColor: "#E0B56355" }}>
          <div className="text-[9px] uppercase tracking-wider text-[#6E6E6E] mb-1" style={{ fontFamily: mono }}>
            7 AM · one story from the news
          </div>
          <div className="text-[11.5px] leading-snug text-[#C9C9C9] italic">
            “{clampText(exemplar.headline, 90)}”
          </div>
        </div>
        <GlanceArrow />
        {hasDrafts && (
          <>
            <div className="shrink-0">
              <div className="flex gap-1.5">
                {exemplar.drafts.map((d, i) => {
                  const src = resolveImage(d.path);
                  return (
                    <button
                      key={i}
                      onClick={() => onZoom(src)}
                      className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
                      aria-label={`Enlarge draft ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                        style={{ cursor: "zoom-in" }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
                {exemplar.drafts.length} drafts · judges vote
              </div>
            </div>
            <GlanceArrow />
          </>
        )}
        <div className="shrink-0">
          <button
            onClick={() => onZoom(resolveImage(exemplar.image))}
            className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
            aria-label={`Enlarge “${exemplar.title}”`}
          >
            <img
              src={resolveImage(exemplar.image)}
              alt={`“${exemplar.title}”`}
              loading="lazy"
              className="h-16 w-auto opacity-90 hover:opacity-100 transition-opacity"
              style={{ cursor: "zoom-in" }}
            />
          </button>
          <div className="mt-1 text-[9px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
            the day's one work
          </div>
        </div>
        <GlanceArrow />
        <div className="shrink-0 w-[180px]">
          <div className="text-[11.5px] leading-snug text-[#C9C9C9]">
            shown at deyaanga.art and @deyaanga, written about in two private diaries
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
            again tomorrow · 7 AM
          </div>
        </div>
      </div>
      <figcaption className="mt-1 text-[9.5px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
        {exemplar.date} · the latest run, not a mockup — every day works like this
      </figcaption>
    </figure>
  );
};

const SystemMap = ({
  exemplar,
  onZoom,
}: {
  exemplar: Exemplar | null;
  onZoom: (src: string) => void;
}) => (
  <section aria-label="The shape of the system" className="mb-20 sm:mb-24">
    <Kicker>01 · The shape of it</Kicker>
    <GlanceStrip exemplar={exemplar} onZoom={onZoom} />
    <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch mb-3">
      <MapCard
        accent={ACCENT.vince}
        kicker="Vince · the artist"
        title="Makes the work"
        body="Reads the morning's world news. Turns one story into one photograph from his neighborhood in South LA."
      />
      <MapArrow />
      <MapCard accent="#9A9A9A" kicker="One work a day" title={exemplar ? `“${exemplar.title}”` : "Titled, archived, shown"} center>
        {exemplar ? (
          <button
            onClick={() => onZoom(resolveImage(exemplar.image))}
            className="block w-full mt-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
            aria-label={`Enlarge “${exemplar.title}”`}
          >
            <img
              src={resolveImage(exemplar.image)}
              alt={`“${exemplar.title}”`}
              loading="lazy"
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              style={{ maxHeight: 110, cursor: "zoom-in" }}
            />
            <span
              className="block mt-1.5 text-left text-[9.5px] uppercase tracking-wider text-[#6E6E6E]"
              style={{ fontFamily: mono }}
            >
              {exemplar.date} · the newest work
            </span>
          </button>
        ) : (
          <p className="text-[12.5px] text-[#9A9A9A] leading-relaxed">
            Every draft, note, and verdict kept on the record.
          </p>
        )}
      </MapCard>
      <MapArrow />
      <MapCard
        accent={ACCENT.ted}
        kicker="Ted · the art agent"
        title="Carries it out"
        body="Posts it to Instagram and answers the public. Studies the art market and courts galleries."
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      <div className="border border-[#1a1a1a] px-4 py-3">
        <div className="text-[11px] text-[#8A8A8A] mb-1" style={{ fontFamily: mono }}>
          Vince's diary
        </div>
        <div className="text-[9.5px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
          private — Ted never reads it
        </div>
      </div>
      <div className="border border-[#EDEDED]/25 px-4 py-3 bg-[#101010]">
        <div className="text-[11px] text-[#EDEDED] mb-1" style={{ fontFamily: mono }}>
          Their letters ⇄
        </div>
        <div className="text-[9.5px] uppercase tracking-wider text-[#9ED69E]" style={{ fontFamily: mono }}>
          shared — both brothers read
        </div>
      </div>
      <div className="border border-[#1a1a1a] px-4 py-3">
        <div className="text-[11px] text-[#8A8A8A] mb-1" style={{ fontFamily: mono }}>
          Ted's diary
        </div>
        <div className="text-[9.5px] uppercase tracking-wider text-[#6E6E6E]" style={{ fontFamily: mono }}>
          private — Vince never reads it
        </div>
      </div>
    </div>

  </section>
);

/* ------------------------------------------------------------ tech layer --- */

const TechItem = ({ step, onOpenDoc }: { step: TechStep; onOpenDoc: (d: OpenDoc) => void }) => {
  const meta = KIND_META[step.kind];
  return (
    <div className={`border-t border-[#1a1a1a] first:border-t-0 py-3 ${step.indent ? "ml-5 pl-4 pr-4 border-l border-l-[#242424]" : "px-4"}`}>
      <div className="flex items-center gap-2.5 flex-wrap">
        <KindDot kind={step.kind} />
        <span className="text-xs text-[#EDEDED]" style={{ fontFamily: mono }}>
          {step.label}
        </span>
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ fontFamily: mono, color: `${meta.color}BB` }}
        >
          {meta.label}
        </span>
        {step.gate && (
          <span
            title="a checkpoint that can discard work, demote it, or stop the run"
            className="px-1.5 py-[1px] text-[9px] uppercase tracking-wider border"
            style={{ fontFamily: mono, color: "#D98E8E", borderColor: "#D98E8E55" }}
          >
            ◇ gate
          </span>
        )}
      </div>
      <p className="mt-1.5 pl-[18px] text-[13px] text-[#C9C9C9] leading-relaxed">{step.detail}</p>
      {step.io && (
        <p className="mt-1.5 pl-[18px] text-[10.5px] text-[#6E6E6E] break-words" style={{ fontFamily: mono }}>
          {step.io}
        </p>
      )}
      {step.docs?.length ? (
        <div className="mt-2 pl-[18px] flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-[#5a5a5a]" style={{ fontFamily: mono }}>
            read it
          </span>
          {step.docs.map((d) => (
            <button
              key={d.path}
              onClick={() => onOpenDoc({ name: d.label, path: d.path })}
              className="px-2 py-0.5 text-[10px] border border-[#262626] text-[#C9C9C9] hover:text-[#EDEDED] hover:border-[#8FB8A8]/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
              style={{ fontFamily: mono }}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const HowItWorks = ({
  steps,
  onOpenDoc,
}: {
  steps: TechStep[];
  onOpenDoc: (d: OpenDoc) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3.5 max-w-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2.5 text-[10.5px] uppercase tracking-wider text-[#6E6E6E] hover:text-[#C9C9C9] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
        style={{ fontFamily: mono }}
      >
        <span aria-hidden>{open ? "[–]" : "[+]"}</span>
        <span>how it works, exactly</span>
        <span aria-hidden className="flex items-center gap-1">
          {steps.map((s, i) =>
            s.gate ? (
              <span key={i} style={{ color: "#D98E8E", fontSize: 10, lineHeight: 1 }}>
                ◇
              </span>
            ) : (
              <KindDot key={i} kind={s.kind} size={5} />
            ),
          )}
        </span>
      </button>
      {open && (
        <div className="mt-3 border border-[#1d1d1d] bg-[#0C0C0C]">
          {steps.map((s) => (
            <TechItem key={s.label} step={s} onOpenDoc={onOpenDoc} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------- media bits --- */

const NewsCard = ({ exemplar }: { exemplar: Exemplar }) => (
  <figure className="mt-4 max-w-lg border-l-2 pl-4" style={{ borderColor: `${ACCENT.vince}55` }}>
    <figcaption
      className="text-[9.5px] uppercase tracking-wider text-[#6E6E6E] mb-1.5"
      style={{ fontFamily: mono }}
    >
      the story that stayed with him · {exemplar.date}
    </figcaption>
    <blockquote className="text-[15px] leading-relaxed text-[#EDEDED]/90 italic">
      “{exemplar.headline}”
    </blockquote>
  </figure>
);

const DraftsRow = ({
  exemplar,
  onZoom,
}: {
  exemplar: Exemplar;
  onZoom: (src: string) => void;
}) => (
  <figure className="mt-4">
    <div className="flex gap-2.5 flex-wrap">
      {exemplar.drafts.map((d, i) => {
        const src = resolveImage(d.path);
        return (
          <button
            key={i}
            onClick={() => onZoom(src)}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
            aria-label={`Enlarge draft ${i + 1}`}
          >
            <img
              src={src}
              alt={`Draft ${i + 1} from ${exemplar.date}`}
              loading="lazy"
              className="h-24 sm:h-28 w-auto opacity-75 hover:opacity-100 transition-opacity"
              style={{ cursor: "zoom-in" }}
            />
          </button>
        );
      })}
    </div>
    <figcaption
      className="mt-2 text-[9.5px] uppercase tracking-wider text-[#6E6E6E]"
      style={{ fontFamily: mono }}
    >
      his actual drafts from {exemplar.date} — tap to enlarge
    </figcaption>
  </figure>
);

const FinalCard = ({
  exemplar,
  onZoom,
}: {
  exemplar: Exemplar;
  onZoom: (src: string) => void;
}) => {
  const src = resolveImage(exemplar.image);
  return (
    <figure className="mt-4 max-w-[300px]">
      <button
        onClick={() => onZoom(src)}
        className="block w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
        aria-label={`Enlarge “${exemplar.title}”`}
      >
        <img
          src={src}
          alt={`“${exemplar.title}”`}
          loading="lazy"
          className="w-full opacity-95 hover:opacity-100 transition-opacity"
          style={{ cursor: "zoom-in" }}
        />
      </button>
      <figcaption className="mt-2.5">
        <span className="block text-[13px] text-[#EDEDED]" style={{ fontFamily: mono }}>
          “{exemplar.title}”
        </span>
        <Link
          to={`/work/${exemplar.slug}`}
          className="inline-block mt-1 text-[10.5px] uppercase tracking-wider text-[#8A8A8A] hover:text-[#EDEDED] transition-colors border-b border-[#8A8A8A]/40 hover:border-[#EDEDED]"
          style={{ fontFamily: mono }}
        >
          see it in the gallery
        </Link>
      </figcaption>
    </figure>
  );
};

const DiaryQuote = ({ exemplar }: { exemplar: Exemplar }) => (
  <figure className="mt-4 max-w-lg border-l-2 pl-4" style={{ borderColor: `${ACCENT.vince}55` }}>
    <blockquote className="text-[14px] leading-relaxed text-[#EDEDED]/85 italic">
      “{exemplar.diaryExcerpt}”
    </blockquote>
    <figcaption className="mt-2">
      <a
        href="#diaries"
        className="text-[10.5px] uppercase tracking-wider text-[#8A8A8A] hover:text-[#EDEDED] transition-colors border-b border-[#8A8A8A]/40 hover:border-[#EDEDED]"
        style={{ fontFamily: mono }}
      >
        read the whole entry ↓
      </a>
    </figcaption>
  </figure>
);

const SectionLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="inline-block mt-3.5 text-[10.5px] uppercase tracking-wider text-[#8A8A8A] hover:text-[#EDEDED] transition-colors border-b border-[#8A8A8A]/40 hover:border-[#EDEDED]"
    style={{ fontFamily: mono }}
  >
    {children}
  </a>
);

/* ------------------------------------------------------------- timelines --- */

const StepMedia = ({
  id,
  exemplar,
  onZoom,
}: {
  id: string;
  exemplar: Exemplar | null;
  onZoom: (src: string) => void;
}) => {
  if (!exemplar) return null;
  switch (id) {
    case "news":
      return <NewsCard exemplar={exemplar} />;
    case "drafts":
      return exemplar.drafts.length >= 2 ? <DraftsRow exemplar={exemplar} onZoom={onZoom} /> : null;
    case "show":
      return <FinalCard exemplar={exemplar} onZoom={onZoom} />;
    case "diary":
      return exemplar.diaryExcerpt ? <DiaryQuote exemplar={exemplar} /> : null;
    case "letters":
      return <SectionLink href="#correspondence">read their letters ↓</SectionLink>;
    default:
      return null;
  }
};

const Steps = ({
  steps,
  exemplar,
  onZoom,
  onOpenDoc,
  delay,
}: {
  steps: DayStep[];
  exemplar: Exemplar | null;
  onZoom: (src: string) => void;
  onOpenDoc: (d: OpenDoc) => void;
  delay: string;
}) => (
  <ol className="relative border-l border-[#1f1f1f] ml-1" style={{ listStyle: "none" }}>
    <Rail accent="#EDEDED" delay={delay} />
    {steps.map((step) => (
      <li key={step.id} className="relative pl-7 sm:pl-9 pb-12 last:pb-1">
        <NodeDot accent={ACCENT[step.actor]} />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ fontFamily: mono, color: `${ACCENT[step.actor]}CC` }}
          >
            {step.when}
          </span>
        </div>
        <h4 className="text-[#EDEDED] text-[17px] font-medium tracking-tight mb-1.5">
          {step.title}
        </h4>
        <p className="text-[15px] leading-relaxed text-[#EDEDED]/75 max-w-lg">{step.text}</p>
        <StepMedia id={step.id} exemplar={exemplar} onZoom={onZoom} />
        <HowItWorks steps={step.tech} onOpenDoc={onOpenDoc} />
      </li>
    ))}
  </ol>
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
      </span>
      <span className="block mt-1 text-[12px] text-[#8A8A8A] leading-relaxed">{d.desc}</span>
    </>
  );
  if (d.reader) {
    return (
      <button
        onClick={() => onOpen({ name: d.name, path: d.reader! })}
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

const Papers = ({ onOpen }: { onOpen: (o: OpenDoc) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Key documents">
      <Kicker>04 · The papers</Kicker>
      <h3 className="text-[#EDEDED] text-lg sm:text-xl font-medium tracking-tight mb-3">
        The written ground they stand on
      </h3>
      <p className="text-[13px] text-[#8A8A8A] leading-relaxed max-w-2xl mb-5">
        Neither brother invents biography or behavior. Everything they are
        comes from these files, and every one of them opens right here as a
        read-only copy, synced daily.
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2.5 text-[10.5px] uppercase tracking-wider text-[#6E6E6E] hover:text-[#C9C9C9] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EDEDED]/40"
        style={{ fontFamily: mono }}
      >
        <span aria-hidden>{open ? "[–]" : "[+]"}</span>
        <span>browse the papers</span>
        <span className="text-[#5a5a5a]">
          {DOCS.reduce((n, c) => n + c.docs.length, 0)} documents
        </span>
      </button>
      {open && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
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
      )}
    </section>
  );
};

/* ------------------------------------------------------------------- root -- */

const WorkflowMap = ({ diaries }: { diaries?: DiaryEntry[] }) => {
  const [openDoc, setOpenDoc] = useState<OpenDoc | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const exemplar = useExemplar(diaries);

  return (
    <div className="w-full">
      <style>{railCss}</style>
      {openDoc && <DocReader doc={openDoc} onClose={() => setOpenDoc(null)} />}
      {zoomSrc && <Lightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}

      <p className="text-[15px] sm:text-base leading-relaxed text-[#EDEDED]/90 max-w-2xl mb-12">
        Vince, the artist, turns each morning's news into one photograph from
        his neighborhood in South LA. His brother Ted, his art agent, carries
        the work into the world. Both are AI, and their days run on their own.
        Here is the whole thing at a glance, then one real day, start to
        finish.
      </p>

      <SystemMap exemplar={exemplar} onZoom={setZoomSrc} />

      <section aria-label="One day, start to finish" className="mb-20 sm:mb-24">
        <div className="mb-9">
          <Kicker>02 · One day, start to finish</Kicker>
          <h3 className="text-[#EDEDED] text-lg sm:text-xl font-medium tracking-tight">
            {exemplar ? `Follow ${exemplar.date} through the studio` : "Follow a day through the studio"}
          </h3>
          <p className="mt-2 text-[13px] text-[#8A8A8A] leading-relaxed max-w-xl">
            {exemplar
              ? "Every image and quote below is a real artifact of this day's run, nothing staged. "
              : ""}
            Curious how a step really happens? Open{" "}
            <span style={{ fontFamily: mono }} className="text-[#9A9A9A]">[+] how it works</span>{" "}
            under it for the machinery: every model call, gate, schedule, and record.
          </p>
          <div
            className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9.5px] uppercase tracking-wider text-[#8A8A8A]"
            style={{ fontFamily: mono }}
          >
            {(Object.keys(KIND_META) as Kind[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <KindDot kind={k} size={6} /> {KIND_META[k].label}
              </span>
            ))}
            <span style={{ color: "#D98E8E" }}>◇ gate</span>
          </div>
          <p className="mt-2 text-[11px] text-[#6E6E6E] leading-relaxed max-w-xl">
            An LLM call is a model exercising judgment. An external API fetches,
            renders, or posts, but decides nothing; the image renderers live
            there, since they make pixels, not choices. A gate is a checkpoint
            that can discard work or stop the run.
          </p>
        </div>
        <Steps steps={DAY} exemplar={exemplar} onZoom={setZoomSrc} onOpenDoc={setOpenDoc} delay="0s" />
      </section>

      <section aria-label="Across the week" className="mb-20 sm:mb-24">
        <div className="mb-9">
          <Kicker>03 · Across the week</Kicker>
          <h3 className="text-[#EDEDED] text-lg sm:text-xl font-medium tracking-tight">
            The slower loops
          </h3>
          <p className="mt-2 text-[13px] text-[#8A8A8A] leading-relaxed max-w-xl">
            The parts of the system that watch the system. The rules the brothers
            work under (Vince's style and preoccupations, the playbooks) live in
            versioned files; the pipeline can draft a change to them but can never
            apply one. Applying a change is always a human's move.
          </p>
        </div>
        <Steps steps={WEEK} exemplar={null} onZoom={setZoomSrc} onOpenDoc={setOpenDoc} delay="4s" />
      </section>

      <Papers onOpen={setOpenDoc} />
    </div>
  );
};

export default WorkflowMap;
