export const DATA_BASE_URL =
  import.meta.env.VITE_DATA_BASE_URL ||
  "https://raw.githubusercontent.com/birdofnofeather/vince-art-showcase/main/public";
export const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || "";

export type Work = {
  slug: string;
  title: string;
  headline: string;
  date: string;
  image: string;
  width?: number;
  height?: number;
  selected?: boolean;
};

export type Portfolio = {
  artist: { name: string; location: string };
  works: Work[];
};

export function resolveImage(image: string): string {
  if (/^https?:\/\//i.test(image)) return image;
  return `${DATA_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

export async function fetchPortfolio(): Promise<Portfolio> {
  // Fetch portfolio.json at runtime from the GitHub raw CDN (public repo,
  // no token needed). The file is updated by the pipeline's publish Action
  // on every push to main — changes appear within ~1 minute of a run
  // completing, with no Lovable rebuild or Publish click required.
  // VITE_DATA_BASE_URL overrides the default if the hosting moves.
  const url = `${DATA_BASE_URL}/portfolio.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load portfolio (${res.status})`);
  const data: Portfolio = await res.json();
  data.works = (data.works || []).filter((w) => w.selected === true);
  return data;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
