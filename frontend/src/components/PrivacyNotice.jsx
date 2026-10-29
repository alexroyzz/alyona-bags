import { Link } from "react-router-dom";

// Short notice shown beside the submit button of forms that collect personal details.
// Opens in a new tab so a half-filled form is never lost.
export default function PrivacyNotice({ className = "", children }) {
  return (
    <p className={`text-xs leading-5 text-ink-900/60 ${className}`}>
      {children || "We’ll use the information you provide to respond to your enquiry and provide customer support. "}
      Please read our{" "}
      <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-900">
        Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
      </Link>{" "}
      to learn how we handle your information.
    </p>
  );
}
