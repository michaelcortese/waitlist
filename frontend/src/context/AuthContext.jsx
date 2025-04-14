import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you would validate the token with the backend
      // For now, we'll just set a basic user object
      setUser({ token });
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login({ email, password });
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data || 'Login failed');
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      return data;
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Value object to be provided by the context
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 