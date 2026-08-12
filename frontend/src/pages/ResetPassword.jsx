import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineXCircle } from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const { resetPassword } = useUserAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Holds a message when the token itself is invalid/expired/already used,
  // so we can show a dedicated state instead of just a toast.
  const [tokenError, setTokenError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    setTokenError("");

    try {
      const data = await resetPassword(token, password, confirmPassword);

      toast.success(data.message || "Password changed successfully");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";

      // Invalid / expired / already-used tokens all come back as 400 errors
      // from the backend with a specific message — surface that clearly
      // instead of leaving the user stuck on a form that can never succeed.
      if (err.response?.status === 400 && /token|link/i.test(message)) {
        setTokenError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-8 text-center">
          <HiOutlineXCircle className="text-5xl text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold mt-5">Link Invalid</h1>
          <p className="mt-3 text-gray-600">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="w-full mt-6 inline-block bg-green-700 text-white rounded-lg py-3"
          >
            Request a New Link
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
        <h1 className="text-3xl font-bold">Reset Password</h1>

        <input
          type="password"
          placeholder="New Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-6 border rounded-lg px-4 py-3"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mt-4 border rounded-lg px-4 py-3"
        />

        <button
          disabled={loading}
          className="w-full mt-5 bg-green-700 text-white rounded-lg py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
