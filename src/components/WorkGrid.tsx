import { Link } from "react-router-dom";
import { formatDate, resolveImage, type Work } from "@/lib/data";

type Props = {
  works: Work[];
  /** columns on mobile: 1 or 2 */
  columnsMobile?: 1 | 2;
};

const WorkGrid = ({ works, columnsMobile = 2 }: Props) => {
  const mobileCols = columnsMobile === 2 ? "grid-cols-2" : "grid-cols-1";
  const mobileGap = columnsMobile === 2 ? "gap-x-4 gap-y-8" : "gap-x-10 gap-y-16";
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 md:pt-20">
      <div className={`grid ${mobileCols} md:grid-cols-2 lg:grid-cols-3 ${mobileGap} md:gap-x-14 md:gap-y-24`}>
        {works.map((w) => (
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
              <h2 className="font-display text-lg md:text-2xl leading-tight">{w.title}</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {w.headline} · {formatDate(w.date)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WorkGrid;
