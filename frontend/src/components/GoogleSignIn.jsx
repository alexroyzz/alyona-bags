import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserAuth } from "../context/UserAuthContext.jsx";

let googleIdentityPromise;
let initializedGoogleClientId = "";
let activeCredentialHandler;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentityServices = "true";
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id);
      else reject(new Error("Google sign-in did not initialize."));
    };
    script.onerror = () => reject(new Error("Google sign-in could not load."));
    document.head.appendChild(script);
  }).catch((error) => {
    googleIdentityPromise = undefined;
    throw error;
  });

  return googleIdentityPromise;
};

function GoogleIdentityButton({ onCredential, busy }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [width, setWidth] = useState(320);
  const [loadError, setLoadError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const nextWidth = Math.floor(container.getBoundingClientRect().width);
      if (nextWidth > 0) setWidth(Math.min(400, Math.max(200, nextWidth)));
    };
    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoadError("Google sign-in is not configured. You can still use email and password.");
      return undefined;
    }

    let mounted = true;
    const handleCredential = (credential) => {
      if (typeof credential !== "string" || !credential) {
        setLoadError("Google sign-in could not be completed. You can try again or use email and password.");
        return;
      }
      callbackRef.current(credential);
    };
    activeCredentialHandler = handleCredential;
    loadGoogleIdentityServices()
      .then((identity) => {
        if (!mounted || !containerRef.current) return;
        setLoadError("");
        containerRef.current.replaceChildren();
        if (initializedGoogleClientId !== clientId) {
          identity.initialize({
            client_id: clientId,
            callback: (response) => activeCredentialHandler?.(response?.credential),
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: "popup",
          });
          initializedGoogleClientId = clientId;
        }
        identity.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width,
        });
      })
      .catch(() => {
        if (mounted) setLoadError("Google sign-in is temporarily unavailable. Please try again later.");
      });

    return () => {
      mounted = false;
      if (activeCredentialHandler === handleCredential) activeCredentialHandler = undefined;
      containerRef.current?.replaceChildren();
    };
  }, [clientId, width]);

  return (
    <div>
      <div
        ref={containerRef}
        className={`flex min-h-10 w-full justify-center overflow-hidden rounded-lg transition-opacity ${busy ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={busy}
      />
      {busy && <p className="mt-2 text-center text-xs text-ink-900/55" role="status">Signing in with Google…</p>}
      {loadError && <p className="mt-2 text-center text-xs text-ink-900/60" role="status">{loadError}</p>}
    </div>
  );
}

export default function GoogleSignIn({ redirectTo = "/", initialPhone = "" }) {
  const { googleLogin } = useUserAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [phoneRequired, setPhoneRequired] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [pendingCredential, setPendingCredential] = useState("");
  const submittingRef = useRef(false);
  const safeRedirect = typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/";

  const completeSignIn = async (credential, phoneValue = "") => {
    if (submittingRef.current || !credential) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      await googleLogin(credential, phoneValue);
      setPendingCredential("");
      setPhoneRequired(false);
      toast.success("Welcome to Alyona Bags!");
      navigate(safeRedirect, { replace: true });
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "PHONE_REQUIRED" || code === "PHONE_IN_USE" || code === "INVALID_PHONE") {
        setPendingCredential(credential);
        setPhoneRequired(true);
        if (code !== "PHONE_REQUIRED") toast.error(error.response?.data?.message || "Check your phone number and try again.");
      } else {
        setPendingCredential("");
        setPhoneRequired(false);
        toast.error(error.response?.data?.message || "Google sign-in could not be completed. Please try again.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const cancelPhoneSetup = () => {
    setPendingCredential("");
    setPhoneRequired(false);
    setPhone(initialPhone);
  };

  return (
    <section className="mt-6" aria-label="Google sign-in">
      <div className="mb-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-stone-200" />
        <span className="text-xs text-ink-900/45">or</span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <GoogleIdentityButton
        onCredential={(credential) => {
          const validPhone = /^[6-9]\d{9}$/.test(phoneRequired ? phone : initialPhone)
            ? (phoneRequired ? phone : initialPhone)
            : "";
          completeSignIn(credential, validPhone);
        }}
        busy={submitting}
      />

      {phoneRequired && (
        <form
          className="mt-5 rounded-lg border border-stone-200 bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            completeSignIn(pendingCredential, phone);
          }}
        >
          <p className="font-medium text-sm text-ink-900">One more detail</p>
          <p className="mt-1 text-xs leading-5 text-ink-900/55">Add a mobile number to finish setting up your customer account.</p>
          <label htmlFor="google-account-phone" className="mt-4 block text-xs font-medium text-ink-900/70">Mobile number</label>
          <input
            id="google-account-phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile number"
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-base text-ink-900 outline-none focus:border-forest-700 sm:text-sm"
          />
          <button type="submit" disabled={submitting} className="btn-primary mt-4 min-h-11 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Signing in…" : "Finish with Google"}
          </button>
          <button type="button" onClick={cancelPhoneSetup} disabled={submitting} className="mt-3 min-h-10 w-full text-sm text-ink-900/55 underline underline-offset-4 disabled:opacity-50">
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}
