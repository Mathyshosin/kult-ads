"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  currentUser: { id: string; name: string; email: string } | null;
  isLoading: boolean;

  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initialize: () => () => void; // returns unsubscribe function
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  isLoading: true,

  signup: async (name, email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      const msg =
        error.message === "User already registered"
          ? "Un compte existe déjà avec cet email."
          : error.message;
      return { success: false, error: msg };
    }

    return { success: true };
  },

  login: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message;
      return { success: false, error: msg };
    }

    return { success: true };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ currentUser: null });
  },

  initialize: () => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        set({
          currentUser: {
            id: user.id,
            name: user.user_metadata?.name || "",
            email: user.email || "",
          },
          isLoading: false,
        });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          currentUser: {
            id: session.user.id,
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
          },
          isLoading: false,
        });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  },
}));
