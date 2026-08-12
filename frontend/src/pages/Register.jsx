import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
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
    text: "Save favourites to your personal wishlist",
  },
  {
    icon: HiOutlineShieldCheck,
    text: "Faster, secure checkout on every visit",
  },
];

const Register = () => {
  const { register } = useUserAuth();
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create account");
    } finally {
      setSubmitting(false);
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
          <span className="eyebrow text-brass-400">Join Alyona Bags</span>
          <h1 className="mt-4 font-display text-4xl xl:text-5xl leading-[1.1] text-stone-50">
            Create an account, unlock the full experience.
          </h1>
          <p className="mt-5 text-stone-300 text-[15px] leading-relaxed">
            It only takes a minute. Save your details once and enjoy a faster
            checkout on every wholesale order after.
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

          {submitted ? (
            <div className="mt-8 lg:mt-0">
              <span className="eyebrow">Almost there</span>
              <h2 className="mt-2 font-display text-3xl text-ink-900">
                Check your email
              </h2>
              <p className="mt-3 text-sm text-ink-900/60 leading-relaxed">
                We've sent a verification link to{" "}
                <strong className="text-ink-900">{form.email}</strong>. Click
                the link to activate your account — you won't be able to sign in
                until it's verified.
              </p>
              <p className="mt-6 text-xs text-ink-900/40">
                Didn't get it? Check your spam folder, or head to{" "}
                <Link
                  to="/login"
                  className="text-forest-700 font-medium hover:underline"
                >
                  Sign in
                </Link>{" "}
                to resend the link.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 lg:mt-0">
                <span className="eyebrow">Create Account</span>
                <h2 className="mt-2 font-display text-3xl text-ink-900">
                  Get started
                </h2>
                <p className="mt-2 text-sm text-ink-900/50">
                  Fill in your details to create your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-900/60 mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/30 text-lg" />
                    <input
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Jane Doe"
                      className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

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
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-900/60 mb-1.5">
                    Phone number
                  </label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/30 text-lg" />
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[6-9]{1}[0-9]{9}"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="9876543210"
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
                      minLength={6}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="Create a strong password"
                      className="w-full pl-11 pr-11 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-900/40 hover:text-ink-900"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-900/60 mb-1.5">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/30 text-lg" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm password"
                      className="w-full pl-11 pr-11 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-xs text-ink-900/40 text-center leading-relaxed pt-1">
                  By creating an account, you agree to Alyona Bags' terms of
                  service and privacy policy.
                </p>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-ink-900/50">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: redirectTo }}
              className="text-forest-700 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
