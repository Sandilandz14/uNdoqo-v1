# uNdoqo V2.5 — Persistent Commerce

This release is built on V2.4. It preserves the existing public site, fonts, branding, Contact page and global navigation.

**Begin here:** `COMMERCE_SETUP.md` (Supabase migration, server secrets, PayPal webhook registration, sandbox test steps and release gates).

- Database migration: `db/001_commerce.sql`
- PayPal checkout: `netlify/functions/paypal.js`
- PayPal webhook: `netlify/functions/paypal-webhook.js`
- Buyer order status: `pages/order-status.html`
- Administrator order list: `pages/orders-admin.html` (read-only, shared secret; strengthen before production)
- Browser checkout: `js/checkout.js` — original STU-style receipts and signature retained
- Automated checks: `node --test tests/*.test.js`

These files are **not connected to an actual Supabase database** until you create a project, apply the migration and configure environment secrets. Sandbox credentials exposed in previous screenshots must be rotated.
