import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import Loader from "./Loader.jsx";

// Guards storefront customer routes (cart-adjacent pages like checkout, orders).
const UserProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUserAuth();
  const location = useLocation();

  if (loading) return <Loader full />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
};

export default UserProtectedRoute;
