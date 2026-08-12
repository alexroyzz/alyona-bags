import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const WishlistButton = ({ productId, className = "" }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const active = isWishlisted(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
          navigate("/login", { state: { from: location.pathname } });
          return;
        }
        toggleWishlist(productId);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card transition-colors ${className}`}
    >
      {active ? <HiHeart className="text-lg text-red-500" /> : <HiOutlineHeart className="text-lg text-ink-900/60" />}
    </button>
  );
};

export default WishlistButton;
