import { API_BASE } from "./api";
import { User } from "@/types";

export const authService = {
  async sendOTP(email: string, username?: string) {
    const res = await fetch(`${API_BASE}/auth/otp/send/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username }),
    });
    return res.json();
  },

  async verifyOTP(email: string, otp_code: string) {
    const res = await fetch(`${API_BASE}/auth/otp/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code }),
    });
    return res.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/users/me/`, {
      headers: { Authorization: `JWT ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },
};
