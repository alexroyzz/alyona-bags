import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
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

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold">
            Check your email
          </h1>

          <p className="mt-4 text-gray-600">
            If an account exists with this email,
            we've sent a password reset link.
          </p>

          <Link
            to="/login"
            className="text-green-700 mt-6 inline-block"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow p-8"
      >
        <h1 className="text-3xl font-bold">
          Forgot Password
        </h1>

        <p className="text-gray-500 mt-2">
          Enter your email address.
        </p>

        <input
          type="email"
          required
          placeholder="Email Address"
          className="w-full mt-6 border rounded-lg px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full mt-5 bg-green-700 text-white rounded-lg py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

      </form>
    </div>
  );
};

export default ForgotPassword;
