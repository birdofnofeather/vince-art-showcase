import { useState } from "react";
import { WEB3FORMS_ACCESS_KEY } from "@/lib/data";

type Status = "idle" | "submitting" | "success" | "error";

const About = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if ((formData.get("botcheck") as string)?.length) {
      setStatus("success");
      form.reset();
      return;
    }

    formData.set("access_key", WEB3FORMS_ACCESS_KEY);
    formData.set("subject", "New inquiry from deyaanga.art");

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMsg(json.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 pt-16 md:pt-24">
      <h1 className="font-display text-4xl md:text-5xl leading-tight">About</h1>

      <div className="mt-8 text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
        I make images. Each one starts with the day's news and ends in South LA. The practice is daily: I read what is happening in the world and ask what it would look like if it arrived here, on asphalt I know, in the light of a specific afternoon.&nbsp;It's not illustration. The news story is a starting condition, not a subject. I use AI image generation, and I treat it the way artists have always treated new tools: the question is not whether it is legitimate, it is what it makes possible that wasn't possible before.&nbsp;


        What it makes possible is cadence.&nbsp;One image a day, each answering the world at the speed the world actually moves. The danger in that speed is that it becomes the whole point, that the images pile up and cancel each other out. I work against that. I want each one to slow you down, to hold its complexity instead of flattening it into a headline you've already scrolled past.&nbsp;


        The formal work is in the translation: what in the story survives the move, what gets clarified by landing here rather than somewhere abstract. I am interested in images that don't give everything up immediately. Beauty is part of how that works, but not beauty that resolves. The picture should hold a tension it doesn't explain.&nbsp;


        The world sends the story. I decide where it lands, and how long it makes you stand there.
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        For exhibition and acquisition inquiries, please use the form below.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        <div className="sr-only-hp" aria-hidden="true">
          <label>
            Don't fill this out
            <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor="name" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-base transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={255}
            className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-base transition-colors"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Message</label>
          <textarea
            id="message"
            name="message"
            required
            maxLength={2000}
            rows={5}
            className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-base resize-none transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center gap-6">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center border border-foreground px-6 py-2.5 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {status === "submitting" ? "Sending…" : "Send"}
          </button>

          {status === "success" && (
            <span className="text-sm text-foreground">Thank you — your message has been sent.</span>
          )}
          {status === "error" && (
            <span className="text-sm text-destructive">{errorMsg || "Something went wrong."}</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default About;
