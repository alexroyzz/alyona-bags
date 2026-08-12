import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import Loader from "../components/Loader.jsx";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useUserAuth();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return; // avoid double-run under React StrictMode
    ranOnce.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "This verification link is invalid or has expired.");
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-sm w-full text-center">
        {status === "verifying" && (
          <>
            <Loader />
            <p className="mt-4 text-sm text-ink-900/50">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <HiOutlineCheckCircle className="text-5xl text-forest-700 mx-auto" />
            <h1 className="mt-5 font-display text-2xl text-ink-900">Email Verified</h1>
            <p className="mt-3 text-sm text-ink-900/60 leading-relaxed">{message}</p>
            <Link to="/login" className="btn-primary mt-7 inline-flex">
              Sign In
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <HiOutlineXCircle className="text-5xl text-red-500 mx-auto" />
            <h1 className="mt-5 font-display text-2xl text-ink-900">Verification Failed</h1>
            <p className="mt-3 text-sm text-ink-900/60 leading-relaxed">{message}</p>
            <Link to="/login" className="btn-primary mt-7 inline-flex">
              Go to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
