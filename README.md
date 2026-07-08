# ShopFlow

A multi-tenant e-commerce platform. Each user can spin up a fully-themed online store on a subdomain (or their own custom domain), accept payments via Stripe Connect, and manage products, orders, and customers from a unified dashboard.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind v4**
- **Prisma 7** + **PostgreSQL (Neon serverless)**
- **Clerk** — owner authentication
- **Custom JWT (jose)** — storefront customer authentication
- **Stripe** — Connect (per-store payments) + Billing (ShopFlow subscriptions)
- **ImageKit** — image/video hosting
- **Resend** — transactional email
- **Vercel** — hosting + domain management

## Architecture

Three surfaces, served from the same Next.js app and routed by hostname in [src/proxy.ts](src/proxy.ts):

| Hostname | Surface |
|---|---|
| `shopflow.app` (root) | Marketing site + owner dashboard |
| `*.shopflow.app` | Customer-facing storefronts |
| Any other domain | Custom-domain storefronts (rewritten to `/custom-domain/<host>/`) |

## Plans

See [src/lib/plans.ts](src/lib/plans.ts) for the source of truth.

| | Free | Basic ($19/mo) | Pro ($49/mo) |
|---|---|---|---|
| Products | 10 | Unlimited | Unlimited |
| Storage | 500 MB | 5 GB | 25 GB |
| Custom domain | ❌ | ✅ | ✅ |
| Custom CSS / HTML | ❌ | ✅ | ✅ |
| Take-rate (Stripe sales) | 5% | 2% | 0.5% |

14-day free trial on Basic, no credit card required.

## Local Setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# fill in DATABASE_URL, Clerk keys, Stripe keys, JWT_SECRET, Resend, etc.

# 3. Generate Prisma client + sync schema
npx prisma generate
npx prisma db push   # for first-time setup

# 4. Run
npm run dev
```

Open http://localhost:3000.

## Stripe Setup

1. **Create a Stripe account** and turn on Connect (Express).
2. **Subscription products** (for ShopFlow itself) — in Stripe Dashboard → Products, create two products: "Basic" and "Pro". Each needs a monthly and yearly price. Copy the `price_…` IDs into:
   - `STRIPE_PRICE_BASIC_MONTHLY` / `STRIPE_PRICE_BASIC_YEARLY`
   - `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY`
3. **Webhook** — point a webhook at `https://yourdomain.com/api/webhooks/stripe` and subscribe to:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `account.updated`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Billing portal** — in Stripe Dashboard → Settings → Billing → Customer portal, enable cancel + payment method updates.

Local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Custom Domain Provisioning

Custom domains are added to the Vercel project automatically when an owner connects one (see [src/lib/vercel.ts](src/lib/vercel.ts)).

Set:
- `VC_API_TOKEN` — token from https://vercel.com/account/tokens
- `VC_PROJECT_ID` — Vercel Settings → General → Project ID
- `VC_TEAM_ID` — only if the project is owned by a team

Owners point a CNAME at `cname.vercel-dns.com` for their domain. Vercel auto-provisions SSL.

## Database Migrations

```bash
# Dev: create + apply
npx prisma migrate dev --name <change_name>

# Prod: apply pending migrations
npx prisma migrate deploy
```

The migration in [prisma/migrations/20260509000000_add_subscription_billing](prisma/migrations/20260509000000_add_subscription_billing) adds the Plan enum and billing fields to Store. Apply it before deploying.

## Health & Monitoring

- `GET /api/health` returns `200 ok` (or `503` with `db: error`). Point your uptime monitor here.
- For error tracking, install Sentry and set `SENTRY_DSN`.

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables from `.env.example`.
4. Set the production domain (e.g. `shopflow.app`) and add a wildcard `*.shopflow.app`.
5. Update Clerk and Stripe to use production keys + production webhook secret.
6. Deploy.

## Folder Layout

```
src/
  app/
    page.tsx                  Marketing homepage
    pricing/                  Public pricing page
    dashboard/                Owner dashboard (Clerk-protected)
    store/[subdomain]/        Customer-facing storefront
    custom-domain/[domain]/   Same storefront under a custom domain
    api/
      stores/[storeId]/       Owner-side API (Clerk-protected)
      storefront/[subdomain]/ Customer-side API
      billing/                ShopFlow subscription API
      webhooks/stripe/        Stripe webhook handler
  components/                 Marketing site + dashboard shared components
  lib/
    plans.ts                  Plan definitions & limit helpers
    entitlements.ts           Plan enforcement helpers
    stripe.ts                 Shared Stripe client
    store-auth.ts             Storefront customer JWT
    sanitize.ts               XSS sanitization for owner-supplied CSS/HTML
    rate-limit.ts             In-memory rate limiter
    vercel.ts                 Vercel domains API
prisma/
  schema.prisma
  migrations/
```

## Production Checklist

Before going live, verify:

- [ ] All env vars set in Vercel (no `_test_` keys).
- [ ] `JWT_SECRET` is a 48+ char random string and rotated from any committed value.
- [ ] Stripe is in **live** mode; webhook secret matches the live endpoint.
- [ ] Stripe Connect platform settings (TOS, brand, statement descriptor) are filled in.
- [ ] `STRIPE_PRICE_*` env vars point to live-mode price IDs.
- [ ] Resend domain is verified.
- [ ] Wildcard DNS `*.<your-domain>` is set up at the registrar and added in Vercel.
- [ ] `/terms` and `/privacy` are reviewed by you (or a lawyer).
- [ ] Sentry or another error tracker is configured.
- [ ] Database point-in-time recovery is enabled (Neon paid plan).

## License

Proprietary — All rights reserved.
