# ADR 0002: Mock-First

## Context

External keys/webhooks slow teams; we want momentum.

## Decision

Ship a complete flow using mock adapters (in‑memory repos, fake checkout, console emails), then flip to real.

## Consequences

Faster demos/tests. Contracts & domains stay stable while adapters swap.
