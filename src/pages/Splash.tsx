import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatDate, resolveImage, type Work } from "@/lib/data";
import WorkGrid from "@/components/WorkGrid";

const AUTO_ADVANCE_MS = 7000;
const SWIPE_THRESHOLD = 40;

const MobileCarousel = ({ works }: { works: Work[] }) => {
  const [index, setIndex] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [paused, setPaused] = useState(false);
  const advancedOnceRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const markAdvanced = () => {
    if (!advancedOnceRef.current) {
      advancedOnceRef.current = true;
      setShowHints(false);
    }
  };

  useEffect(() => {
    if (works.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % works.length);
      markAdvanced();
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [works.length, paused]);

  const goTo = (delta: number) => {
    setIndex((i) => {
      const n = works.length;
      return ((i + delta) % n + n) % n;
    });
    markAdvanced();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const startX = touchStart.current.x;
    touchStart.current = null;

    // Swipe
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? 1 : -1);
      return;
    }

    // Tap: partition image into left 15% / center 70% / right 15%
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const relX = (startX - rect.left) / rect.width;
      if (relX < 0.15) {
        goTo(-1);
      } else if (relX > 0.85) {
        goTo(1);
      } else {
        // Center tap: toggle pause; if resuming, advance immediately
        setPaused((p) => {
          if (p) goTo(1);
          return !p;
        });
        markAdvanced();
      }
    }
  };

  const togglePause = () => {
    setPaused((p) => {
      if (p) goTo(1);
      return !p;
    });
    markAdvanced();
  };

  const w = works[index];

  return (
    <div className="px-6 pt-8 select-none">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-muted touch-pan-y"
        style={{ aspectRatio: "4 / 5" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {works.map((wk, i) => (
          <img
            key={wk.slug}
            src={resolveImage(wk.image)}
            alt={wk.title}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            width={wk.width}
            height={wk.height}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i === index ? undefined : true}
            draggable={false}
          />
        ))}
      </div>
      <div className="pt-4">
        <h2 className="font-display text-xl leading-tight">{w.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {w.headline} · {formatDate(w.date)}
        </p>
      </div>

      <div
        className={`mt-3 flex items-center justify-between text-xs text-muted-foreground/60 transition-opacity duration-500 ${
          showHints ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showHints}
      >
        <span>← Swipe to advance →</span>
        <button
          type="button"
          onClick={togglePause}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          aria-label={paused ? "Resume carousel" : "Pause carousel"}
        >
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
          <span>Tap center to pause</span>
        </button>
      </div>
    </div>
  );
};


const Splash = () => {
  const isMobile = useIsMobile();
  const { data, loading, error } = usePortfolio();

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 md:gap-x-14 md:gap-y-24" aria-hidden="true">
          {Array.from({ length: isMobile ? 2 : 6 }).map((_, i) => (
            <div key={i}>
              <div className="w-full bg-muted animate-pulse" style={{ aspectRatio: "4 / 5" }} />
              <div className="pt-4 space-y-2">
                <div className="h-5 w-2/3 bg-muted animate-pulse" />
                <div className="h-3 w-1/2 bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground text-center py-32">Unable to load works right now.</p>;
  }

  if (!data || data.works.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-40 font-display text-xl italic">
        New work is on its way.
      </p>
    );
  }

  const sorted = [...data.works].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (isMobile) return <MobileCarousel works={sorted} />;

  return <WorkGrid works={sorted} columnsMobile={1} />;
};

export default Splash;
