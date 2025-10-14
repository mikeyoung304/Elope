# ADR 0001: Modular Monolith

## Context

Solo build, rapid MVP, future extractability.

## Decision

Use a modular monolith with domains/ports/adapters + contract‑first API.

## Consequences

Simple deploy, fewer moving parts, safer vibe‑coding. Clean seams allow later extraction to services if needed.
