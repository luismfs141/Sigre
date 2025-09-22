// src/context/AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = ({ username, password }) => {
    if (username === 'admin' && password === 'admin') {
      setUser({ username, role: 'admin' });
      navigate('/dashboard');
    } else if (username === 'usuario' && password === 'usuario') {
      setUser({ username, role: 'public' });
      navigate('/');
    } else {
      alert('Credenciales inválidas');
    }
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);