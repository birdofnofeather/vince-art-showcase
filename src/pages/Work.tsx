import { usePortfolio } from "@/hooks/usePortfolio";
import WorkGrid from "@/components/WorkGrid";

const Work = () => {
  const { data, loading, error } = usePortfolio();

  return (
    <div>
      <h1 className="sr-only">Work</h1>

      {loading && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-14 md:gap-y-24" aria-hidden="true">
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
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-muted-foreground text-center py-32">Unable to load works right now.</p>
      )}

      {!loading && !error && data && data.works.length === 0 && (
        <p className="text-center text-muted-foreground py-40 font-display text-xl italic">
          New work is on its way.
        </p>
      )}

      {!loading && !error && data && data.works.length > 0 && (
        <WorkGrid
          works={[...data.works].sort((a, b) => (a.date < b.date ? 1 : -1))}
          columnsMobile={2}
        />
      )}
    </div>
  );
};

export default Work;
