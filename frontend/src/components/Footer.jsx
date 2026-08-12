import { Link } from "react-router-dom";
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import {
  FaInstagram,
  FaLinkedinIn,
  FaFacebookF,
  FaXTwitter,
} from "react-icons/fa6";

const Footer = ({ settings, categories = [] }) => {
  const year = new Date().getFullYear();

  const socialLinks = [
    {
      key: "instagram",
      url: settings?.socialLinks?.instagram,
      label: "Follow us on Instagram",
      Icon: FaInstagram,
    },
    {
      key: "x",
      url: settings?.socialLinks?.x,
      label: "Follow us on X",
      Icon: FaXTwitter,
    },
    {
      key: "linkedin",
      url: settings?.socialLinks?.linkedin,
      label: "Follow us on LinkedIn",
      Icon: FaLinkedinIn,
    },
    {
      key: "facebook",
      url: settings?.socialLinks?.facebook,
      label: "Follow us on Facebook",
      Icon: FaFacebookF,
    },
  ].filter((s) => s.url);

  return (
    <footer className="bg-[#1A1A1A] text-stone-200">
      <div className="container-px py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <span className="font-display text-2xl text-stone-50">
            {settings?.companyName?.split(" ")[0] || "Alyona"}{" "}
            <span className="text-brass-400">
              {settings?.companyName?.split(" ")[1] || "Bags"}
            </span>
          </span>
          <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-xs">
            A premium wholesale manufacturer crafting durable, stylish bags for
            retailers and distributors worldwide.
          </p>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-brass-400 mb-5">
            Quick Links
          </h4>
          <ul className="space-y-3 text-sm text-stone-400">
            <li>
              <Link to="/" className="hover:text-stone-50 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/categories"
                className="hover:text-stone-50 transition-colors"
              >
                Categories
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="hover:text-stone-50 transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-stone-50 transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-brass-400 mb-5">
            Categories
          </h4>
          <ul className="space-y-3 text-sm text-stone-400">
            {categories.slice(0, 5).map((cat) => (
              <li key={cat._id}>
                <Link
                  to={`/categories?cat=${cat.slug}`}
                  className="hover:text-stone-50 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-stone-500">Categories coming soon</li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-brass-400 mb-5">
            Contact
          </h4>
          <ul className="space-y-4 text-sm text-stone-400">
            <li className="flex items-start gap-3">
              <HiOutlinePhone className="mt-0.5 text-brass-400" />
              {settings?.phone || "+91 90000 00000"}
            </li>
            <li className="flex items-start gap-3">
              <HiOutlineMail className="mt-0.5 text-brass-400" />
              {settings?.email || "hello@alyonabags.com"}
            </li>
            <li className="flex items-start gap-3">
              <HiOutlineLocationMarker className="mt-0.5 text-brass-400 shrink-0" />
              {settings?.address || "Mumbai, Maharashtra, India"}
            </li>
          </ul>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {socialLinks.map(({ key, url, label, Icon }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-50/15 text-stone-300 hover:text-ink-900 hover:bg-brass-400 hover:border-brass-400 transition-colors"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-stone-50/10">
        <div className="container-px py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-stone-500">
          <p>
            © {year} {settings?.companyName || "Alyona Bags"}. All rights
            reserved.
            {settings?.gstNumber && (
              <span className="block sm:inline sm:ml-2">
                GSTIN: {settings.gstNumber}
              </span>
            )}
          </p>
          <p>Wholesale enquiries — an online store.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
