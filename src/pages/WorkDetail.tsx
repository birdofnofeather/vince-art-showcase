import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatDate, resolveImage } from "@/lib/data";

const WorkDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = usePortfolio();

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-32">Loading…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-muted-foreground text-center py-32">Unable to load.</p>;
  }

  const index = data.works.findIndex((w) => w.slug === slug);
  const work = index >= 0 ? data.works[index] : undefined;
  const prev = index > 0 ? data.works[index - 1] : undefined;
  const next = index >= 0 && index < data.works.length - 1 ? data.works[index + 1] : undefined;

  const prevSlug = prev?.slug;
  const nextSlug = next?.slug;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "ArrowLeft" && prevSlug) navigate(`/work/${prevSlug}`);
      if (e.key === "ArrowRight" && nextSlug) navigate(`/work/${nextSlug}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevSlug, nextSlug, navigate]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && nextSlug) navigate(`/work/${nextSlug}`);
      else if (dx > 0 && prevSlug) navigate(`/work/${prevSlug}`);
    }
  };

  if (!work) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Work
        </Link>
        <p className="font-display text-2xl italic text-center py-32">Work not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 md:pt-12">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Work
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {prev ? (
            <Link
              to={`/work/${prev.slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Previous: ${prev.title}`}
            >
              ← Previous
            </Link>
          ) : (
            <span className="text-muted-foreground/40 cursor-default" aria-hidden="true">
              ← Previous
            </span>
          )}
          {next ? (
            <Link
              to={`/work/${next.slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Next: ${next.title}`}
            >
              Next →
            </Link>
          ) : (
            <span className="text-muted-foreground/40 cursor-default" aria-hidden="true">
              Next →
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-start">
        <div className="relative w-full bg-muted" style={{ aspectRatio: "4 / 5" }}>
          <img
            src={resolveImage(work.image)}
            alt={work.title}
            loading="eager"
            decoding="async"
            width={work.width}
            height={work.height}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="lg:pt-6">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            {work.title}
          </h1>
          <p className="font-display italic text-lg md:text-xl text-foreground/80 mt-6">
            {work.headline}
          </p>
          <p className="text-sm text-muted-foreground mt-3">{formatDate(work.date)}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;

