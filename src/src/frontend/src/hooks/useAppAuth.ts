import { createContext, useContext, useEffect, useState } from "react";
import { createElement } from "react";
import type { ReactNode } from "react";
import type { AppUser } from "../backend";

const SESSION_KEY = "hrms_session";

interface AppAuthContextValue {
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
}

const AppAuthContext = createContext<AppAuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AppUser) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  function login(u: AppUser) {
    setUser(u);
  }

  function logout() {
    setUser(null);
  }

  return createElement(
    AppAuthContext.Provider,
    { value: { user, login, logout } },
    children,
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}
