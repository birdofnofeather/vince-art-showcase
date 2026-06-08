import { Link } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatDate, resolveImage } from "@/lib/data";

const Work = () => {
  const { data, loading, error } = usePortfolio();

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20">
      <h1 className="sr-only">Work</h1>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 md:gap-x-14 md:gap-y-24" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="w-full bg-muted animate-pulse" style={{ aspectRatio: "4 / 5" }} />
              <div className="pt-4 space-y-2">
                <div className="h-5 w-2/3 bg-muted animate-pulse" />
                <div className="h-3 w-1/2 bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-muted-foreground text-center py-32">
          Unable to load works right now.
        </p>
      )}

      {!loading && !error && data && data.works.length === 0 && (
        <p className="text-center text-muted-foreground py-40 font-display text-xl italic">
          New work is on its way.
        </p>
      )}

      {!loading && !error && data && data.works.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 md:gap-x-14 md:gap-y-24">
          {data.works.map((w) => (
            <Link
              key={w.slug}
              to={`/work/${w.slug}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "4 / 5" }}>
                <img
                  src={resolveImage(w.image)}
                  alt={w.title}
                  loading="lazy"
                  decoding="async"
                  width={w.width}
                  height={w.height}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
              </div>
              <div className="pt-4">
                <h2 className="font-display text-xl md:text-2xl leading-tight">{w.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {w.headline} · {formatDate(w.date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Work;
