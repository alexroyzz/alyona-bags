import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineUserCircle,
  HiOutlineLogout,
} from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import AccountDropdown from "./AccountDropdown.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
];

const Navbar = ({ settings }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useUserAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phone = settings?.phone || "+919354573967";

  // Cart is a protected experience — bounce guests to login and bring them
  // right back to where they were once they've signed in. Otherwise, go
  // straight to the merged Cart + Checkout page.
  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    navigate("/cart");
  };

  const handleWishlistClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/login", { state: { from: "/wishlist" } });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-stone-50 shadow-card" : "bg-transparent"
      }`}
    >
      <nav className="container-px flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          {settings?.logo?.url ? (
            <img
              src={settings.logo.url}
              alt={settings?.companyName}
              className="h-9 w-auto"
            />
          ) : (
            <span className="font-display text-2xl tracking-tight text-ink-900">
              Alyona <span className="text-brass-500">Bags</span>
            </span>
          )}
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative py-1 text-sm tracking-wide transition-colors group ${
                  isActive ? "text-ink-900 font-medium" : "text-ink-900/60 hover:text-ink-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-0.5 h-px bg-brass-500 transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            to="/wishlist"
            onClick={handleWishlistClick}
            className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-ink-900/70 hover:text-ink-900 hover:bg-stone-100 transition-colors"
            aria-label="Wishlist"
          >
            <HiOutlineHeart className="text-xl" />
          </Link>

          <button
            onClick={handleCartClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink-900/70 hover:text-ink-900 hover:bg-stone-100 transition-colors"
            aria-label="Cart"
          >
            <HiOutlineShoppingBag className="text-xl" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brass-500 text-[9px] text-white flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <AccountDropdown />
          </div>

          <button
            className="lg:hidden text-2xl text-ink-900 ml-1"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-stone-50 border-t border-stone-200 overflow-hidden"
          >
            <div className="container-px flex flex-col gap-5 py-6">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="text-base text-ink-900/80"
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/wishlist"
                onClick={(e) => {
                  handleWishlistClick(e);
                  setOpen(false);
                }}
                className="text-base text-ink-900/80"
              >
                Wishlist
              </NavLink>

              {isAuthenticated ? (
                <>
                  <div className="pt-4 mt-1 border-t border-stone-200 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-forest-700 text-stone-50 text-xs font-semibold flex items-center justify-center shrink-0">
                      {user?.name?.trim()?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-ink-900/40 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <NavLink
                    to="/my-profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 text-base text-ink-900/80"
                  >
                    <HiOutlineUserCircle className="text-lg text-ink-900/50" />
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/my-orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 text-base text-ink-900/80"
                  >
                    <HiOutlineShoppingBag className="text-lg text-ink-900/50" />
                    My Orders
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate("/");
                    }}
                    className="flex items-center gap-2.5 text-base text-red-600"
                  >
                    <HiOutlineLogout className="text-lg" />
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={() => setOpen(false)}
                  className="text-base text-ink-900/80"
                >
                  Sign In
                </NavLink>
              )}

              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="btn-primary w-full"
              ></a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
