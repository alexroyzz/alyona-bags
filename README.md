# Alyona Bags — Premium Catalogue + Ecommerce

A premium, fully responsive MERN website that started as a B2B wholesale catalogue and now
also supports full ecommerce: customer accounts, cart, wishlist, checkout with Razorpay,
coupons, order tracking, invoices, and email notifications — alongside the original
wholesale enquiry flow (Call Now / WhatsApp / Request Quote), which is untouched.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios + Framer Motion
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT — two separate identities: **Admin** (store management) and **User** (customers)
- **Payments:** Razorpay (Cards / UPI / Netbanking) + Cash on Delivery
- **Images/Invoices:** Cloudinary + Multer, PDF invoices via pdfkit
- **Email:** Brevo

## Project Structure

```
alyona-bags/
├── backend/
│   ├── config/          # DB + Cloudinary config
│   ├── middleware/       # auth.js (admin), userAuth.js (customer), upload, errors
│   ├── models/           # Admin, User, Product, Category, Cart, Wishlist, Order, Coupon, Enquiry, Settings
│   ├── controllers/
│   ├── routes/
│   ├── utils/             # JWT helper, seed script, email, invoice PDF, order numbers
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # axios.js (admin+public), userAxios.js (customer)
        ├── context/        # AuthContext (admin), UserAuthContext, CartContext, WishlistContext
        ├── components/     # Navbar, Footer, cards, gallery, accordion, cart drawer, admin layout...
        ├── pages/          # Home, Categories, ProductDetails, About, Contact,
        │                   # Login, Register, Cart, Wishlist, Checkout, OrderSuccess/Failure,
        │                   # MyOrders, OrderDetails
        └── pages/admin/    # Login, Dashboard, Products, Categories, Orders, Coupons, Enquiries, Settings
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: MONGO_URI, JWT_SECRET, CLOUDINARY_*, RAZORPAY_*, SMTP_*, ADMIN_EMAIL/PASSWORD
npm install
npm run seed     # creates the first admin account from .env
npm run dev      # starts on http://localhost:5000
```

You'll need:
- A MongoDB connection string
- A [Cloudinary](https://cloudinary.com) account (product images + generated invoice PDFs)
- A [Razorpay](https://razorpay.com) account — grab your **Key ID** and **Key Secret** from
  the dashboard (use Test Mode keys while developing)
- SMTP credentials for order emails (e.g. a Gmail account with an
  [App Password](https://myaccount.google.com/apppasswords), or any SMTP provider). If you
  skip this, emails are simply logged to the server console instead of sent — nothing breaks.

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev             # starts on http://localhost:5173
```

### 3. Admin panel

Visit `/admin/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`
(created by `npm run seed`). From there manage Products (now with price/SKU/stock),
Categories, **Orders**, **Coupons**, Enquiries, and Settings.

### 4. Customer accounts

Customers register/login at `/register` and `/login` — completely separate from the admin
login, with their own JWT and token storage, so admin sessions are never affected.

## Ecommerce flow

1. Browse products → **Add to Cart** or **Buy Now** on the redesigned Product Details page.
2. **Cart** (`/cart`) → review items → **Checkout** (`/checkout`, requires login).
3. Enter shipping address, optionally apply a coupon, choose **Pay Online** (Razorpay) or
   **Cash on Delivery**.
4. On success → **Order Success** page → order confirmation email + PDF invoice generated
   automatically → visible in **My Orders** with live status tracking.
5. Admin updates order status/tracking number from **Admin → Orders**, which triggers a
   status-update email to the customer.

## Notes on the Product Details redesign

- Left-hand vertical thumbnail rail (desktop) / horizontal scroll (mobile) with smooth
  crossfade between images and a hover-zoom on the main image.
- Specification block (Material, MOQ, Colors, Features) plus accordion sections
  (Description, Shipping, Customization, Care Instructions) — all driven by new optional
  fields on the Product model (`shippingInfo`, `customizationInfo`, `careInstructions`)
  with sensible defaults, so existing products keep working without edits.
- Related Products pulls other items from the same category.
- Sticky Add to Cart / Buy Now bar on mobile; both actions are inline on desktop.

## Notes on payment icons

The Visa/Mastercard/RuPay/UPI/GPay/PhonePe/Paytm badges in `PaymentIcons.jsx` are simple
generic labeled badges (not traced brand artwork) — safe placeholders that communicate
"these payment rails are supported." Swap in official brand assets if you have licensing
to do so.

## Notes on the hero image

The hero section (`src/components/Hero.jsx`) pulls from **Admin → Settings → Hero Banner**.
No hero image was attached to the original brief, so it falls back to a stock photo until
you upload your own.

## Key design choices

- **Palette:** deep forest green, warm umber/brass, and stone neutrals — unchanged from the
  original build. All new ecommerce UI (cart, checkout, orders) reuses the same
  `btn-primary` / `btn-secondary` / `card-surface` utility classes, so nothing looks bolted on.
- **Typography:** Fraunces (display serif) + Inter (body/UI) — unchanged.
- Two independent JWT identities (Admin vs User) with two separate axios instances and
  React contexts, so the existing admin panel logic was never touched.
- Server-side price calculation: the backend always recalculates order totals from live
  product data — client-sent prices are never trusted.

## Production checklist

- Set `NODE_ENV=production` and a strong random `JWT_SECRET`.
- Restrict `CLIENT_URL` (CORS) to your deployed frontend domain.
- Switch Razorpay to Live Mode keys once ready to accept real payments.
- Point `MONGO_URI` at your production MongoDB (e.g. MongoDB Atlas).
- Configure real SMTP credentials for order/status emails.
- Build the frontend with `npm run build` and deploy `dist/`; deploy the backend to any
  Node host (Render, Railway, EC2, etc).
