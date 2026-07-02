import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Tracks whether we've finished checking localStorage for a saved session.
  // Until this is true, we don't actually know if the user is logged in or not,
  // so route guards must wait instead of assuming "logged out".
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('km_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login  = (u) => { setUser(u); localStorage.setItem('km_user', JSON.stringify(u)); };
  const logout = ()  => { setUser(null); localStorage.removeItem('km_user'); };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};