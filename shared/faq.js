export const faqItems = [
  { title: "What is the minimum order quantity?", content: "The minimum order quantity is shown on each product page. It can vary by product and customization requirements." },
  { title: "Can bags be customized with our logo?", content: "Many products support custom printing. Check the product details for the custom print option, or contact us with your design and quantity." },
  { title: "How long does shipping take?", content: "The estimated dispatch information is shown on each product page. Delivery time may vary by destination and order size; our team can confirm timing for a bulk order." },
  { title: "How do I request a bulk quote?", content: "Use the Request Bulk Quote option on a product page or send an enquiry through our contact page. Include the product, quantity, destination, and customization details." },
  { title: "Which payment methods are available?", content: "Available payment options are shown during checkout and may depend on the order and delivery details." },
  { title: "How can I check my order?", content: "Sign in and open My Orders to view order status and available tracking information." },
];

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(({ title, content }) => ({
    "@type": "Question",
    name: title,
    acceptedAnswer: { "@type": "Answer", text: content },
  })),
};
