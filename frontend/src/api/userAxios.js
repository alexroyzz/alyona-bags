import axios from "axios";

// Separate axios instance for storefront customer requests (cart, wishlist, orders, auth).
// Kept independent from api/axios.js (admin) so admin sessions are never affected.
const userApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("alyona_user_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("alyona_user_token");
      localStorage.removeItem("alyona_user");
    }
    return Promise.reject(error);
  }
);

export default userApi;
