import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import userApi from "../api/userAxios.js";
import { useUserAuth } from "./UserAuthContext.jsx";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist({ products: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.get("/wishlist");
      setWishlist(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = (productId) => wishlist.products?.some((p) => p._id === productId);

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error("Please log in to use your wishlist");
      return;
    }
    try {
      const res = await userApi.post("/wishlist/toggle", { productId });
      setWishlist(res.data.data);
      toast.success(res.data.added ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update wishlist");
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, isWishlisted, toggleWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
