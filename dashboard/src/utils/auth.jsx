import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('masterKey'));
  const [masterKey, setMasterKey] = useState(localStorage.getItem('masterKey') || '');

  const login = (key) => {
    setIsAuthenticated(true);
    setMasterKey(key);
    localStorage.setItem('masterKey', key);
  };
  const logout = () => {
    setIsAuthenticated(false);
    setMasterKey('');
    localStorage.removeItem('masterKey');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, masterKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 