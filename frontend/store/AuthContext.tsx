"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  register: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from HttpOnly cookie on startup
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch Current User (via HttpOnly cookie)
  const fetchUser = async (authToken?: string): Promise<User | null> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken || token) {
        headers["Authorization"] = `JWT ${authToken || token}`;
      }
      const res = await fetch(`${API_BASE}/auth/users/me/`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        if (authToken) {
          setToken(authToken);
        }
        setLoading(false);
        return userData;
      } else {
        // If the access token expired or not present, try refreshing via refresh_token HttpOnly cookie
        const refreshRes = await fetch(`${API_BASE}/auth/jwt/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccess = refreshData.access;
          if (newAccess) {
            setToken(newAccess);
            return fetchUser(newAccess);
          }
          return fetchUser();
        }
        // Token invalid and cannot be refreshed
        setUser(null);
        setToken(null);
        setLoading(false);
        return null;
      }
    } catch (err) {
      console.error("Auth fetchUser error:", err);
      setLoading(false);
      return null;
    }
  };

  // Sign In / Login
  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/jwt/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const access = data.access;
        if (access) {
          setToken(access);
        }
        // Clear any old tokens from localStorage if left over
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        // Fetch user with newly issued session/token
        const userData = await fetchUser(access);
        return userData;
      }
      return null;
    } catch (e) {
      console.error("Login fetch error:", e);
      return null;
    }
  };

  // Sign Up / Register
  const register = async (
    userData: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (res.ok) {
        return { success: true };
      }

      let errorData;
      try {
        errorData = await res.json();
      } catch {
        return { success: false, error: `Server Error (${res.status}). Please check backend logs.` };
      }

      let firstError = "Registration failed.";

      if (typeof errorData === "object" && errorData !== null) {
        const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
          const msgText = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
          const formattedField = field.replace("_", " ").toUpperCase();
          return `${formattedField}: ${msgText}`;
        });
        firstError = errorMessages.join(" | ");
      }

      return { success: false, error: firstError };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Logout
  const logout = () => {
    try {
      fetch(`${API_BASE}/auth/logout/`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } catch (e) {}

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("cart_id");
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: true,
      login: async () => null,
      register: async () => ({ success: false, error: "Auth provider not ready" }),
      logout: () => {},
    };
  }
  return context;
};
