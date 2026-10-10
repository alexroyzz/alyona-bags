# Alyona Bags — Premium Catalogue + Ecommerce

A premium, fully responsive MERN website that started as a B2B wholesale catalogue and now
also supports full ecommerce: customer accounts, cart, checkout with Razorpay,
order tracking, invoices, and email notifications — alongside the original
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
│   ├── models/           # Admin, User, Product, Category, Cart, Order, Enquiry, Settings
│   ├── controllers/
│   ├── routes/
│   ├── utils/             # JWT helper, seed script, email, invoice PDF, order numbers
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # axios.js (admin+public), userAxios.js (customer)
        ├── context/        # AuthContext (admin), UserAuthContext, CartContext
        ├── components/     # Navbar, Footer, cards, gallery, accordion, cart drawer, admin layout...
        ├── pages/          # Home, Categories, ProductDetails, About, Contact,
        │                   # Login, Register, Cart, Checkout, OrderSuccess/Failure,
        │                   # MyOrders, OrderDetails
        └── pages/admin/    # Login, Dashboard, Products, Categories, Orders, Enquiries, Settings
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: MONGO_URI, JWT_SECRET, CLOUDINARY_*, RAZORPAY_*, BREVO_API_KEY, SMTP_FROM, ADMIN_EMAIL/PASSWORD
npm install
npm run seed     # creates the first admin account from .env
npm run dev      # starts on http://localhost:5000
```

You'll need:
- A MongoDB connection string
- A [Cloudinary](https://cloudinary.com) account (product images + generated invoice PDFs)
- A [Razorpay](https://razorpay.com) account — grab your **Key ID** and **Key Secret** from
  the dashboard (use Test Mode keys while developing)
- A Brevo API key for transactional email. If `BREVO_API_KEY` is omitted, email notifications
  are logged as skipped and the rest of the application continues to work.

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
Categories, **Orders**, Enquiries, and Settings.

### 4. Customer accounts

Customers register/login at `/register` and `/login` — completely separate from the admin
login, with their own JWT and token storage, so admin sessions are never affected.

## Search engine metadata

- The storefront sets page-specific titles, descriptions, canonical URLs, and Open Graph/Twitter metadata for its home, catalogue, category, product, about, and contact pages.
- Product pages publish Product/Offer JSON-LD. Product paths use their generated slugs; category links use `/categories/:slug`.
- The backend serves `/robots.txt` and a database-backed `/sitemap.xml` containing active category and product URLs.
- Set `PUBLIC_SITE_URL` in the backend production environment to the canonical public origin (for example, `https://www.example.com`). If omitted, sitemap URLs use the first `CLIENT_URL` origin.

## Ecommerce flow

1. Browse products → **Add to Cart** or **Buy Now** on the redesigned Product Details page.
2. **Cart** (`/cart`) → review items → **Checkout** (`/checkout`, requires login).
3. Enter shipping address and choose **Pay Online** (Razorpay) or
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

- Install PM2 on the host (`npm install -g pm2`), then from `backend/` run
  `pm2 start ecosystem.config.cjs --env production`. Use `pm2 status` and `pm2 monit` for
  process monitoring, and `pm2 logs alyona-api` for logs. Run `pm2 save` plus `pm2 startup`
  to restore the process after a host reboot. PM2 restarts a crashed process; it does not
  replace an external uptime monitor.
- Set `CLIENT_URL` to a comma-separated allowlist of deployed frontend origins. If the API
  sits behind a reverse proxy, set `TRUST_PROXY` to the exact trusted proxy hop count.
- Tune `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `MONGO_SERVER_SELECTION_TIMEOUT_MS`,
  `MONGO_CONNECT_TIMEOUT_MS`, and `MONGO_SOCKET_TIMEOUT_MS` for the MongoDB plan and load.
  The API retries failed database connections with capped exponential backoff and reports
  readiness as unavailable while MongoDB is disconnected.
- Configure request limits with `REQUEST_TIMEOUT_MS`, `HEADERS_TIMEOUT_MS`,
  `SOCKET_TIMEOUT_MS`, `KEEP_ALIVE_TIMEOUT_MS`, and `SHUTDOWN_TIMEOUT_MS`. Rate limits are
  controlled with `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`,
  and `AUTH_RATE_LIMIT_MAX`. The built-in limiter uses an in-memory store, so use a shared
  store before running multiple API instances.
- Configure an external uptime monitor to GET `/api/health/ready` and treat non-2xx as
  unavailable. `/api/health/live` checks only that the process is responding, while
  `/api/health/ready` and `/api/health` also require MongoDB to be connected.
- Set `NODE_ENV=production` and a strong random `JWT_SECRET`.
- Restrict `CLIENT_URL` (CORS) to your deployed frontend domain.
- Switch Razorpay to Live Mode keys once ready to accept real payments.
- Point `MONGO_URI` at your production MongoDB (e.g. MongoDB Atlas).
- Configure a valid Brevo API key and sender for order/status emails.
- Build the frontend with `npm run build` and deploy `dist/`; deploy the backend to any
  Node host (Render, Railway, EC2, etc).

## Performance and caching

- Catalogue queries use field projection, lean results, bounded pagination and indexes for
  active/category/featured product listings; order history/status queries also have sort
  indexes. MongoDB creates these schema indexes automatically when index creation is enabled.
- The catalogue search waits 300 ms after typing before sending a request.
- Route pages are loaded with React lazy imports. Cloudinary image delivery uses responsive
  widths with automatic format and quality selection, and image elements declare dimensions,
  sizes, lazy loading, and async decoding where appropriate. The hero image is prioritized.
- Public product, category, settings and about GET responses use short browser and shared-cache
  TTLs; authenticated responses are `no-store`. Vite hashed assets use immutable long-term
  caching, while the app shell revalidates.
