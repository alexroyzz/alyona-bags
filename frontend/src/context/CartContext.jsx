import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import userApi from "../api/userAxios.js";
import { useUserAuth } from "./UserAuthContext.jsx";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.get("/cart");
      setCart(res.data.data);
    } catch {
      // silent — user may not be logged in yet
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async ({
    productId,
    quantity = 1,
    color = "",
    printingType = "plain",
    instructions = "",
    logo = null,
  }) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart");
      navigate("/login", { state: { from: location.pathname } });
      return false;
    }

    try {
      const res = await userApi.post("/cart", {
        productId,
        quantity,
        color,
        printingType,
        instructions,
        logo,
      });

      setCart(res.data.data);
      toast.success("Added to cart");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await userApi.put(`/cart/${itemId}`, { quantity });
      setCart(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update cart");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await userApi.delete(`/cart/${itemId}`);
      setCart(res.data.data);
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove item");
    }
  };

  const clearCart = async () => {
    try {
      await userApi.delete("/cart");
      setCart({ items: [] });
    } catch {
      // silent
    }
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const subtotal =
    cart.items?.reduce((sum, i) => {
      const price =
        i.product?.discountPrice > 0
          ? i.product.discountPrice
          : i.product?.price || 0;
      return sum + price * i.quantity;
    }, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
