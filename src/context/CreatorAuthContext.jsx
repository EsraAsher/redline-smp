import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { creatorVerify } from '../api';

const CreatorAuthContext = createContext();

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
