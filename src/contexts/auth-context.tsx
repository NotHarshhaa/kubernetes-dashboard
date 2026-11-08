"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { toast } from "sonner";

export interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "k8s-auth-token";
const AUTH_USER_KEY = "k8s-user";
const AUTH_ACCOUNTS_KEY = "k8s-accounts";

interface StoredAccount extends User {
  password: string;
}

// Demo credentials always available so the dashboard can be explored without signing up first.
const DEMO_ACCOUNT: StoredAccount = {
  email: "admin@k8s.local",
  name: "Cluster Administrator",
  role: "admin",
  password: "admin123",
};

function getAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [DEMO_ACCOUNT];
  try {
    const raw = window.localStorage.getItem(AUTH_ACCOUNTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const accounts = Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
    return accounts.some((a) => a.email === DEMO_ACCOUNT.email) ? accounts : [DEMO_ACCOUNT, ...accounts];
  } catch {
    return [DEMO_ACCOUNT];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = window.localStorage.getItem(AUTH_USER_KEY);

    if (token && userData) {
      try {
        setUser(JSON.parse(userData) as User);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Simulated authentication — swap for a real identity provider when available.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const account = getAccounts().find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

    if (!account || account.password !== password) {
      return false;
    }

    const { password: _password, ...userWithoutPassword } = account;
    window.localStorage.setItem(AUTH_TOKEN_KEY, `demo-token-${Date.now()}`);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    return true;
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      toast.error("An account with this email already exists");
      return false;
    }

    const account: StoredAccount = {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0],
      role: "operator",
      password,
    };

    saveAccounts([...accounts, account]);

    const { password: _password, ...userWithoutPassword } = account;
    window.localStorage.setItem(AUTH_TOKEN_KEY, `demo-token-${Date.now()}`);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    return true;
  };

  const signOut = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
