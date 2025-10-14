# Security

## Guardrails

- **No secrets in code.** Use .env files and deploy envs.
- **Validate all inputs** with zod.
- **Webhook:** verify Stripe signature; raw body for that route only.
- **Auth:** admin endpoints require Bearer JWT; strong bcrypt hashes; rotate `JWT_SECRET` for prod.
- **CORS:** restrict to configured origin(s).
- **Errors:** no stack traces in responses; use standardized error shapes.
- **Dependencies:** run `pnpm audit` weekly; keep Prisma/Stripe libs up to date.
