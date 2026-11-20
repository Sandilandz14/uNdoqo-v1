# uNdoqo V2 — Implementation progress report
**Date:** 15 November 2026  | **Release:** candidate implementation, NOT production approved

| Workstream | Status | Details |
|---|---|---|
| Existing site and brand preservation | Implemented in code | Kept original logos, colour tokens, layout structure and local assets; enlarged nav logo |
| Homepage | Implemented in code | Photographic hero, uNdoqo/STU entry choices and user-supplied social links |
| Bookstore | Implemented in code | Smaller tiles, dynamic catalogue, cart, totals, quantities, checkout navigation |
| Consultations | Implemented in code | Reworked package layout with R350/2h and R500/3h products, service enquiry |
| PayPal | Integrated, unverified | Netlify Functions server-side quote/create/capture and SDK v6, with merchant-configured USD rate; credentials and sandbox validation pending |
| Pro-forma and paid receipt | Implemented in code, acceptance pending | Browser-printable documents; receipt only after verified PayPal capture; no durable invoicing database |
| WhatsApp | Implemented in code | User-directed share of paid reference; no automatic messaging service |
| Media channels | Partly implemented | Channel links and dedicated landing pages; five user-supplied TikTok video URLs loaded; YouTube individual URLs still pending |
| Portfolio | Drafted | Existing Popi Show description preserved; Popi Show and UCT Xhosa Society speaking engagements grounded in supplied institutional documents; amaNgqosini details pending |
| About | Implemented in code | Concise copy and organic heritage imagery |
| Contact | Implemented in code | Enlarged original uNdoqo logo; restored missing CSS and JS references |
| Donations | Enquiry pathway | No donation checkout activated; compliance/business scope pending |
| Clan repository | Draft MVP | Searchable starter data with provisional classifications and verification notices |
| CI/CD | Implemented in code | GitHub Actions syntax/unit-like smoke checks; Netlify release instructions |
| Full QA / release | Pending | Browser E2E, PayPal sandbox capture, accessibility, content permission and security signoff |

**Acceptance gate:** Do not claim live payment, automated latest 5 videos, confirmed collaborations, or production-ready invoices until respective external integrations and verification are complete.

## V2.1 update — 15 November 2026
- Embedded five supplied TikTok video IDs on media and TikTok landing pages (requires live browser/network confirmation; embeds may be restricted by TikTok).
- Preserved official social channel links; requested YouTube videos still need individual video URLs or API access.
- Directs user-initiated WhatsApp payment reference messages to +27 78 550 9649.
- Added institutionally documented Popi Show and UCT Xhosa Society speaking portfolio entries and three STU research programmes. UCT speaking is not represented as institutional endorsement or formal partnership.
- PayPal API screenshots exposed live/sandbox secrets; rotation is now a release blocker. No credentials embedded in project files.
- Producing a smaller distribution ZIP by optimizing original videos while preserving the filenames/paths.


## V2.2 requested fixes
- Removed the redundant "Explore uNdoqo" and "Explore STU" buttons from the hero; existing donation and programme actions remain.
- Fixed social links in the homepage hero to use clearly visible white text and contrasting hover styling.
- Added "Share Proforma & POP" after users click Print / Save pro-forma, with WhatsApp order details and instructions to attach the two documents manually.
- Checkout displays a specific explanation when opened through VS Code Live Server (port 5500). The PayPal function requires Netlify Dev or a deployed Netlify environment; no payment can be completed without rotated credentials and actual sandbox verification.
