
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const parseSender = (raw) => {
  if (!raw) return { name: "Alyona Bags", email: "no-reply@alyonabags.com" };
  const match = raw.match(/^"?([^"<]*)"?\s*<(.+)>$/);
  if (match)
    return { name: match[1].trim() || "Alyona Bags", email: match[2].trim() };
  return { name: "Alyona Bags", email: raw.trim() };
};

// Generic sender used by all notification helpers below.
export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn(
      "BREVO_API_KEY not configured — emails will be logged to console instead of sent.",
    );
    console.log(
      `[email:skipped - no BREVO_API_KEY configured] To: ${to} | Subject: ${subject}`,
    );
    return { skipped: true };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: parseSender(process.env.SMTP_FROM),
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Brevo API responded ${res.status}: ${errBody}`);
    }

    return { sent: true };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { sent: false, error: err.message };
  }
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;">${item.name}${item.color ? ` (${item.color})` : ""}</td>
          <td style="padding:8px 0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">₹${item.price.toLocaleString("en-IN")}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1C1A16;">
      <h2 style="color:#242E20;">Thank you for your order, ${user.name}!</h2>
      <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <thead>
          <tr style="border-bottom:1px solid #DCD3BF; text-align:left;">
            <th style="padding-bottom:8px;">Item</th><th style="padding-bottom:8px;">Qty</th><th style="padding-bottom:8px; text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right; font-size:16px;"><strong>Total: ₹${order.total.toLocaleString("en-IN")}</strong></p>
      <p>We'll email you again once your order ships.</p>
      <p style="color:#7A5A3A;">— Alyona Bags</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
  });
};

export const sendOrderStatusEmail = async (user, order) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1C1A16;">
      <h2 style="color:#242E20;">Order Update</h2>
      <p>Hi ${user.name}, your order <strong>${order.orderNumber}</strong> status is now:</p>
      <p style="font-size:18px; text-transform:capitalize;"><strong>${order.orderStatus}</strong></p>
      ${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ""}
      <p style="color:#7A5A3A;">— Alyona Bags</p>
    </div>
  `;
  return sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber} — ${order.orderStatus}`,
    html,
  });
};

export const sendVerificationEmail = async (user, token) => {
  const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1C1A16;">
      <h2 style="color:#242E20;">Verify your email, ${user.name}</h2>
      <p>Thanks for creating an account with Alyona Bags. Please confirm this is your email address to activate your account.</p>
      <p style="margin:28px 0;">
        <a href="${link}" style="background:#242E20; color:#F6F4EF; padding:12px 28px; border-radius:6px; text-decoration:none; display:inline-block;">
          Verify Email Address
        </a>
      </p>
      <p style="font-size:13px; color:#6B6459;">Or copy and paste this link into your browser:<br />${link}</p>
      <p style="font-size:13px; color:#6B6459;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      <p style="color:#7A5A3A;">— Alyona Bags</p>
    </div>
  `;
  return sendEmail({
    to: user.email,
    subject: "Verify your email — Alyona Bags",
    html,
  });
};
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1C1A16;">
      <h2 style="color:#242E20;">Reset your password, ${user.name}</h2>
      <p>We received a request to reset the password for your Alyona Bags account. Click the button below to create a new password.</p>
      <p style="margin:28px 0;">
        <a href="${resetUrl}" style="background:#242E20; color:#F6F4EF; padding:12px 28px; border-radius:6px; text-decoration:none; display:inline-block;">
          Reset Password
        </a>
      </p>
      <p style="font-size:13px; color:#6B6459;">Or copy and paste this link into your browser:<br />${resetUrl}</p>
      <p style="font-size:13px; color:#6B6459;">This link expires in 15 minutes and can only be used once. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
      <p style="color:#7A5A3A;">— Alyona Bags</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: "Reset your Alyona Bags password",
    html,
  });
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1C1A16;">
      <h2 style="color:#242E20;">Welcome to Alyona Bags, ${user.name}!</h2>
      <p>Your account has been created. Start browsing our premium bag collection.</p>
      <p style="color:#7A5A3A;">— Alyona Bags</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: "Welcome to Alyona Bags", html });
};
