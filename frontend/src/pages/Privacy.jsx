import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const Section = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl text-ink-900">{title}</h2>
    <div className="mt-2 text-sm leading-7 text-ink-900/65">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="pt-32 pb-24 container-px">
      <Seo title="Privacy Policy | Alyona Bags" description="Learn how Alyona Bags uses account, order, contact and website information to provide its services." path="/privacy" />
      <article className="max-w-3xl mx-auto">
        <span className="eyebrow">Your Information</span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-ink-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-ink-900/50">Last updated: October 9, 2026</p>
        <p className="mt-6 text-sm leading-7 text-ink-900/65">This page explains the information Alyona Bags uses when you browse the catalogue, create an account, place an order, or contact us.</p>
        <Section title="Information you provide">We use account and contact details such as your name, email address, phone number, delivery address, enquiry messages and order details to operate the store, answer requests, process orders and provide customer support.</Section>
        <Section title="Payments and service providers">Checkout may use the payment options shown at the time of purchase. Payment providers process payment details under their own privacy terms. The store also uses service providers for hosting product images, database and email delivery. Information is shared with them only as needed to provide the requested service.</Section>
        <Section title="Website analytics">If Google Analytics 4 is configured for this deployment, it may collect website usage and device information to help understand site traffic. Analytics is disabled when no measurement ID is configured. You can also control cookies and site storage through your browser.</Section>
        <Section title="Account and order information">Account data is used to support sign-in, saved addresses, order history and order communications. Do not send payment card details or other sensitive information through the enquiry form.</Section>
        <Section title="Your choices and questions">You may contact us to ask about or request a correction to information associated with your account. For privacy questions, contact us through the <Link className="text-forest-700 underline" to="/contact">Contact page</Link>. We may need to verify your account before acting on a request.</Section>
        <Section title="Policy updates">This page may be updated when the site’s features or data practices change. The date above indicates the latest revision.</Section>
      </article>
    </div>
  );
}
