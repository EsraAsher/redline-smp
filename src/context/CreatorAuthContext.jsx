import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { creatorVerify } from '../api';

const CreatorAuthContext = createContext();

// Client-side JWT expiry check (S8)
function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function CreatorAuthProvider({ children }) {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('creator_token');
    if (!token) {
      setCreator(null);
      setLoading(false);
      return;
    }
    // Auto-clear expired/invalid tokens before hitting backend
    if (!isTokenValid(token)) {
      localStorage.removeItem('creator_token');
      setCreator(null);
      setLoading(false);
      return;
    }
    try {
      const data = await creatorVerify();
      setCreator(data);
    } catch {
      localStorage.removeItem('creator_token');
      setCreator(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for token expiry events dispatched from API layer (S8)
  useEffect(() => {
    const handleExpiry = () => {
      localStorage.removeItem('creator_token');
      setCreator(null);
    };
    window.addEventListener('creator_token_expired', handleExpiry);
    return () => window.removeEventListener('creator_token_expired', handleExpiry);
  }, []);

  const loginWithToken = (token) => {
    localStorage.setItem('creator_token', token);
    setCreator({}); // placeholder until dashboard loads full data
  };

  const logout = () => {
    localStorage.removeItem('creator_token');
    setCreator(null);
  };

  return (
    <CreatorAuthContext.Provider value={{ creator, loading, loginWithToken, logout, checkAuth }}>
      {children}
    </CreatorAuthContext.Provider>
  );
}

export function useCreatorAuth() {
  const ctx = useContext(CreatorAuthContext);
  if (!ctx) throw new Error('useCreatorAuth must be used within CreatorAuthProvider');
  return ctx;
}
