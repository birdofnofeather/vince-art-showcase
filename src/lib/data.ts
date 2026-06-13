export const DATA_BASE_URL = import.meta.env.VITE_DATA_BASE_URL || "";
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
  // When VITE_DATA_BASE_URL is set, the manifest is hosted externally.
  // Otherwise the publish step bakes a same-origin /portfolio.json into the
  // build; we fall back to the bundled sample only if that file is absent
  // (e.g. a fresh dev checkout before the first publish).
  const candidates = DATA_BASE_URL
    ? [`${DATA_BASE_URL}/portfolio.json`]
    : [`/portfolio.json`, `/portfolio.sample.json`];

  let res: Response | null = null;
  for (const url of candidates) {
    res = await fetch(url);
    if (res.ok) break;
  }
  if (!res || !res.ok) {
    throw new Error(`Failed to load portfolio (${res ? res.status : "no response"})`);
  }
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
