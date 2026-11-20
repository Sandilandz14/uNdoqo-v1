# uNdoqo V2 — Git, CI/CD, Netlify and PayPal release guide

## Branches and PRs

Recommended: `main` = production, `develop` = integration/staging, `feature/*` = isolated work. This ZIP does **not** contain `.git`; copy these changes into your existing Git repository to retain original history. Never replace your existing `.git` folder.

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/undoqo-v2-site
# Copy contents of the extracted V2 package into the website repository.
git status
git add .
git commit -m "feat(site): V2 storefront, media, consultations and PayPal checkout"
git push -u origin feature/undoqo-v2-site
```

Open a pull request into `develop` (if established) or `main`. Require green CI, content review, accessibility review and payment sandbox verification before approval. Merge using squash for feature branches; retain tags on releases (`v2.0.0-rc1`, later `v2.0.0`). Back out via Git revert and Netlify deploy rollback.

## CI/CD

GitHub Actions `.github/workflows/ci.yml` runs syntax checking, catalogue checks, link/file checks and basic checkout assertions. Deploy previews for PRs should be enabled in Netlify. Connect Netlify to the correct repository, set publish directory to website root (or the `Website` subdirectory if retained in monorepo), and functions directory `netlify/functions`. Netlify detects `netlify.toml` when it is in the configured base directory. `develop` can be configured as a branch deploy; `main` is production. Use branch protection and review approvals.

For local serverless testing, install Netlify CLI in your development environment and run `netlify dev`; directly opening an HTML file will not execute checkout functions or JSON fetches. No PayPal sandbox payment was performed during this package build.

## PayPal configuration (mandatory before checkout)

Use https://developer.paypal.com/ to create sandbox business and buyer accounts. Configure **server-side** Netlify environment variables: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`, and `PAYPAL_USD_PER_ZAR` (merchant verified USD value per 1 ZAR, no default is supplied). Do not commit real secrets or exchange rates you haven't approved. Redeploy after adding environment variables.

**Currency:** PayPal Standard lists supported checkout currencies, but not ZAR. Catalogue values remain ZAR; the function converts to USD with the merchant-configured rate. Users see the exact USD charge, conversion rate and ZAR catalogue total before payment. Verify the merchant's eligibility for receiving PayPal payments and card funding in South Africa before launch. Debit/credit cards and alternative funding sources are conditional on buyer and merchant eligibility; do not promise every buyer a card button.

PayPal flow: cart → server quote → verified customer → PayPal SDK v6 → server order creation (PayPal Orders v2) → buyer approval → server verify and capture → receipt with PayPal capture ID → user-initiated WhatsApp share. Orders are not yet stored in a durable database or accounting system; the current receipt is generated client-side from the verified capture response and PayPal can be used to reconcile references.

**Before production, implement durable order persistence, idempotent capture handling, server-side invoice records/numbering, email fulfillment, webhook signature validation, refunds and dispute workflow, and scheduled FX configuration.** The shipped integration is a functional technical starting point, not financial operations sign-off. For paid digital books, implement secure authenticated delivery; do not expose premium PDFs as public site assets. Tax invoice compliance, VAT status, terms/refunds/privacy/POPIA and rights to distribute the catalogue require business review.

## Media

The user supplied five individual TikTok URLs, configured in the featured feed; YouTube individual video URLs and API authorization have not been supplied. To embed up to five verified videos per platform, add canonical watch URLs to `data/media-feeds.json` and deploy. A current-latest feed needs API access and scheduled synchronization; do not identify manually maintained videos as automatically latest. The media module deliberately uses live official channel links without inventing IDs.

## Operational acceptance tests

1. Desktop/mobile homepage logo, links, photography and navigation.
2. Bookstore: author filter, quantity +/- including zero and 50 maximum, cart persistence and server price check.
3. Sandbox payment: success, cancel, declined payment, invalid item, manipulated total, duplicate capture, cart mismatch and server down; never test live merchant money casually.
4. Receipt: paid vs pro-forma, correct currency, actual PayPal order/capture ID, WhatsApp share message.
5. Consultation bookings: no false confirmation of calendar date; test client enquiry handling.
6. Media embeds: real individual URLs work, invalid URLs ignored; no browser console errors.
7. Test keyboard navigation, focus, colours, forms, screen readers, performance, accessibility and browser compatibility.

## Known release blockers

- Sandbox and live merchant credentials not provided.
- USD/ZAR conversion rate and PayPal merchant account eligibility not confirmed.
- YouTube/TikTok individual video URLs or authorized API access not provided.
- UCT and amaNgqosini collaboration copy/permission not verified.
- Clan repository entries are preliminary and need research citations and community review.
- Permanent order storage, customer emails, fulfillment and compliance are not yet implemented.

## PayPal credentials exposure — security notice (15 November 2026)
Both sandbox and live PayPal API secrets, as well as a sandbox account password, were visible in screenshots in the conversation. **Rotate/revoke these immediately in PayPal, before running this site, and replace the environment variables with newly issued credentials.** Do not paste secrets into chats, static HTML, commits or public CI logs. A PayPal link/button is a useful no-code alternative for standalone consultation fees, but the API checkout is appropriate for multi-item storefront orders.


## V2.2: Fix "Unexpected end of JSON input" on local checkout
The PayPal Netlify Function is **not** available when the website is opened via VS Code Live Server (`127.0.0.1:5500`). Instead, from the project root run `npx netlify-cli dev` (or `netlify dev` if installed), and open the port printed by Netlify (normally `http://localhost:8888`). Netlify Dev loads environment configuration and exposes `/.netlify/functions/paypal`. Configure only newly rotated sandbox credentials securely in local environment variables, not the repository. The checkout now provides explanatory errors for invalid server responses.

## Share Proforma & POP
The new button appears after `Print / Save pro-forma` is clicked. Save the pro-forma as a PDF, then choose **Share Proforma & POP**. A prefilled WhatsApp message opens with customer/order details. The user attaches both files in WhatsApp manually. Browsers cannot silently attach a local PDF or proof-of-payment file to a WhatsApp link. Printing a pro-forma does not mean an order has been paid; payment proof must be verified against PayPal or merchant bank records before fulfillment.
