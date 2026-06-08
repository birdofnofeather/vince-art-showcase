import { Link, useParams } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatDate, resolveImage } from "@/lib/data";

const WorkDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = usePortfolio();

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-32">Loading…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-muted-foreground text-center py-32">Unable to load.</p>;
  }

  const work = data.works.find((w) => w.slug === slug);

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
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Work
      </Link>

      <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-start">
        <div className="relative w-full bg-muted" style={{ aspectRatio: "4 / 5" }}>
          <img
            src={resolveImage(work.image)}
            alt={work.title}
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
