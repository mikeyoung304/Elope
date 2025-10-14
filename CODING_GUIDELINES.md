# Coding Guidelines

## TypeScript

- **TypeScript strict.** No `any`. Prefer explicit return types.

## Imports

- **FE** uses contracts client.
- **BE** controllers use contracts server bindings.

## Boundaries

- **Domains** never import adapters or http.
- **Adapters** never import http.
- **Controllers** never reach into adapters directly (use services from DI).

## Data handling

- **Dates:** normalize to UTC midnight for booking/availability checks.
- **Money:** always `priceCents` integer; convert at edges.

## Errors

- Throw typed domain errors.
- HTTP layer maps to status codes.
