export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
