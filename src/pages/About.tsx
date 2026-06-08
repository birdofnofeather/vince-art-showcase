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

      <p className="mt-8 text-base md:text-lg leading-relaxed text-foreground/90">
        Vince de Yaanga is an emerging visual artist based in Los Angeles. Of Congolese
        descent, he works in hyper-photorealistic digital collage, taking the day's news
        as a starting point and resolving it into scenes lit by the particular light of
        his city. His images hold global events at the scale of a single street.
      </p>

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
