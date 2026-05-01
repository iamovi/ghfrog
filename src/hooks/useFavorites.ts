import { useEffect, useState, useCallback } from "react";

export interface Favorite {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  savedAt: number;
}

const KEY = "ghfrog:favorites";
const EVT = "ghfrog:favorites-changed";

function read(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(favs: Favorite[]) {
  localStorage.setItem(KEY, JSON.stringify(favs));
  window.dispatchEvent(new Event(EVT));
}

export function useFavorites() {
  const [favs, setFavs] = useState<Favorite[]>(() => read());

  useEffect(() => {
    const handler = () => setFavs(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isFav = useCallback(
    (owner: string, repo: string) =>
      favs.some((f) => f.owner === owner && f.repo === repo),
    [favs],
  );

  const toggle = useCallback((fav: Omit<Favorite, "savedAt">) => {
    const cur = read();
    const idx = cur.findIndex((f) => f.owner === fav.owner && f.repo === fav.repo);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.unshift({ ...fav, savedAt: Date.now() });
    write(cur);
  }, []);

  const remove = useCallback((owner: string, repo: string) => {
    write(read().filter((f) => !(f.owner === owner && f.repo === repo)));
  }, []);

  return { favs, isFav, toggle, remove };
}
