import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineUserCircle,
  HiOutlineShoppingBag,
  HiOutlineLogout,
  HiChevronDown,
} from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import toast from "react-hot-toast";

const AccountDropdown = () => {
  const { user, isAuthenticated, logout } = useUserAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Close whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "";

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success("Signed out successfully");
    navigate("/");
  };

  const menuItems = [
    { to: "/my-profile", label: "My Profile", icon: HiOutlineUserCircle },
    { to: "/my-orders", label: "My Orders", icon: HiOutlineShoppingBag },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account"
        className={`flex items-center gap-1.5 h-10 pl-1.5 pr-2.5 rounded-full transition-colors ${
          open ? "bg-stone-100" : "hover:bg-stone-100"
        }`}
      >
        {isAuthenticated ? (
          <span className="w-7 h-7 rounded-full bg-forest-700 text-stone-50 text-xs font-semibold flex items-center justify-center">
            {initial}
          </span>
        ) : (
          <span className="w-10 h-10 -mx-1.5 rounded-full flex items-center justify-center text-ink-900/70">
            <HiOutlineUser className="text-xl" />
          </span>
        )}
        <HiChevronDown
          className={`hidden sm:block text-sm text-ink-900/50 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-72 origin-top-right card-surface overflow-hidden z-50"
          >
            {isAuthenticated ? (
              <>
                <div className="px-5 py-4 bg-stone-100/70 border-b border-stone-200/70">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-ink-900/40 font-semibold">
                    Signed in as
                  </p>
                  <p className="mt-1 font-display text-base text-ink-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-ink-900/50 truncate">{user?.email}</p>
                </div>

                <div className="py-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink-900/80 hover:bg-stone-100 hover:text-ink-900 transition-colors"
                    >
                      <item.icon className="text-lg text-ink-900/50" />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="py-2 border-t border-stone-200/70">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <HiOutlineLogout className="text-lg" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="p-5">
                <p className="font-display text-lg text-ink-900">Welcome</p>
                <p className="mt-1 text-sm text-ink-900/50 leading-relaxed">
                  Sign in for faster checkout and order tracking.
                </p>
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full mt-4 !py-3"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  state={{ from: location.pathname }}
                  onClick={() => setOpen(false)}
                  className="mt-3 block text-center text-sm text-forest-700 font-medium hover:underline"
                >
                  Create an account
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountDropdown;
