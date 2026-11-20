# uNdoqo V2.5 — Supabase / PayPal / Netlify Setup

## 1. Database (required)

1. Create a Supabase project at https://supabase.com/dashboard .
2. Open **SQL Editor**. Execute `db/001_commerce.sql` in the project.
3. In **Project Settings → API**, copy the **Project URL** and the privileged server-side key (legacy service_role or equivalent secret key compatible with PostgREST). **Never expose a service role key in frontend code.**
4. Verify new tables exist (`orders`, `order_items`, `customers`, `payments`, `invoices`, `bookings`, `digital_entitlements`, `paypal_webhook_events`). RLS is enabled and no customer tables have browser-access policies.

## 2. Local environment

In `C:\\uNdoqo_application\\.env`:

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=NEW_ROTATED_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=NEW_ROTATED_SANDBOX_SECRET
PAYPAL_USD_PER_ZAR=APPROVED_RATE_FOR_TESTING
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_ONLY_KEY
PAYPAL_WEBHOOK_ID=FROM_PAYPAL_AFTER_REGISTRATION
UNDOQO_ADMIN_API_KEY=RANDOM_64_CHARACTER_HEX_SECRET
```

Generate an admin key via `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and put it only in Netlify/local environment. `.gitignore` excludes `.env`.

## 3. PayPal webhook (required for reliable recovery)

In PayPal Developer Dashboard → Your App → Webhooks, register the **deployed public HTTPS URL**:

`https://YOUR_NETLIFY_DOMAIN/.netlify/functions/paypal-webhook`

Subscribe at least to `PAYMENT.CAPTURE.COMPLETED`, and copy the assigned **Webhook ID** into `PAYPAL_WEBHOOK_ID` for the matching Sandbox or Live environment. `localhost` is not publicly reachable for webhook delivery. For local webhook testing use an appropriately secured tunnel; otherwise use a Netlify Deploy Preview with sandbox credentials (for testing) or a staging site.

The function uses PayPal's `verify-webhook-signature` API and then retrieves the authoritative order from PayPal before finalising. Invalid signatures are rejected; transient failures return a retryable non-2xx response.

## 4. Testing

```powershell
node --test tests/*.test.js
npx netlify-cli dev
```

- Open `http://localhost:8888/pages/bookstore.html`, place a sandbox test order, and click PayPal Checkout.
- Use a **personal sandbox buyer**, never a real card. Approve payment and verify the on-screen invoice number.
- Open `http://localhost:8888/pages/order-status.html` **in the same tab** and refresh order state.
- Open `http://localhost:8888/pages/orders-admin.html`; enter the admin secret to list recent orders. Do not share or save the key in screenshots or browser storage.
- Verify exactly **one** payment, invoice and entitlement per order in Supabase (even if the capture callback/webhook repeats).
- Verify consultation orders create a booking `awaiting_scheduling`. Paid book orders create `pending_asset` entitlements (no downloads until secure delivery is implemented).
- Check PayPal Business sandbox Activity for the same capture ID and USD amount.

### SQL read-only QA checks

```sql
select o.id,o.status,o.total_zar,o.total_usd,o.paypal_order_id,o.paypal_capture_id,i.invoice_number
from public.orders o left join public.invoices i on i.order_id=o.id order by o.created_at desc limit 20;
select provider_capture_id,count(*) from public.payments group by 1 having count(*)>1;
select order_id,product_id,count(*) from public.digital_entitlements group by 1,2 having count(*)>1;
```

Expected duplicate-check result: **zero rows**.

## 5. Deployment / branch discipline

Use a feature branch such as `feature/v25-persistent-commerce`, run `node --test tests/*.test.js`, publish a Deploy Preview on Netlify, configure environment secrets under Netlify Site configuration, and test sandbox payments. Never commit `.env` or service role keys. Merge to main and switch to `PAYPAL_MODE=live` **only after** a production-readiness review, webhook testing, staff authentication strengthening, invoice/tax verification and digital-delivery setup.

## 6. Limitations and choices

- FX is still a merchant-approved static sandbox quote (`PAYPAL_USD_PER_ZAR`). Use a licensed FX-rate source and explicit expiry/locking before going live.
- Unique invoice numbers are allocated by the database sequence **on successful capture**. Pro-forma draft reference is not an accounting invoice.
- Retain transaction logs and data according to applicable South African privacy/accounting requirements; request a local professional review of invoice/VAT rules.
- Existing sandbox transactions from V2.4 will **not** automatically appear in this new database. A separate controlled backfill/reconciliation process is necessary if those historical test payments are to be imported.
- Digital purchase entitlements are not automatically download links. Grant secure, time-limited access only after obtaining and uploading source PDFs with appropriate rights.
- Admin dashboard uses a private shared key as an interim operational tool. Before public production, prefer Supabase Auth/MFA and individual permissions with an audit log.
