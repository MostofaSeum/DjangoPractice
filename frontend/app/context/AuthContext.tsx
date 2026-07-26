"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load token and user on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    }
  }, []);

  // Fetch Current User
  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/users/me/`, {
        headers: { Authorization: `JWT ${authToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sign In / Login
  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/auth/jwt/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setToken(data.access);
      await fetchUser(data.access);
      return true;
    }
    return false;
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
