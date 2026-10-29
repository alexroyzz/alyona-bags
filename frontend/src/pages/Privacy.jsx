import LegalLayout, { LegalSection, LegalList, LegalLink, LegalMailLink } from "../components/LegalLayout.jsx";
import { BUSINESS_NAME, BUSINESS_EMAIL, BUSINESS_ADDRESS } from "../constants/businessInfo.js";

// Google Analytics only runs when a valid measurement ID is configured at build time
// (see components/GoogleAnalytics.jsx), so the policy mentions it only in that case.
const analyticsEnabled = /^G-[A-Z0-9]+$/.test(import.meta.env.VITE_GA_MEASUREMENT_ID || "");

const toc = [
  { id: "who-we-are", label: "Who we are" },
  { id: "information-we-collect", label: "Information we collect" },
  { id: "how-we-use-information", label: "How we use your information" },
  { id: "payments", label: "Payments (Razorpay)" },
  { id: "service-providers", label: "Service providers and sharing" },
  { id: "cookies-and-storage", label: "Cookies and browser storage" },
  { id: "security-and-retention", label: "Security and retention" },
  { id: "your-rights", label: "Your rights and requests" },
  { id: "age", label: "Age requirement" },
  { id: "contact-and-complaints", label: "Contact and complaints" },
  { id: "changes", label: "Changes to this policy" },
];

export default function Privacy() {
  return (
    <LegalLayout
      eyebrow="Your Information"
      title="Privacy Policy"
      seo={{
        title: "Privacy Policy | Alyona Bags",
        description:
          "How Alyona Bags collects and uses account, order, payment, enquiry and website information, and how to make a privacy request.",
        path: "/privacy",
      }}
      intro={`This policy explains what personal information ${BUSINESS_NAME} collects through this website, how we use it, who it is shared with, and how you can contact us about it. It describes how the website works today.`}
      toc={toc}
    >
      <LegalSection id="who-we-are" title="Who we are">
        <p>
          This website is operated by {BUSINESS_NAME}, {BUSINESS_ADDRESS}. You can reach us at{" "}
          <LegalMailLink email={BUSINESS_EMAIL} />.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" title="Information we collect">
        <p>We collect only what the website needs to run your account, orders and enquiries.</p>
        <LegalList
          items={[
            <><strong>Account details:</strong> your name, email address, mobile phone number and password when you register. Your password is stored in hashed form, not as readable text. We also keep your email verification status and temporary verification and password-reset tokens (stored in hashed form).</>,
            <><strong>Saved addresses:</strong> name, phone number, address, city, state, pincode and country for any delivery address you save.</>,
            <><strong>Cart and customisation details:</strong> the products, quantities, colours and printing choices in your cart, any special instructions, and any logo image you upload for custom printing.</>,
            <><strong>Order details:</strong> items ordered, prices, the delivery address and phone number you give at checkout, any note you add for us, payment method and status, order status and tracking history, and the invoice generated for the order.</>,
            <><strong>Payment references:</strong> Razorpay order and payment IDs and the payment verification signature. We do not receive or store your card, UPI or bank account details; these are entered on Razorpay’s checkout.</>,
            <><strong>Enquiries:</strong> your name, phone number, optional email address, your message, and the product you asked about, when you use the contact form or Request a Quote form.</>,
            <><strong>Reviews:</strong> if you review a delivered product, your rating, title and comment are saved and shown on the product page together with your name.</>,
            <><strong>Communications:</strong> we keep a record of enquiries and the order and account emails we send you. If you contact us by email, phone or WhatsApp, we will have the details you choose to share.</>,
            <><strong>Technical data:</strong> to help prevent abuse, the website limits repeated requests, which temporarily uses your IP address in server memory.</>,
          ]}
        />
        <p>Please do not send card numbers, passwords or other sensitive information through the enquiry form or in your order note.</p>
      </LegalSection>

      <LegalSection id="how-we-use-information" title="How we use your information">
        <LegalList
          items={[
            "To create and secure your account, verify your email address and let you sign in or reset your password.",
            "To review, confirm, prepare, ship and deliver your orders, and to show order status and tracking.",
            "To take and verify payments, and to prepare invoices and keep order and accounting records.",
            "To send account and order emails, such as email verification, welcome, password reset, order confirmation and order status updates.",
            "To respond to enquiries and quotation requests, and to provide customer support, including complaints and damaged, defective or incorrect product reports.",
            "To show verified-purchase reviews on product pages.",
            "To keep the website secure, prevent fraud and misuse, and meet our legal obligations.",
          ]}
        />
        <p>
          The website does not currently include a newsletter or marketing sign-up. If marketing is introduced in future, we
          will ask for your consent separately and make it optional.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="Payments (Razorpay)">
        <p>
          Online payments are processed by Razorpay. When you pay, Razorpay’s checkout collects your payment details and
          handles them under its own terms and privacy policy. We receive confirmation of the payment result and the
          payment references listed above so that we can match the payment to your order.
        </p>
      </LegalSection>

      <LegalSection id="service-providers" title="Service providers and sharing">
        <p>We share information only as needed to run the website and fulfil your requests. The providers the website uses are:</p>
        <LegalList
          items={[
            "Razorpay, for online payment processing.",
            "A database hosting provider, which stores account, order and enquiry records.",
            "Brevo, which sends our account and order emails.",
            "Cloudinary, which stores and delivers product images, uploaded logos and order invoices.",
            "Our website hosting and infrastructure providers.",
            "Delivery or courier partners, who receive the name, address and phone number needed to deliver your order.",
          ]}
        />
        <p>
          Some providers may store or process information outside India. We may also disclose information where required by law
          or to protect our legal rights. Each provider handles information under its own privacy terms.
        </p>
      </LegalSection>

      <LegalSection id="cookies-and-storage" title="Cookies and browser storage">
        <p>
          When you sign in, the website saves a sign-in token and your basic account details in your browser’s local storage so
          that you stay signed in. This is cleared when you sign out. The website does not set its own advertising cookies.
        </p>
        <p>
          Some third-party content may set cookies or similar identifiers under its own policies: Razorpay checkout when you
          pay, Google Fonts for typefaces, and an embedded Google Map on the Contact page where one is configured.
        </p>
        {analyticsEnabled && (
          <p>
            We use Google Analytics 4 to understand how the website is used. It collects usage and device information such as
            pages visited and may use cookies or similar identifiers. We exclude admin pages, email verification, password reset
            and My Orders pages from analytics. You can control cookies through your browser settings, and you can block Google’s
            analytics with a browser add-on.
          </p>
        )}
      </LegalSection>

      <LegalSection id="security-and-retention" title="Security and retention">
        <p>
          We use reasonable safeguards, including hashed passwords and signature verification of payments. No website or
          transmission method is completely secure, so we cannot guarantee absolute security.
        </p>
        <p>
          We keep information for as long as needed for the purposes above, including to maintain your account, handle orders,
          returns and complaints, and keep records we are required to keep by law. Information may be kept longer where needed to
          resolve disputes or meet legal obligations.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your rights and requests">
        <p>
          Subject to applicable Indian law, you may ask us to give you information about the personal data we hold about you,
          correct or update it, delete it, or withdraw consent you have given. You can update your name, phone number and saved
          addresses yourself from <LegalLink to="/my-profile">My Profile</LegalLink> after signing in.
        </p>
        <p>
          To make any other privacy request, email <LegalMailLink email={BUSINESS_EMAIL} /> or use the{" "}
          <LegalLink to="/contact">contact form</LegalLink>, and say what you would like us to do. We may need to verify your
          identity first. We may be unable to delete information we are legally required to keep, such as order and invoice
          records, and we will explain if so. We will respond within a reasonable time, and within any period required by
          applicable law. Nothing in this policy limits rights you have under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="age" title="Age requirement">
        <p>
          The website is for people aged 18 or over. We do not knowingly collect personal information from anyone under 18. If you
          believe a minor has given us information, please contact us so that we can look into it.
        </p>
      </LegalSection>

      <LegalSection id="contact-and-complaints" title="Contact and complaints">
        <p>
          For privacy questions or complaints, email <LegalMailLink email={BUSINESS_EMAIL} /> or write to {BUSINESS_NAME},{" "}
          {BUSINESS_ADDRESS}. Complaints are handled by the owner as our Grievance Officer; see{" "}
          <LegalLink to="/contact#grievance">how complaints are handled</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          We may update this policy when the website’s features or our data practices change. The “Last updated” date at the top
          shows the latest revision. See also our <LegalLink to="/terms-and-conditions">Terms &amp; Conditions</LegalLink>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
