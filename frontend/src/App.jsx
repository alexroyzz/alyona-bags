import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import api from "./api/axios.js";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import WhatsAppButton from "./components/WhatsAppButton.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserProtectedRoute from "./components/UserProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Categories from "./pages/Categories.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgetPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import CartCheckout from "./pages/CartCheckout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import OrderFailure from "./pages/OrderFailure.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import MyProfile from "./pages/MyProfile.jsx";

import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminProducts from "./pages/admin/Products.jsx";
import AdminCategories from "./pages/admin/Categories.jsx";
import AdminEnquiries from "./pages/admin/Enquiries.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";
import AdminAboutManagement from "./pages/admin/AboutManagement.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";
import AdminCoupons from "./pages/admin/Coupons.jsx";

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => {});
    api
      .get("/categories")
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!isAdmin && <Navbar settings={settings} />}

      <Routes>
        <Route
          path="/"
          element={<Home settings={settings} categories={categories} />}
        />
        <Route
          path="/categories"
          element={<Categories categories={categories} />}
        />
        <Route
          path="/products/:slug"
          element={<ProductDetails settings={settings} />}
        />
        <Route path="/about" element={<About settings={settings} />} />
        <Route path="/contact" element={<Contact settings={settings} />} />

        {/* Customer auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Shopping */}
        <Route
          path="/cart"
          element={
            <UserProtectedRoute>
              <CartCheckout />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <UserProtectedRoute>
              <Wishlist />
            </UserProtectedRoute>
          }
        />
        {/* Checkout is now merged into /cart — redirect old links/bookmarks */}
        <Route path="/checkout" element={<Navigate to="/cart" replace />} />
        <Route
          path="/order-success"
          element={
            <UserProtectedRoute>
              <OrderSuccess />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/order-failure"
          element={
            <UserProtectedRoute>
              <OrderFailure />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <UserProtectedRoute>
              <MyOrders />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/my-orders/:id"
          element={
            <UserProtectedRoute>
              <OrderDetails />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <UserProtectedRoute>
              <MyProfile />
            </UserProtectedRoute>
          }
        />
        {/* forget password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/enquiries"
          element={
            <ProtectedRoute>
              <AdminEnquiries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/about"
          element={
            <ProtectedRoute>
              <AdminAboutManagement />
            </ProtectedRoute>
          }
        />
      </Routes>

      {!isAdmin && (
        <>
          <Footer settings={settings} categories={categories} />
          <WhatsAppButton number={settings?.whatsapp || settings?.phone} />
        </>
      )}
    </>
  );
}

export default App;
