import { createContext } from "react";

// Define the User type
export interface User {
  id: string;
  email: string;
  name?: string;
}

// Define the AuthContext type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Create the AuthContext with a default value
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
