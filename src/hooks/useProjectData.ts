import { useEffect, useState } from "react";
import { DATA_BASE_URL } from "@/lib/data";

export type PipelineNode = {
  id: string;
  label: string;
  status?: "ok" | "idle" | "error" | string;
  lastRun?: string;
};

export type PipelineEdge = { from: string; to: string };

export type DiaryEntry = { date: string; body: string };

export type Letter = {
  date: string;
  from: "vince" | "ted" | string;
  to: "vince" | "ted" | string;
  body: string;
};

export type RunLogEntry = {
  ts: string;
  agent: string;
  pipeline: string;
  status: string;
  note?: string;
};

export type ProjectData = {
  vision: string;
  pipeline: { nodes: PipelineNode[]; edges: PipelineEdge[] };
  diaries: { vince: DiaryEntry[]; ted: DiaryEntry[] };
  correspondence: Letter[];
  runLog: RunLogEntry[];
};

export function useProjectData() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = `${DATA_BASE_URL}/project.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        return r.json();
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message || "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
