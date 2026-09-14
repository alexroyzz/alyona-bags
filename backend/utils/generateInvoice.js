import PDFDocument from "pdfkit";
import { cloudinary } from "../config/cloudinary.js";
import streamifier from "streamifier";

// Builds a simple PDF invoice in memory and uploads it to Cloudinary (raw resource),
// returning the hosted URL that gets stored on the order.
export const generateInvoicePDF = (order, user, companyName = "Alyona Bags") => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const uploadResult = await new Promise((res, rej) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "alyona-bags/invoices", resource_type: "raw", format: "pdf", public_id: order.orderNumber },
            (err, result) => (err ? rej(err) : res(result))
          );
          streamifier.createReadStream(buffer).pipe(uploadStream);
        });
        resolve(uploadResult.secure_url);
      } catch (err) {
        reject(err);
      }
    });

    // --- Content ---
    doc.fontSize(20).fillColor("#242E20").text(companyName, { align: "left" });
    doc.fontSize(10).fillColor("#666").text("Wholesale Bag Manufacturer", { align: "left" });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#1C1A16").text(`Invoice — ${order.orderNumber}`, { align: "left" });
    doc.fontSize(9).fillColor("#666").text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN")}`);
    doc.moveDown();

    doc.fontSize(11).fillColor("#1C1A16").text("Billed To:", { underline: true });
    doc.fontSize(10).fillColor("#333");
    doc.text(order.shippingAddress.fullName);
    doc.text(order.shippingAddress.phone);
    doc.text(`${order.shippingAddress.line1}${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}`);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor("#fff");
    doc.rect(50, tableTop, 500, 22).fill("#242E20");
    doc.fillColor("#fff").text("Item", 58, tableTop + 6, { width: 230 });
    doc.text("Qty", 300, tableTop + 6, { width: 60, align: "right" });
    doc.text("Price", 370, tableTop + 6, { width: 80, align: "right" });
    doc.text("Total", 460, tableTop + 6, { width: 80, align: "right" });

    let y = tableTop + 22;
    doc.fillColor("#1C1A16");
    order.items.forEach((item) => {
      doc.fontSize(9);
      doc.text(item.name + (item.color ? ` (${item.color})` : ""), 58, y + 6, { width: 230 });
      doc.text(String(item.quantity), 300, y + 6, { width: 60, align: "right" });
      doc.text(`Rs. ${item.price.toLocaleString("en-IN")}`, 370, y + 6, { width: 80, align: "right" });
      doc.text(`Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}`, 460, y + 6, { width: 80, align: "right" });
      y += 24;
    });

    doc.moveTo(50, y).lineTo(550, y).strokeColor("#DCD3BF").stroke();
    y += 12;

    const summaryLine = (label, value, bold = false) => {
      doc.fontSize(bold ? 11 : 10).fillColor("#1C1A16");
      doc.text(label, 370, y, { width: 80, align: "right" });
      doc.text(value, 460, y, { width: 80, align: "right" });
      y += 18;
    };

    summaryLine("Subtotal", `Rs. ${order.subtotal.toLocaleString("en-IN")}`);
    if (order.discount > 0) summaryLine(`Discount ${order.couponCode ? `(${order.couponCode})` : ""}`, `- Rs. ${order.discount.toLocaleString("en-IN")}`);
    summaryLine("Shipping", order.shippingFee > 0 ? `Rs. ${order.shippingFee.toLocaleString("en-IN")}` : "Free");
    summaryLine("Total", `Rs. ${order.total.toLocaleString("en-IN")}`, true);

    doc.moveDown(3);
    doc.fontSize(9).fillColor("#999").text("Thank you for shopping with Alyona Bags.", 50, doc.y, { align: "center", width: 500 });

    doc.end();
  });
};
