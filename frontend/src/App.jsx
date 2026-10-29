import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import api from "./api/axios.js";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import WhatsAppButton from "./components/WhatsAppButton.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserProtectedRoute from "./components/UserProtectedRoute.jsx";
import RouteSeo from "./components/RouteSeo.jsx";
import GoogleAnalytics from "./components/GoogleAnalytics.jsx";
import NotFound from "./pages/NotFound.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgetPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const CartCheckout = lazy(() => import("./pages/CartCheckout.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const OrderFailure = lazy(() => import("./pages/OrderFailure.jsx"));
const MyOrders = lazy(() => import("./pages/MyOrders.jsx"));
const OrderDetails = lazy(() => import("./pages/OrderDetails.jsx"));
const MyProfile = lazy(() => import("./pages/MyProfile.jsx"));
const AdminLogin = lazy(() => import("./pages/admin/Login.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/Categories.jsx"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries.jsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.jsx"));
const AdminAboutManagement = lazy(() => import("./pages/admin/AboutManagement.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const ThankYou = lazy(() => import("./pages/ThankYou.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const AdminReviewsManagement = lazy(() => import("./pages/admin/ReviewsManagement.jsx"));

const PageLoader = () => (
  <div className="min-h-[60vh] grid place-items-center text-sm text-ink-900/50" role="status">
    Loading page…
  </div>
);

// Standalone authentication screens render their own full-page layout, so the
// marketing shell (Navbar / Footer / WhatsApp button) is not mounted for them.
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuthRoute = AUTH_ROUTES.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
  );
  const showSiteChrome = !isAdmin && !isAuthRoute;
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesReady, setCategoriesReady] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => {});
    api
      .get("/categories")
      .then((res) => setCategories(res.data.data))
      .catch(() => {})
      .finally(() => setCategoriesReady(true));
  }, []);

  // Scroll to the top on navigation, or to the #section when a link targets one
  // (pages are lazy-loaded, so wait briefly for the target element to appear).
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* keep raw hash */ }
    let attempts = 0;
    const timer = setInterval(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView();
        clearInterval(timer);
      } else if (++attempts >= 30) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [location.pathname, location.hash]);

  return (
    <>
      <RouteSeo />
      <GoogleAnalytics />
      {!isAdmin && <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-3 focus:text-ink-900">Skip to main content</a>}
      {showSiteChrome && <Navbar settings={settings} />}

      {!isAdmin && <main id="main-content">
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={<Home settings={settings} categories={categories} />}
        />
        <Route
          path="/categories"
          element={<Categories categories={categories} categoriesReady={categoriesReady} />}
        />
        <Route
          path="/categories/:slug"
          element={<Categories categories={categories} categoriesReady={categoriesReady} />}
        />
        <Route
          path="/products/:slug"
          element={<ProductDetails settings={settings} />}
        />
        <Route path="/about" element={<About settings={settings} />} />
        <Route path="/contact" element={<Contact settings={settings} />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms-and-conditions" element={<Terms />} />
        <Route path="/thank-you" element={<ThankYou />} />

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

        {/* Catch-all — unknown URLs get a friendly not-found message instead of a blank page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </main>}
      {isAdmin && <Suspense fallback={<PageLoader />}><Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/enquiries" element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/about" element={<ProtectedRoute><AdminAboutManagement /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewsManagement /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes></Suspense>}

      {showSiteChrome && (
        <>
          <Footer settings={settings} categories={categories} />
          <WhatsAppButton number={settings?.whatsapp || settings?.phone} />
        </>
      )}
    </>
  );
}

export default App;
