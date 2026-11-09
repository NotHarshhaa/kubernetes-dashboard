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
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (name: string, email: string, pass: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = "k8s-session-id";
const AUTH_USER_KEY = "k8s-user-profile";
const AUTH_ACCOUNTS_KEY = "k8s-registered-accounts";

interface StoredAccount {
  email: string;
  name: string;
  role: string;
  credentialDigest: string;
}

// SHA-256 helper so credentials are never persisted in plaintext
async function hashCredential(value: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Demo account with precomputed SHA-256 hash for "admin123"
const DEMO_ACCOUNT: StoredAccount = {
  email: "admin@k8s.local",
  name: "Cluster Administrator",
  role: "admin",
  credentialDigest: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
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
  // Only sanitized profiles and hashed digests are stored
  const sanitized = accounts.map((a) => ({
    email: a.email,
    name: a.name,
    role: a.role,
    credentialDigest: a.credentialDigest,
  }));
  window.localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(sanitized));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage first, then fallback to local storage
    const sessionActive =
      window.sessionStorage.getItem(AUTH_SESSION_KEY) || window.localStorage.getItem(AUTH_SESSION_KEY);
    const userData = window.sessionStorage.getItem(AUTH_USER_KEY) || window.localStorage.getItem(AUTH_USER_KEY);

    if (sessionActive && userData) {
      try {
        const parsed = JSON.parse(userData) as User;
        if (parsed.email && parsed.name) {
          setUser(parsed);
        }
      } catch {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
        window.sessionStorage.removeItem(AUTH_USER_KEY);
        window.localStorage.removeItem(AUTH_SESSION_KEY);
        window.localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    // Simulated authentication — verify hashed credentials
    await new Promise((resolve) => setTimeout(resolve, 300));

    const inputDigest = await hashCredential(pass);
    const account = getAccounts().find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

    if (!account || account.credentialDigest !== inputDigest) {
      return false;
    }

    const sessionUser: User = {
      email: account.email,
      name: account.name,
      role: account.role,
    };

    const sessionStamp = `sess-${Date.now()}`;
    window.sessionStorage.setItem(AUTH_SESSION_KEY, sessionStamp);
    window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  };

  const signUp = async (name: string, email: string, pass: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      toast.error("An account with this email already exists");
      return false;
    }

    const digest = await hashCredential(pass);
    const account: StoredAccount = {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0],
      role: "operator",
      credentialDigest: digest,
    };

    saveAccounts([...accounts, account]);

    const sessionUser: User = {
      email: account.email,
      name: account.name,
      role: account.role,
    };

    const sessionStamp = `sess-${Date.now()}`;
    window.sessionStorage.setItem(AUTH_SESSION_KEY, sessionStamp);
    window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  };

  const signOut = () => {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(AUTH_SESSION_KEY);
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
