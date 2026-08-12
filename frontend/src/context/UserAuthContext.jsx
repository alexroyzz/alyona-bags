import { createContext, useContext, useState, useEffect } from "react";
import userApi from "../api/userAxios.js";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("alyona_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("alyona_user_token");

    if (!token) {
      setLoading(false);
      return;
    }

    userApi
      .get("/users/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("alyona_user_token");
        localStorage.removeItem("alyona_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Register
  const register = async (payload) => {
    const res = await userApi.post("/users/register", payload);
    return res.data;
  };

  // Verify Email
  const verifyEmail = async (token) => {
    const res = await userApi.post("/users/verify-email", { token });
    return res.data;
  };

  // Resend Verification Email
  const resendVerification = async (email) => {
    const res = await userApi.post("/users/resend-verification", { email });
    return res.data;
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    const res = await userApi.post("/users/forgot-password", {
      email,
    });

    return res.data;
  };

  // Reset Password
  const resetPassword = async (token, password, confirmPassword) => {
    const res = await userApi.post("/users/reset-password", {
      token,
      password,
      confirmPassword,
    });

    return res.data;
  };

  // Login
  const login = async (email, password) => {
    const res = await userApi.post("/users/login", {
      email,
      password,
    });

    localStorage.setItem("alyona_user_token", res.data.token);
    localStorage.setItem("alyona_user", JSON.stringify(res.data.user));

    setUser(res.data.user);

    return res.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("alyona_user_token");
    localStorage.removeItem("alyona_user");
    setUser(null);
  };

  // Update User in Context
  const setUserOverride = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("alyona_user", JSON.stringify(updatedUser));
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        login,
        logout,
        setUserOverride,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
