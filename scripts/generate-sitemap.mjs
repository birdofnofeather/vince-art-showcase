// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
// Reads work slugs from public/portfolio.sample.json. /atelier is intentionally excluded.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://deyaanga.art";

const sample = JSON.parse(
  readFileSync(resolve("public/portfolio.sample.json"), "utf-8"),
);

const today = new Date().toISOString().slice(0, 10);

const entries = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
  { path: "/about", changefreq: "monthly", priority: "0.6", lastmod: today },
  ...sample.works.map((w) => ({
    path: `/work/${w.slug}`,
    changefreq: "monthly",
    priority: "0.8",
    lastmod: w.date,
  })),
];

function build(entries) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), build(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
