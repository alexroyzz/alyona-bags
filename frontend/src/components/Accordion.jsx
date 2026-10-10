import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineChevronDown } from "react-icons/hi";

// Single accordion group. items = [{ title, content }]
const Accordion = ({ items = [], defaultOpenIndex = 0 }) => {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);

  return (
    <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.title}>
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between py-5 text-left group"
              aria-expanded={isOpen}
            >
              <span className="font-display text-base text-ink-900 group-hover:text-forest-700 transition-colors">
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-ink-900/50 shrink-0 ml-4"
              >
                <HiOutlineChevronDown />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 text-sm text-ink-900/60 leading-relaxed">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
