import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";
import work4 from "@/assets/work-4.jpg";
import work5 from "@/assets/work-5.jpg";

const works = [
  { src: work1, title: "Tidal Drift", year: "2025", w: 640, h: 800 },
  { src: work2, title: "Fractured Gold", year: "2024", w: 640, h: 640 },
  { src: work3, title: "Soft Terrain", year: "2024", w: 800, h: 640 },
  { src: work4, title: "Circle of Motion", year: "2025", w: 640, h: 800 },
  { src: work5, title: "Distant Horizon", year: "2023", w: 800, h: 640 },
];

const WorkSection = () => (
  <section id="work" className="py-24">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold mb-16 tracking-tight">Selected Work</h2>
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {works.map((w) => (
          <div key={w.title} className="break-inside-avoid group cursor-pointer">
            <div className="overflow-hidden">
              <img
                src={w.src}
                alt={w.title}
                loading="lazy"
                width={w.w}
                height={w.h}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex justify-between items-baseline mt-3">
              <span className="text-sm font-light">{w.title}</span>
              <span className="text-xs text-muted-foreground">{w.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WorkSection;
