import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineCollection,
  HiOutlineMailOpen,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlineInformationCircle,
  HiOutlineStar,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: HiOutlineViewGrid },
  { to: "/admin/products", label: "Products", icon: HiOutlineCube },
  { to: "/admin/categories", label: "Categories", icon: HiOutlineCollection },
  { to: "/admin/orders", label: "Orders", icon: HiOutlineShoppingBag },
  { to: "/admin/enquiries", label: "Enquiries", icon: HiOutlineMailOpen },
  { to: "/admin/about", label: "About Us Page", icon: HiOutlineInformationCircle },
  { to: "/admin/reviews", label: "Reviews", icon: HiOutlineStar },
  { to: "/admin/settings", label: "Settings", icon: HiOutlineCog },
];

const AdminLayout = ({ children }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-ink-900 text-stone-50">
        <span className="font-display text-lg">
          Alyona <span className="text-brass-400">Admin</span>
        </span>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          aria-controls="admin-navigation"
          aria-expanded={menuOpen}
          className="w-11 h-11 -mr-2 flex items-center justify-center text-2xl"
        >
          {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </header>
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink-900/50"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="admin-navigation"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-[45] w-64 max-w-[85vw] overflow-y-auto transform transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:max-w-none bg-ink-900 text-stone-300 flex flex-col shrink-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-7 border-b border-stone-50/10">
          <span className="font-display text-xl text-stone-50">
            Alyona <span className="text-brass-400">Admin</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-stone-50/10 text-stone-50" : "hover:bg-stone-50/5 hover:text-stone-50"
                }`
              }
            >
              <Icon className="text-lg" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-stone-50/10">
          <p className="text-xs text-stone-500">Signed in as</p>
          <p className="text-sm text-stone-200 truncate">{admin?.name}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm text-stone-400 hover:text-red-400 transition-colors"
          >
            <HiOutlineLogout /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
