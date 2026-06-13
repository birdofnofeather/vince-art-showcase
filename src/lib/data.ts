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
  const url = DATA_BASE_URL
    ? `${DATA_BASE_URL}/portfolio.json`
    : `/portfolio.sample.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load portfolio (${res.status})`);
  return res.json();
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
