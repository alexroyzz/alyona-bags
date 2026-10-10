const answers = [
  ["What is the minimum order quantity?", "The minimum order quantity is shown on each product page. It can vary by product and customization requirements."],
  ["Can bags be customized with our logo?", "Many products support custom printing. Check the product details for the custom print option, or contact us with your design and quantity."],
  ["How long does shipping take?", "The estimated dispatch information is shown on each product page. Delivery time may vary by destination and order size; our team can confirm timing for a bulk order."],
  ["How do I request a bulk quote?", "Use the Request Bulk Quote option on a product page or send an enquiry through our contact page. Include the product, quantity, destination, and customization details."],
  ["Which payment methods are available?", "Available payment options are shown during checkout and may depend on the order and delivery details."],
  ["How can I check my order?", "Sign in and open My Orders to view order status and available tracking information."],
];

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: answers.map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  })),
};
