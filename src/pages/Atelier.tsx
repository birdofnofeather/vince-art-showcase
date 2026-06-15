import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProjectData, type DiaryEntry, type Letter } from "@/hooks/useProjectData";
import { DATA_BASE_URL, resolveImage } from "@/lib/data";

const SECTIONS = [
  { id: "vision", label: "Vision" },
  { id: "pipeline", label: "Pipeline" },
  { id: "diaries", label: "Diaries" },
  { id: "correspondence", label: "Correspondence" },
  { id: "activity", label: "Activity" },
];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
};

const toParagraphs = (body: string) =>
  body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

const Paragraphs = ({ body }: { body: string }) => (
  <>
    {toParagraphs(body).map((p, i) => (
      <p key={i} className="whitespace-pre-line leading-relaxed mb-4 last:mb-0">
        {p}
      </p>
    ))}
  </>
);

const DraftStrip = ({ images }: { images: string[] }) => (
  <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
    {images.map((src, i) => (
      <img
        key={i}
        src={resolveImage(src)}
        alt=""
        loading="lazy"
        className="h-28 w-auto flex-shrink-0 opacity-60 hover:opacity-90 transition-opacity"
        style={{ aspectRatio: "4/5", objectFit: "cover" }}
      />
    ))}
  </div>
);

const ProseWithAnchor = ({
  body,
  anchor,
  slug,
}: {
  body: string;
  anchor?: string;
  slug?: string;
}) => {
  const paragraphs = toParagraphs(body);

  if (!anchor || !slug) {
    return <Paragraphs body={body} />;
  }

  // Find the last paragraph that contains the anchor text
  let anchorParaIdx = -1;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    if (paragraphs[i].includes(anchor)) {
      anchorParaIdx = i;
      break;
    }
  }

  return (
    <>
      {paragraphs.map((p, i) => {
        if (i !== anchorParaIdx) {
          return (
            <p key={i} className="whitespace-pre-line leading-relaxed mb-4 last:mb-0">
              {p}
            </p>
          );
        }
        const pos = p.lastIndexOf(anchor);
        return (
          <p key={i} className="whitespace-pre-line leading-relaxed mb-4 last:mb-0">
            {p.slice(0, pos)}
            <Link
              to={`/work/${slug}`}
              className="border-b border-[#EDEDED]/30 hover:border-[#EDEDED] transition-colors"
            >
              {anchor}
            </Link>
            {p.slice(pos + anchor.length)}
          </p>
        );
      })}
    </>
  );
};

const DiaryList = ({ entries }: { entries: DiaryEntry[] }) => {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  );
  if (!sorted.length) return <p className="text-[#8A8A8A] text-sm">No entries.</p>;
  return (
    <div className="space-y-10">
      {sorted.map((e, i) => (
        <article key={i}>
          <div className="font-mono text-xs text-[#8A8A8A] mb-3">{fmtDate(e.date)}</div>
          {e.draftImages && e.draftImages.length > 0 && (
            <DraftStrip images={e.draftImages} />
          )}
          <div className="text-[#EDEDED]/95 text-[15px]">
            <ProseWithAnchor
              body={e.body}
              anchor={e.selectedAnchor}
              slug={e.selectedSlug}
            />
          </div>
        </article>
      ))}
    </div>
  );
};

const LetterBlock = ({ letter }: { letter: Letter }) => {
  const fromVince = letter.from === "vince";
  return (
    <article
      className={`border-l ${
        fromVince ? "border-[#EDEDED]/40" : "border-[#8A8A8A]/40"
      } pl-6 ${fromVince ? "" : "md:ml-12"}`}
    >
      <div className="font-mono text-xs text-[#8A8A8A] mb-3 uppercase tracking-wider">
        {letter.from} → {letter.to} · {fmtDate(letter.date)}
      </div>
      <div className={`text-[15px] ${fromVince ? "text-[#EDEDED]" : "text-[#EDEDED]/85"}`}>
        <Paragraphs body={letter.body} />
      </div>
    </article>
  );
};

import PipelineGraph from "@/components/PipelineGraph";

const Atelier = () => {
  const { data, loading, error } = useProjectData();
  const [tab, setTab] = useState<"vince" | "ted">("vince");
  const [activityOpen, setActivityOpen] = useState(false);
  const [active, setActive] = useState("vision");

  // noindex meta
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = "Atelier";
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  // section scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data]);

  const correspondenceSorted = useMemo(
    () => (data ? [...data.correspondence].sort((a, b) => (a.date < b.date ? -1 : 1)) : []),
    [data],
  );

  const runLogSorted = useMemo(
    () => (data ? [...data.runLog].sort((a, b) => (a.ts < b.ts ? 1 : -1)) : []),
    [data],
  );

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#0A0A0A",
        color: "#EDEDED",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Sticky in-page nav */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(10,10,10,0.85)", borderBottom: "1px solid #222" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-5 overflow-x-auto">
          <span
            className="text-xs uppercase tracking-[0.2em] text-[#8A8A8A] mr-4 shrink-0"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            Atelier
          </span>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs uppercase tracking-wider shrink-0 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: active === s.id ? "#EDEDED" : "#8A8A8A",
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        {loading && (
          <div className="pt-24 space-y-6" aria-hidden="true">
            <div className="h-3 w-24 bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-full bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-11/12 bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-3/4 bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-5/6 bg-[#1a1a1a] animate-pulse" />
          </div>
        )}
        {error && !loading && (
          <p className="py-32 text-center text-sm text-[#8A8A8A] font-mono">
            unable to load project data — please try again later.
          </p>
        )}

        {data && !loading && !error && (
          <>
            {/* VISION */}
            <section id="vision" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                01 / Vision
              </div>
              <p className="text-xl md:text-2xl leading-[1.55] text-[#EDEDED] max-w-3xl">
                {data.vision}
              </p>
            </section>

            <hr style={{ borderColor: "#222" }} />

            {/* PIPELINE */}
            <section id="pipeline" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                02 / Pipeline
              </div>
              <PipelineGraph nodes={data.pipeline.nodes} edges={data.pipeline.edges} />
            </section>

            <hr style={{ borderColor: "#222" }} />

            {/* DIARIES */}
            <section id="diaries" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                03 / Diaries
              </div>

              <div className="flex gap-6 mb-10" role="tablist">
                {(["vince", "ted"] as const).map((who) => (
                  <button
                    key={who}
                    role="tab"
                    aria-selected={tab === who}
                    onClick={() => setTab(who)}
                    className="text-sm pb-1 transition-colors"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      color: tab === who ? "#EDEDED" : "#8A8A8A",
                      borderBottom: tab === who ? "1px solid #EDEDED" : "1px solid transparent",
                    }}
                  >
                    {who}
                  </button>
                ))}
              </div>

              <div className="max-w-2xl">
                <DiaryList entries={tab === "vince" ? data.diaries.vince : data.diaries.ted} />
              </div>
            </section>

            <hr style={{ borderColor: "#222" }} />

            {/* CORRESPONDENCE */}
            <section id="correspondence" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                04 / Correspondence
              </div>
              <div className="space-y-12 max-w-2xl">
                {correspondenceSorted.map((l, i) => (
                  <LetterBlock key={i} letter={l} />
                ))}
              </div>
            </section>

            <hr style={{ borderColor: "#222" }} />

            {/* ACTIVITY */}
            <section id="activity" className="pt-24 pb-32 scroll-mt-24">
              <button
                onClick={() => setActivityOpen((v) => !v)}
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] hover:text-[#EDEDED] transition-colors flex items-center gap-3"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                aria-expanded={activityOpen}
              >
                <span>05 / Activity</span>
                <span>{activityOpen ? "[-]" : "[+]"}</span>
              </button>

              {activityOpen && (
                <ul
                  className="mt-8 space-y-2 text-xs"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                >
                  {runLogSorted.map((r, i) => (
                    <li key={i} className="text-[#EDEDED]/90">
                      <span className="text-[#8A8A8A]">{r.ts}</span>
                      {" · "}
                      <span>{r.agent}/{r.pipeline}</span>
                      {" · "}
                      <span
                        style={{
                          color:
                            r.status === "ok" || r.status === "success"
                              ? "#9ED69E"
                              : r.status === "error" || r.status === "failed"
                              ? "#D69E9E"
                              : "#8A8A8A",
                        }}
                      >
                        {r.status}
                      </span>
                      {r.note ? <span className="text-[#8A8A8A]"> · {r.note}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
};

export default Atelier;
