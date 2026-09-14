import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineMail,
  HiOutlineArrowNarrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const ForgotPassword = () => {
  const { forgotPassword } = useUserAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await forgotPassword(email.trim().toLowerCase());

      // Always show the generic "check your email" state — the backend
      // never reveals whether the account exists, so the UI shouldn't either.
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link
          to="/"
          className="block mb-8 text-center font-display text-2xl text-ink-900"
        >
          Alyona <span className="text-brass-500">Bags</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <span className="mx-auto w-12 h-12 rounded-full bg-forest-700/10 flex items-center justify-center">
              <HiOutlineCheckCircle className="text-2xl text-forest-700" />
            </span>
            <h1 className="mt-5 font-display text-3xl text-ink-900">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-ink-900/50 leading-relaxed">
              If an account exists with{" "}
              <span className="text-ink-900/70 break-words">
                {email.trim().toLowerCase()}
              </span>
              , we've sent a password reset link. It may take a minute to
              arrive — remember to check your spam folder.
            </p>

            <Link to="/login" className="btn-primary w-full mt-8">
              Back to Sign In
            </Link>

            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-xs text-forest-700 hover:text-forest-800 hover:underline transition-colors"
            >
              Use a different email address
            </button>
          </div>
        ) : (
          <>
            <div>
              <span className="eyebrow">Password reset</span>
              <h1 className="mt-2 font-display text-3xl text-ink-900">
                Forgot Password
              </h1>
              <p className="mt-2 text-sm text-ink-900/50 leading-relaxed">
                Enter the email address linked to your account and we'll send
                you a secure link to set a new password.
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-stone-200 bg-white focus:border-forest-700 focus:ring-1 focus:ring-forest-700 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-ink-900/50">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-forest-700 font-medium hover:underline"
              >
                <HiOutlineArrowNarrowLeft /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
