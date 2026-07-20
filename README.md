# Website E-commerce

Nền tảng thương mại điện tử multi-vendor: Next.js 16 (App Router) + TypeScript + Tailwind, Prisma 7 + PostgreSQL, Auth.js v5, Stripe/VNPay/Momo.

## Local development

Requirements: Node 24+, Docker Desktop.

```bash
cp .env.example .env        # already done in this repo; edit values as needed
npm install
npm run docker:up           # starts Postgres + Redis
npm run db:migrate          # creates tables from prisma/schema.prisma
npm run db:seed             # seeds demo admin/vendor/customer + sample products
npm run dev
```

Demo accounts after seeding:

| Role     | Email                | Password      |
| -------- | --------------------- | ------------- |
| Admin    | admin@example.com     | Admin123!     |
| Vendor   | vendor@example.com    | Vendor123!    |
| Customer | customer@example.com  | Customer123!  |

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run typecheck`, `npm run lint`
- `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`
- `npm run docker:up`, `npm run docker:down`

## Stack notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts` (`src/proxy.ts` here) — same behavior, new name.
- Prisma 7 has no `url` in `schema.prisma`; connection config lives in `prisma.config.ts` and the runtime driver adapter (`@prisma/adapter-pg`) in `src/lib/db.ts`.
- UI primitives are shadcn/ui on Base UI (not Radix) — polymorphism uses the `render` prop instead of `asChild`.

## Deploying to AWS

Architecture: CloudFront → ALB → ECS Fargate (this Next.js app) → RDS Postgres + ElastiCache Redis, with S3+CloudFront for uploaded assets. Provisioned with Terraform in `infra/` — see `infra/README.md` for bootstrap steps, cost notes, and custom domain/HTTPS setup.

CI/CD is GitHub Actions: `.github/workflows/ci.yml` (lint/typecheck/build on every PR) and `.github/workflows/deploy.yml` (build → push to ECR → deploy to ECS on push to `main`, via OIDC — no long-lived AWS keys). Enabling it requires a few Terraform outputs wired into GitHub repo variables; documented in `infra/README.md`.

Build the container image locally to sanity-check it: `docker build -t website-ecommerce .`
