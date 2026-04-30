import portrait from "@/assets/artist-portrait.jpg";

const AboutSection = () => (
  <section id="about" className="py-24 bg-card">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <div className="aspect-square overflow-hidden max-w-md">
        <img src={portrait} alt="Vince de Yaanga in his studio" loading="lazy" width={640} height={800} className="w-full h-full object-cover" />
      </div>
      <div className="space-y-6">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">About</h2>
        <p className="text-muted-foreground font-light leading-relaxed">
          Vince de Yaanga is a contemporary visual artist whose work moves between abstraction and figuration. Drawing from natural landscapes, urban textures, and inner states, his paintings layer bold color with nuanced mark-making.
        </p>
        <p className="text-muted-foreground font-light leading-relaxed">
          His work has been exhibited in galleries across Europe and Africa. He currently lives and works in his studio in Brussels.
        </p>
        <div className="pt-4 space-y-1 text-sm">
          <p className="text-muted-foreground">Exhibitions include:</p>
          <ul className="text-muted-foreground font-light space-y-1">
            <li>Galerie Moderne, Brussels — 2025</li>
            <li>ArtParis, Grand Palais — 2024</li>
            <li>Kinshasa Biennale — 2023</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
