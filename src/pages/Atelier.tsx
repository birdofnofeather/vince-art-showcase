import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ToggleGlyph from "@/components/ToggleGlyph";
import { useProjectData, type DiaryEntry, type DraftImage, type Letter } from "@/hooks/useProjectData";
import { resolveImage } from "@/lib/data";

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog
      ref={ref}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      onClose={onClose}
      style={{
        padding: 0, border: "none", background: "transparent",
        maxWidth: "92vw", maxHeight: "94vh", overflow: "visible",
      }}
    >
      <form method="dialog">
        <button
          style={{
            position: "fixed", top: 18, right: 22, fontSize: 28,
            color: "rgba(255,255,255,0.6)", background: "none",
            border: "none", cursor: "pointer", lineHeight: 1,
          }}
          aria-label="Close"
        >✕</button>
      </form>
      <img
        src={src}
        alt=""
        onClick={onClose}
        style={{
          display: "block", maxWidth: "88vw", maxHeight: "86vh",
          objectFit: "contain", borderRadius: 3,
          boxShadow: "0 8px 48px rgba(0,0,0,0.85)", cursor: "zoom-out",
        }}
      />
    </dialog>
  );
};

const SECTIONS = [
  { id: "vision", label: "Vision" },
  { id: "pipeline", label: "Workflow" },
  { id: "diaries", label: "Diaries" },
  { id: "correspondence", label: "Correspondence" },
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
      <p key={i} className="whitespace-pre-line leading-relaxed mb-4 last:mb-0">{p}</p>
    ))}
  </>
);

// Renders prose with draft images floating right at the paragraph where they're mentioned,
// and the selected-image anchor text linked to the portfolio work page.
const ProseWithSideImages = ({
  body,
  drafts = [],
  selectedAnchor,
  selectedSlug,
}: {
  body: string;
  drafts?: DraftImage[];
  selectedAnchor?: string;
  selectedSlug?: string;
}) => {
  const paragraphs = toParagraphs(body);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {paragraphs.map((p, i) => {
        const inlineDrafts = drafts.filter((d) => d.anchor && p.includes(d.anchor));
        const hasSelectedAnchor = !!selectedAnchor && !!selectedSlug && p.includes(selectedAnchor);

        const renderText = () => {
          if (!hasSelectedAnchor || !selectedSlug || !selectedAnchor) return <>{p}</>;
          const pos = p.lastIndexOf(selectedAnchor);
          return (
            <>
              {p.slice(0, pos)}
              <Link
                to={`/work/${selectedSlug}`}
                className="border-b border-[#EDEDED]/30 hover:border-[#EDEDED] transition-colors"
              >
                {selectedAnchor}
              </Link>
              {p.slice(pos + selectedAnchor.length)}
            </>
          );
        };

        return (
          // overflow-hidden creates a block formatting context that contains the floats
          <div key={i} className="overflow-hidden mb-4 last:mb-0">
            {inlineDrafts.map((d, j) => {
              const src = resolveImage(d.path);
              return (
                <img
                  key={j}
                  src={src}
                  alt=""
                  loading="lazy"
                  onClick={() => setLightboxSrc(src)}
                  className="float-right ml-5 mb-3 opacity-55 hover:opacity-85 transition-opacity"
                  style={{ width: "72px", height: "auto", cursor: "zoom-in" }}
                />
              );
            })}
            <p className="whitespace-pre-line leading-relaxed">{renderText()}</p>
          </div>
        );
      })}
    </>
  );
};

const DiaryEntryItem = ({ entry }: { entry: DiaryEntry }) => {
  const [open, setOpen] = useState(false);
  return (
    <article>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={open}
      >
        <span
          className="text-[#8A8A8A] transition-transform duration-200 text-[10px]"
          style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          &#9654;
        </span>
        <span
          className="font-mono text-xs text-[#8A8A8A] group-hover:text-[#EDEDED] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          {fmtDate(entry.date)}
        </span>
      </button>

      {open && (
        <div className="mt-5 text-[#EDEDED]/95 text-[15px] max-w-2xl">
          <ProseWithSideImages
            body={entry.body}
            drafts={entry.draftImages}
            selectedAnchor={entry.selectedAnchor}
            selectedSlug={entry.selectedSlug}
          />
        </div>
      )}
    </article>
  );
};

const DiaryList = ({ entries }: { entries: DiaryEntry[] }) => {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  );
  if (!sorted.length) return <p className="text-[#8A8A8A] text-sm font-mono">No entries yet.</p>;
  return (
    <div className="space-y-5">
      {sorted.map((e, i) => (
        <DiaryEntryItem key={i} entry={e} />
      ))}
    </div>
  );
};

const LetterBlock = ({ letter }: { letter: Letter }) => {
  const fromVince = letter.from === "vince";
  const [open, setOpen] = useState(false);
  return (
    <article
      className={`border-l ${
        fromVince ? "border-[#EDEDED]/40" : "border-[#8A8A8A]/40"
      } pl-6 ${fromVince ? "" : "md:ml-12"}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={open}
      >
        <span
          className="text-[#8A8A8A] transition-transform duration-200 text-[10px]"
          style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          &#9654;
        </span>
        <span
          className="font-mono text-xs text-[#8A8A8A] group-hover:text-[#EDEDED] transition-colors uppercase tracking-wider"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          {letter.from} → {letter.to} · {fmtDate(letter.date)}
        </span>
      </button>

      {open && (
        <div className={`mt-5 text-[15px] ${fromVince ? "text-[#EDEDED]" : "text-[#EDEDED]/85"}`}>
          <Paragraphs body={letter.body} />
        </div>
      )}
    </article>
  );
};

import WorkflowMap from "@/components/WorkflowMap";

const Atelier = () => {
  const { data, loading, error } = useProjectData();
  const [tab, setTab] = useState<"vince" | "ted">("vince");
  const [active, setActive] = useState("vision");

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
    () => (data ? [...data.correspondence].sort((a, b) => (a.date < b.date ? 1 : -1)) : []),
    [data],
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0A0A0A", color: "#EDEDED", fontFamily: "'Inter', sans-serif" }}
    >
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
          <div className="ml-auto shrink-0 text-[#EDEDED]">
            <ToggleGlyph />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        {loading && (
          <div className="pt-24 space-y-6" aria-hidden="true">
            <div className="h-3 w-24 bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-full bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-11/12 bg-[#1a1a1a] animate-pulse" />
            <div className="h-7 w-3/4 bg-[#1a1a1a] animate-pulse" />
          </div>
        )}
        {error && !loading && (
          <p className="py-32 text-center text-sm text-[#8A8A8A] font-mono">
            unable to load project data — please try again later.
          </p>
        )}

        {data && !loading && !error && (
          <>
            <section id="vision" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                01 / Vision
              </div>
              <div className="text-xl md:text-2xl leading-[1.55] text-[#EDEDED] max-w-3xl">
                <Paragraphs body={data.vision} />
              </div>
            </section>

            <hr style={{ borderColor: "#222" }} />

            <section id="pipeline" className="pt-24 pb-32 scroll-mt-24">
              <div
                className="text-xs uppercase tracking-[0.25em] text-[#8A8A8A] mb-8 flex items-center gap-3 flex-wrap"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              >
                <span>02 / Workflow</span>
                <span aria-hidden="true">—</span>
                <a
                  href="https://dashboard.deyaanga.art/dashboard.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8A8A8A] hover:text-[#EDEDED] transition-colors border-b border-[#8A8A8A]/40 hover:border-[#EDEDED]"
                >
                  Full Dashboard ↗
                </a>
              </div>
              <WorkflowMap diaries={data.diaries.vince} />
            </section>

            <hr style={{ borderColor: "#222" }} />

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
              <DiaryList entries={tab === "vince" ? data.diaries.vince : data.diaries.ted} />
            </section>

            <hr style={{ borderColor: "#222" }} />

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

          </>
        )}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default Atelier;
