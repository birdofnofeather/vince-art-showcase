import vinceHeadshot from "@/assets/vince-headshot.png.asset.json";

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 md:pt-24 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,240px)_1fr] gap-8 md:gap-14 items-start">
        <figure className="mx-auto md:mx-0 w-40 sm:w-52 md:w-full">
          <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3 / 4" }}>
            <img
              src={vinceHeadshot.url}
              alt="Portrait of Vince de Yaanga"
              loading="eager"
              decoding="async"
              width={480}
              height={640}
              className="absolute inset-0 w-full h-full object-cover grayscale-[15%]"
            />
          </div>
          <figcaption className="mt-3 text-xs text-muted-foreground font-display italic">
            Vince de Yaanga, Los Angeles
          </figcaption>
        </figure>

        <div className="max-w-xl">
          <h1 className="font-display text-4xl md:text-5xl leading-tight">About</h1>

          <div className="mt-6 md:mt-8 text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
            I make images. Each one starts with the day's news and ends in South LA. The practice is daily: I read what is happening in the world and ask what it would look like if it arrived here, on asphalt I know, in the light of a specific afternoon.&nbsp;It's not illustration. The news story is a starting condition, not a subject. I use AI image generation, and I treat it the way artists have always treated new tools: the question is not whether it is legitimate, it is what it makes possible that wasn't possible before.&nbsp;


            What it makes possible is cadence.&nbsp;One image a day, each answering the world at the speed the world actually moves. The danger in that speed is that it becomes the whole point, that the images pile up and cancel each other out. I work against that. I want each one to slow you down, to hold its complexity instead of flattening it into a headline you've already scrolled past.&nbsp;


            The formal work is in the translation: what in the story survives the move, what gets clarified by landing here rather than somewhere abstract. I am interested in images that don't give everything up immediately. Beauty is part of how that works, but not beauty that resolves. The picture should hold a tension it doesn't explain.&nbsp;


            The world sends the story. I decide where it lands, and how long it makes you stand there.
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            For exhibition and acquisition inquiries write to ted (at) deyaanga.art
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
