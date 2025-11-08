# Errors

## HTTP mapping

- **400** — validation failed (zod)
- **401** — auth required (admin)
- **403** — auth failed
- **404** — not found (package slug)
- **409** — booking date taken
- **422** — webhook invalid signature
- **500** — unhandled

## Domain errors

- `BookingDateTakenError` → 409
- `InvalidWebhookSignatureError` → 422
