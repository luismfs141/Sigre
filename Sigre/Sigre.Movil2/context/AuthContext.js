import { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const signIn = (username, password) => {
    // Aquí pondrás la lógica real de login
    if (username === 'admin' && password === '123') {
      setUser({ username });
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}