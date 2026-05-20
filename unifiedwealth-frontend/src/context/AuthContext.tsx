"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface AuthProfile {
  name: string;
  email: string;
  roles: string[];
  userId: string;
}

interface AuthContextType {
  token: string | null;
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  loginSession: (token: string, profile: AuthProfile) => void;
  logoutSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const activeToken = Cookies.get("gateway_session_token");
    const cachedProfile = localStorage.getItem("platform_cached_profile");
    
    if (activeToken && cachedProfile) {
      setToken(activeToken);
      setProfile(JSON.parse(cachedProfile));
      setIsAuthenticated(true);
    }
  }, []);

  const loginSession = (newToken: string, newProfile: AuthProfile) => {
    Cookies.set("gateway_session_token", newToken, { expires: 1, secure: true, sameSite: "strict" });
    localStorage.setItem("platform_cached_profile", JSON.stringify(newProfile));
    setToken(newToken);
    setProfile(newProfile);
    setIsAuthenticated(true);
    router.push("/dashboard");
  };

  const logoutSession = () => {
    Cookies.remove("gateway_session_token");
    localStorage.removeItem("platform_cached_profile");
    setToken(null);
    setProfile(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, profile, isAuthenticated, loginSession, logoutSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be called inside an AuthProvider scope.");
  return context;
};