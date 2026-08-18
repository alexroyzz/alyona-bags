import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineSparkles,
} from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const perks = [
  { icon: HiOutlineTruck, text: "Track every wholesale order in real time" },
  {
    icon: HiOutlineSparkles,
    text: "Reorder your favourite products in a click",
  },
  {
    icon: HiOutlineShieldCheck,
    text: "Faster, secure checkout on every visit",
  },
];

const Login = () => {
  const { login, resendVerification } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNeedsVerification(false);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.response?.status === 403) {
        setNeedsVerification(true);
        toast.error("Please verify your email before logging in.");
      } else {
        toast.error(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(form.email);
      toast.success(
        "If that account exists, a new verification link is on its way.",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not resend verification email",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
      {/* Editorial brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-forest-900 px-14 py-14">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #F6F4EF 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-forest-700/40 blur-3xl" />
        <div className="absolute -left-24 bottom-0 w-80 h-80 rounded-full bg-brass-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <Link
            to="/"
            className="font-display text-2xl tracking-tight text-stone-50"
          >
            Alyona <span className="text-brass-400">Bags</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="relative max-w-md"
        >
          <span className="eyebrow text-brass-400">Welcome back</span>
          <h1 className="mt-4 font-display text-4xl xl:text-5xl leading-[1.1] text-stone-50">
            Good bags, built to last. So is our service.
          </h1>
          <p className="mt-5 text-stone-300 text-[15px] leading-relaxed">
            Sign in to pick up right where you left off — your orders and
            your saved details, all in one place.
          </p>

          <div className="mt-10 space-y-4">
            {perks.map((perk) => (
              <div key={perk.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-stone-50/10 flex items-center justify-center shrink-0">
                  <perk.icon className="text-lg text-brass-400" />
                </span>
                <p className="text-sm text-stone-200">{perk.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative text-xs text-stone-400">
          © {new Date().getFullYear()} Alyona Bags. Wholesale bag manufacturer.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="lg:hidden font-display text-2xl text-ink-900">
            Alyona <span className="text-brass-500">Bags</span>
          </Link>

          <div className="mt-8 lg:mt-0">
            <span className="eyebrow">Sign In</span>
            <h2 className="mt-2 font-display text-3xl text-ink-900">
              Access your account
            </h2>
            <p className="mt-2 text-sm text-ink-900/50">
              Enter your details below to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-900/60 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/30 text-lg" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-900/60 mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/30 text-lg" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                />
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-forest-700 hover:text-forest-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-900/40 hover:text-ink-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>

            {needsVerification && (
              <div className="text-center text-xs text-brass-500 bg-brass-400/10 rounded-lg px-4 py-3">
                Your email isn't verified yet.{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium underline disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}
          </form>

          <p className="mt-7 text-center text-sm text-ink-900/50">
            New to Alyona Bags?{" "}
            <Link
              to="/register"
              state={{ from: redirectTo }}
              className="text-forest-700 font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
