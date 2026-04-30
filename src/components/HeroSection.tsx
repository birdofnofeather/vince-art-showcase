import heroImage from "@/assets/hero-artwork.jpg";

const HeroSection = () => (
  <section className="min-h-screen flex items-center pt-20">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-light">Contemporary Artist</p>
        <h1 className="text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight">
          Vince<br />de Yaanga
        </h1>
        <p className="text-muted-foreground font-light leading-relaxed max-w-md">
          Exploring the boundaries between form and emotion through bold color, texture, and abstraction.
        </p>
        <a href="#work" className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity">
          View Work
        </a>
      </div>
      <div className="aspect-[4/3] overflow-hidden">
        <img src={heroImage} alt="Featured artwork by Vince de Yaanga" className="w-full h-full object-cover" width={1280} height={720} />
      </div>
    </div>
  </section>
);

export default HeroSection;
