import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "baseforge_auth_token";
const USER_KEY = "baseforge_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga asíncrona de la sesión guardada
  useEffect(() => {
    async function loadSession() {
      try {
        let savedToken = null;
        let savedUser = null;

        // Intentar leer de SecureStore
        try {
          savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
          const userStr = await SecureStore.getItemAsync(USER_KEY);
          if (userStr) {
            savedUser = JSON.parse(userStr);
          }
        } catch {
          // Fallback para web
          if (typeof window !== "undefined" && window.localStorage) {
            savedToken = window.localStorage.getItem(TOKEN_KEY);
            const userStr = window.localStorage.getItem(USER_KEY);
            if (userStr) {
              savedUser = JSON.parse(userStr);
            }
          }
        }

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (error) {
        console.error("Error al cargar sesión persistente:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);

    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    } catch {
      // Fallback para web
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, newToken);
        window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      }
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);

    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      // Fallback para web
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
