import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setToken } from "@/lib/github";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }

      setUser(session?.user ?? null);

      if (session?.provider_token) {
        setToken(session.provider_token);
      } else if (_event === "SIGNED_OUT") {
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "public_repo",
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setToken(null);
  };

  return { user, loading, signInWithGithub, signOut };
}
