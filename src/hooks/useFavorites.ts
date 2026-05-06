import { useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Favorite {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  saved_at?: string;
}

export function useFavorites() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ["favorites", user?.id], [user?.id]);

  const { data: favs = [], isLoading: queryLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("saved_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch favorites:", error);
        throw error;
      }
      return data as Favorite[];
    },
    enabled: !authLoading && !!user,
  });

  const loading = authLoading || (!!user && queryLoading);

  const isFav = useCallback(
    (owner: string, repo: string) =>
      favs.some((f) => f.owner === owner && f.repo === repo),
    [favs],
  );

  const toggleMutation = useMutation({
    mutationFn: async ({ fav, isAdding }: { fav: Omit<Favorite, "saved_at">; isAdding: boolean }) => {
      if (!user) throw new Error("Unauthenticated");

      if (!isAdding) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .match({ user_id: user.id, owner: fav.owner, repo: fav.repo });
        if (error) throw error;
        return { action: "removed", fav };
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          owner: fav.owner,
          repo: fav.repo,
          name: fav.name,
          description: fav.description,
          stars: fav.stars,
          language: fav.language,
        });
        if (error) throw error;
        return { action: "added", fav };
      }
    },
    onMutate: async ({ fav, isAdding }) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey });

      const previousFavs = queryClient.getQueryData<Favorite[]>(queryKey) || [];

      queryClient.setQueryData<Favorite[]>(queryKey, (old = []) => {
        if (!isAdding) {
          return old.filter((f) => !(f.owner === fav.owner && f.repo === fav.repo));
        } else {
          return [{ ...fav }, ...old];
        }
      });

      return { previousFavs };
    },
    onError: (err, variables, context) => {
      if (err.message !== "Unauthenticated") {
        toast.error("Failed to update favorite.");
        if (context?.previousFavs) {
          queryClient.setQueryData(queryKey, context.previousFavs);
        }
      }
    },
    onSuccess: (data) => {
      if (data.action === "added") {
        toast.success("Repository saved!");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      if (!user) throw new Error("Unauthenticated");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .match({ user_id: user.id, owner, repo });
      if (error) throw error;
    },
    onMutate: async ({ owner, repo }) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey });
      const previousFavs = queryClient.getQueryData<Favorite[]>(queryKey) || [];
      queryClient.setQueryData<Favorite[]>(queryKey, (old = []) =>
        old.filter((f) => !(f.owner === owner && f.repo === repo))
      );
      return { previousFavs };
    },
    onError: (err, variables, context) => {
      toast.error("Failed to remove favorite.");
      if (context?.previousFavs) {
        queryClient.setQueryData(queryKey, context.previousFavs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggle = useCallback(
    (fav: Omit<Favorite, "saved_at">) => {
      if (!user) {
        toast.error("Please sign in to save repositories.");
        return;
      }
      const isCurrentlyFav = favs.some(
        (f) => f.owner === fav.owner && f.repo === fav.repo,
      );
      toggleMutation.mutate({ fav, isAdding: !isCurrentlyFav });
    },
    [user, favs, toggleMutation],
  );

  const remove = useCallback(
    (owner: string, repo: string) => {
      if (!user) return;
      removeMutation.mutate({ owner, repo });
    },
    [user, removeMutation],
  );

  return { favs, isFav, toggle, remove, loading, user };
}
