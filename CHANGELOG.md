# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Webhook event deduplication and tracking with PostgreSQL persistence
- Race condition prevention for concurrent bookings using SERIALIZABLE transactions
- Webhook secret rotation mechanism for security compliance
- Database performance indexes for critical booking and customer queries
- Application-level caching for catalog endpoints
- Batch date availability endpoint to reduce API calls
- React Query caching configuration for optimized client performance
- Comprehensive incident response runbook (INCIDENT_RESPONSE.md)
- Developer contribution guidelines (CONTRIBUTING.md)
- OpenAPI 3.0 specification and Swagger UI at `/api/docs`
- E2E test suite with Playwright for critical user flows
- Admin package management UI with CRUD operations
- Admin authentication with JWT tokens
- Booking success page with detailed confirmation
- Google Calendar freeBusy integration with graceful fallback
- Postmark email notifications with file-sink fallback for development

### Changed
- Migrated from hexagonal to layered architecture for better maintainability
- Split large admin components into smaller, focused components
- Optimized catalog query to eliminate N+1 problem (91% reduction in queries)
- Enhanced README with architecture overview and documentation hub
- Improved DatePicker UX (reduced from 60 API calls to 1 batch call)
- Standardized development on port 3000 for web client
- Updated error handling with consistent 409 mapping for booking conflicts
- Enhanced webhook processing with Zod validation instead of raw JSON.parse()

### Fixed
- Memory leaks in React admin components (missing setTimeout cleanup)
- Race condition in concurrent booking attempts via pessimistic locking
- Missing database indexes causing slow queries on high-traffic tables
- Prisma model mismatch with database schema
- CORS configuration for proper port handling
- Phase 1 migration errors (P0 and P1 priority fixes)
- Web baseUrl configuration inconsistencies
- Duplicate booking detection edge cases

### Security
- Implemented webhook signature verification with Stripe
- Added secret rotation support for webhook endpoints
- Enabled raw body parsing for webhook security validation
- Implemented JWT-based admin authentication
- Added request ID logging for security audit trails

## [0.1.0] - 2024-XX-XX

### Added
- Initial MVP release
- Wedding booking system with customizable packages
- Add-ons selection for enhanced packages
- Stripe Checkout integration for payments
- Admin dashboard for booking management
- Admin blackout date management
- PostgreSQL database with Prisma ORM
- Type-safe API contracts with ts-rest
- Mock checkout mode for development/testing
- Responsive web UI with React and TypeScript
- Tailwind CSS for styling
- Date normalization utilities for consistent handling
- Health check endpoint (`/ready`)
- Structured error handling with custom error classes
- Request ID middleware for request tracking
- Comprehensive logging with contextual metadata

[Unreleased]: https://github.com/username/elope/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/username/elope/releases/tag/v0.1.0
