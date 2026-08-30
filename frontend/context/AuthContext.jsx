import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  setStoredToken,
  loginApi,
  registerCustomerApi,
  registerBusinessApi,
  getMeApi,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    let isMounted = true;
    const stored = getStoredToken();

    if (!stored) {
      setLoading(false);
      return;
    }

    getMeApi()
      .then((res) => {
        if (isMounted) {
          setUser(res.data);
          setToken(stored);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStoredToken(null);
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    const { token: jwtToken, user: userData } = res.data;
    setStoredToken(jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return res;
  };

  const registerCustomer = async (data) => {
    const res = await registerCustomerApi(data);
    const { token: jwtToken, user: userData } = res.data;
    setStoredToken(jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return res;
  };

  const registerBusiness = async (data) => {
    const res = await registerBusinessApi(data);
    const { token: jwtToken, user: userData } = res.data;
    setStoredToken(jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return res;
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isBusiness: user?.role === 'BUSINESS',
        isCustomer: user?.role === 'CUSTOMER',
        login,
        registerCustomer,
        registerBusiness,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
