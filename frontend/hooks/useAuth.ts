import { useAuth as useAuthFromStore } from "@/store/AuthContext";

export function useAuth() {
  return useAuthFromStore();
}
