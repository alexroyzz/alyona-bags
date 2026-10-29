import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { authRequestErrorMessage } from "../../utils/authRequestError.js";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(authRequestErrorMessage(err, "Invalid credentials"));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm bg-stone-50 rounded-xl2 p-9 shadow-soft">
        <span className="font-display text-2xl text-ink-900">
          Alyona <span className="text-brass-500">Admin</span>
        </span>
        <p className="mt-1 text-sm text-ink-900/50">Sign in to manage the catalogue</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
