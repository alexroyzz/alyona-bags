import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { whatsappHref } from "../utils/contactLinks.js";

const WhatsAppButton = ({ number, message = "Hi, I'd like to enquire about your wholesale bag catalogue." }) => {
  const href = whatsappHref(number, message);
  if (!href) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab fixed z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-soft"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Chat on WhatsApp (opens WhatsApp in a new tab)"
      title="Chat on WhatsApp — opens WhatsApp in a new tab or app"
    >
      <FaWhatsapp className="text-2xl" />
    </motion.a>
  );
};

export default WhatsAppButton;