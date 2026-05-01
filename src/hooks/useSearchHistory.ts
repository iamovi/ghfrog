import { useCallback, useEffect, useState } from "react";

const KEY = "ghfrog:search-history";
const MAX = 8;

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => read());

  useEffect(() => {
    const handler = () => setHistory(read());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const push = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const cur = read().filter((x) => x.toLowerCase() !== trimmed.toLowerCase());
    cur.unshift(trimmed);
    const next = cur.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setHistory(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, push, clear };
}
