import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineCollection,
  HiOutlineMailOpen,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineInformationCircle,
} from "react-icons/hi";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: HiOutlineViewGrid },
  { to: "/admin/products", label: "Products", icon: HiOutlineCube },
  { to: "/admin/categories", label: "Categories", icon: HiOutlineCollection },
  { to: "/admin/orders", label: "Orders", icon: HiOutlineShoppingBag },
  { to: "/admin/coupons", label: "Coupons", icon: HiOutlineTag },
  { to: "/admin/enquiries", label: "Enquiries", icon: HiOutlineMailOpen },
  { to: "/admin/about", label: "About Us Page", icon: HiOutlineInformationCircle },
  { to: "/admin/settings", label: "Settings", icon: HiOutlineCog },
];

const AdminLayout = ({ children }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-stone-100">
      <aside className="w-64 bg-ink-900 text-stone-300 flex flex-col shrink-0">
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
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
