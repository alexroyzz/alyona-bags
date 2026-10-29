import Seo from "../components/Seo.jsx";
import Accordion from "../components/Accordion.jsx";
import { faqItems } from "../../../shared/faq.mjs";

export default function Faq() {
  return (
    <div className="pt-32 pb-24 container-px">
      <Seo title="Frequently Asked Questions | Alyona Bags" description="Answers about Alyona Bags wholesale minimum quantities, customization, shipping, bulk quotes, payment and order tracking." path="/faq" />
      <div className="max-w-3xl mx-auto">
        <span className="eyebrow">Help & Information</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl text-ink-900">Frequently Asked Questions</h1>
        <p className="mt-5 text-ink-900/60">Find answers about wholesale orders, customization and delivery.</p>
        <div className="mt-10"><Accordion items={faqItems} defaultOpenIndex={0} /></div>
      </div>
    </div>
  );
}
