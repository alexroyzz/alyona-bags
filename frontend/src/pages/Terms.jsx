import LegalLayout, { LegalSection, LegalList, LegalLink, LegalMailLink } from "../components/LegalLayout.jsx";
import { BUSINESS_NAME, BUSINESS_EMAIL, BUSINESS_ADDRESS } from "../constants/businessInfo.js";

const toc = [
  { id: "general-terms", label: "General terms" },
  { id: "products-and-pricing", label: "Products and pricing" },
  { id: "orders-and-payments", label: "Orders and payments" },
  { id: "shipping-and-delivery", label: "Shipping and delivery" },
  { id: "returns-refunds", label: "Returns and refunds" },
  { id: "account-responsibilities", label: "Account responsibilities" },
  { id: "limitation-of-liability", label: "Limitation of liability" },
  { id: "contact-and-complaints", label: "Contact and complaints" },
  { id: "changes", label: "Changes to these terms" },
];

export default function Terms() {
  return (
    <LegalLayout
      eyebrow="Using Our Website"
      title="Terms & Conditions"
      seo={{
        title: "Terms & Conditions | Alyona Bags",
        description:
          "Terms for using the Alyona Bags website: products and pricing, orders and payments, shipping in India, returns and refunds, accounts and contact details.",
        path: "/terms-and-conditions",
      }}
      intro={`These terms apply when you browse the ${BUSINESS_NAME} website, create an account, send an enquiry or place an order. By using the website or placing an order, you agree to them. Please read them together with our Privacy Policy.`}
      toc={toc}
    >
      <LegalSection id="general-terms" title="General terms">
        <LegalList
          items={[
            "The website can be used by both wholesale and retail customers.",
            "You must be at least 18 years old to create an account, place an order or send an enquiry.",
            <>Our <LegalLink to="/privacy">Privacy Policy</LegalLink> explains how we handle your information.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="products-and-pricing" title="Products and pricing">
        <LegalList
          items={[
            "Some products have a fixed price shown on the website. Others need an enquiry or quotation, and we will share pricing and minimum order quantity after reviewing your request.",
            "Product availability depends on stock or on manufacturing.",
            "Product details, prices and availability may change.",
          ]}
        />
      </LegalSection>

      <LegalSection id="orders-and-payments" title="Orders and payments">
        <LegalList
          items={[
            "Placing an order is a request to buy. Orders are subject to confirmation by us after we check availability. If we cannot confirm or fulfil an order, we will contact you about how to proceed, including any amount you have paid.",
            "Online payments are processed through Razorpay. We do not receive or store your card, UPI or bank account details.",
            "Payment success on the website or Razorpay does not by itself mean the order is confirmed. You can follow your order status in My Orders after signing in.",
          ]}
        />
        <h3 className="pt-2 font-medium text-ink-900">Cancellation</h3>
        <p>
          You may request cancellation before your order is dispatched or before manufacturing begins. While an order shows
          “Placed” or “Confirmed”, you may be able to cancel it yourself from its page in My Orders. Orders already being
          processed, manufactured or shipped may not be cancellable, and we will tell you if cancellation is still possible
          when you contact us.
        </p>
        <p>
          Cancelling an order on the website updates its status only. It does not automatically refund an online payment, so
          if you have paid and cancel, please contact us (see <LegalLink to="/contact">Contact</LegalLink>) so that we can look
          into your payment. We do not promise automatic cancellation or automatic refunds.
        </p>
      </LegalSection>

      <LegalSection id="shipping-and-delivery" title="Shipping and delivery">
        <LegalList
          items={[
            "Delivery is available within India only.",
            "Delivery timelines are estimates. They depend on stock availability and on manufacturing, and they are not guaranteed.",
            "Where shipping charges apply, they depend on order value, product weight and delivery location.",
          ]}
        />
      </LegalSection>

      <LegalSection id="returns-refunds" title="Returns and refunds">
        <p>If your product arrives damaged, defective or different from what you ordered, please tell us as soon as you can.</p>
        <LegalList
          items={[
            "Please report the problem within 24 hours of delivery.",
            <>
              Contact us by phone or WhatsApp using the numbers on our <LegalLink to="/contact">Contact page</LegalLink>, or by
              email at <LegalMailLink email={BUSINESS_EMAIL} />.
            </>,
            "Please give your order ID and photographs of the product. Where you have one, an unboxing video helps us a great deal.",
            "We will verify your report and decide the appropriate resolution. Depending on the circumstances, an eligible case may receive a replacement or a refund.",
          ]}
        />
        <p>
          The 24-hour period and the photographs or video help us check a report quickly. They are not a bar to a genuine claim:
          if you report later or cannot supply every item, we will still consider what you tell us. Nothing in these terms
          limits any right you have as a consumer under applicable law.
        </p>
        <p>We do not offer automatic refunds, and each report is reviewed before a replacement or refund is decided.</p>
      </LegalSection>

      <LegalSection id="account-responsibilities" title="Account responsibilities">
        <LegalList
          items={[
            "You are responsible for keeping your account credentials and password safe, and for activity on your account. Please tell us promptly if you think someone else has used your account.",
            "Please give accurate and current information when you register, enquire or order.",
            "We may suspend or terminate an account for fraud, false information, unauthorised access, or misuse of the website, subject to applicable law.",
          ]}
        />
      </LegalSection>

      <LegalSection id="limitation-of-liability" title="Limitation of liability">
        <p>
          {BUSINESS_NAME} makes reasonable efforts to keep the website available and to resolve technical issues. Technical
          problems and unavoidable delays may still occur from time to time. To the extent permitted by applicable law, we are
          not liable for loss caused by website interruptions or delays that happen despite those efforts.
        </p>
        <p>
          Nothing in these terms excludes or limits any liability, or any right you have as a consumer, that cannot be excluded
          or limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="contact-and-complaints" title="Contact and complaints">
        <p>
          Email: <LegalMailLink email={BUSINESS_EMAIL} />
          <br />
          Address: {BUSINESS_NAME}, {BUSINESS_ADDRESS}
        </p>
        <p>
          You can send a question or complaint through the <LegalLink to="/contact">contact form</LegalLink> or by email. See{" "}
          <LegalLink to="/contact#grievance">how complaints are handled</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to these terms">
        <p>
          We may update these terms from time to time. The “Last updated” date above shows the latest revision.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
