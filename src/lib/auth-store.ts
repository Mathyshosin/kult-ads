"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Simple hash for MVP — NOT production secure
  createdAt: number;
}

interface AuthState {
  currentUser: { id: string; name: string; email: string } | null;
  accounts: UserAccount[];

  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

// Simple hash function for MVP (NOT cryptographically secure — for demo only)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [],

      signup: (name, email, password) => {
        const { accounts } = get();

        // Check if email already exists
        if (accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, error: "Un compte existe déjà avec cet email." };
        }

        if (password.length < 6) {
          return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
        }

        const newUser: UserAccount = {
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          email: email.toLowerCase(),
          passwordHash: simpleHash(password),
          createdAt: Date.now(),
        };

        set({
          accounts: [...accounts, newUser],
          currentUser: { id: newUser.id, name: newUser.name, email: newUser.email },
        });

        return { success: true };
      },

      login: (email, password) => {
        const { accounts } = get();
        const account = accounts.find(
          (a) => a.email.toLowerCase() === email.toLowerCase()
        );

        if (!account) {
          return { success: false, error: "Aucun compte trouvé avec cet email." };
        }

        if (account.passwordHash !== simpleHash(password)) {
          return { success: false, error: "Mot de passe incorrect." };
        }

        set({
          currentUser: { id: account.id, name: account.name, email: account.email },
        });

        return { success: true };
      },

      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: "kult-ads-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);
