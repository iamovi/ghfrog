import { useEffect, useState, useCallback } from "react";
import type { RepoCardData } from "@/components/RepoCard";

const KEY = "ghfrog:recent";
const EVT = "ghfrog:recent-changed";

function read(): RepoCardData[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(recent: RepoCardData[]) {
  localStorage.setItem(KEY, JSON.stringify(recent));
  window.dispatchEvent(new Event(EVT));
}

export function useRecent() {
  const [recent, setRecent] = useState<RepoCardData[]>(() => read());

  useEffect(() => {
    const handler = () => setRecent(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addRecent = useCallback((repo: RepoCardData) => {
    const cur = read();
    // Remove if already exists to move to top
    const filtered = cur.filter((r) => !(r.owner === repo.owner && r.repo === repo.repo));
    // Add to front
    filtered.unshift(repo);
    // Keep only last 12
    if (filtered.length > 12) filtered.length = 12;
    write(filtered);
  }, []);

  const clearRecent = useCallback(() => {
    write([]);
  }, []);

  return { recent, addRecent, clearRecent };
}
