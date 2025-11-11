# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-07

### Added - Authentication & Security

- **Unified Authentication System** with role-based access control (RBAC)
  - Single `/login` endpoint supporting both Platform Admin and Tenant Admin roles
  - JWT-based authentication with 7-day token expiration
  - Role-based routing: Platform Admins → `/admin/dashboard`, Tenant Admins → `/tenant/dashboard`
  - Secure token storage in localStorage with automatic cleanup
  - AuthContext providing global authentication state
  - ProtectedRoute component for role-based access control

- **Login Rate Limiting** for enhanced security
  - Maximum 5 login attempts per 15-minute window per IP address
  - Automatic blocking with clear error messages after rate limit exceeded
  - In-memory rate limiting with configurable thresholds
  - Protection against brute-force attacks

- **Password Security Enhancements**
  - bcrypt password hashing with salt rounds of 10
  - Minimum password length: 12 characters
  - Strong password requirements enforced
  - Secure password comparison using constant-time algorithm

- **JWT Security Improvements**
  - HS256 algorithm for token signing
  - Cryptographically secure JWT_SECRET required (64-character hex string)
  - Token signature validation on all authenticated requests
  - Proper token expiry enforcement
  - No token leakage in error messages

### Added - Package Photo Upload Feature

- **Backend API Endpoints**
  - `POST /v1/tenant/admin/packages/:id/photos` - Upload package photo
  - `DELETE /v1/tenant/admin/packages/:id/photos/:filename` - Delete package photo
  - `GET /v1/tenant/admin/packages/:id` - Fetch package with photos
  - Maximum 5 photos per package enforced at API level
  - 5MB file size limit with proper error messages
  - Support for JPG, PNG, WebP, and SVG image formats

- **Database Schema Changes**
  - Added `photos` column to Package model (JSONB type)
  - Photos stored as JSON array with url, filename, size, and order fields
  - NOT NULL constraint with default empty array '[]'
  - Migration: `20251107_add_package_photos`

- **File Upload System**
  - Dedicated upload directory: `/server/uploads/packages/`
  - Secure filename generation: `package-{timestamp}-{randomId}.{ext}`
  - Automatic file cleanup on photo deletion
  - Tenant ownership verification before upload/delete
  - Multipart/form-data handling with Multer middleware

- **Frontend Components**
  - PackagePhotoUploader React component (462 lines)
  - Photo grid display with responsive layout (1/2/3 columns)
  - Drag-and-drop file upload UI
  - Delete confirmation dialog with photo preview
  - Client-side file validation (size, type, count)
  - Loading states and success/error feedback
  - TypeScript type safety throughout

- **API Integration Layer**
  - package-photo-api.ts service (400 lines)
  - usePackagePhotos React hook for state management
  - Automatic photo fetching on component mount
  - Optimistic UI updates for better UX
  - Comprehensive error handling with status code mapping

### Added - Platform & Tenant Dashboards

- **Platform Admin Dashboard** (`/admin/dashboard`)
  - System-wide metrics: total tenants, active tenants, total bookings, total revenue
  - Platform commission tracking and reporting
  - Tenant management interface with search functionality
  - Tenant creation and configuration
  - System-wide analytics and insights
  - No access to tenant-specific operational data (security boundary)

- **Tenant Admin Dashboard** (`/tenant/dashboard`)
  - Tenant-specific metrics: packages, bookings, blackout dates, branding status
  - Tabbed interface for organized workflows
  - Packages tab: Full CRUD operations for wedding packages
  - Bookings tab: View and manage tenant bookings
  - Blackouts tab: Manage blackout dates
  - Branding tab: Customize widget appearance (colors, logo, fonts)
  - Complete tenant data isolation enforced

- **Role-Based Navigation Component**
  - RoleBasedNav with sidebar and horizontal variants
  - Automatic menu items based on user role
  - Platform Admin navigation: Dashboard, Tenants, System Settings
  - Tenant Admin navigation: Dashboard, Packages, Bookings, Blackouts, Branding, Settings
  - Touch-friendly mobile design

### Added - User Role System

- **Database Schema Updates**
  - Extended UserRole enum: USER, ADMIN, PLATFORM_ADMIN, TENANT_ADMIN
  - Added `tenantId` field to User model (links TENANT_ADMIN to their tenant)
  - Added `users` relation to Tenant model (one-to-many)
  - Database indexes on tenantId for query performance
  - Migration: `20251107_add_user_roles`

- **Authorization Middleware**
  - Role validation on all protected routes
  - Tenant ownership verification for TENANT_ADMIN actions
  - JWT payload includes role and tenantId
  - Automatic 403 Forbidden for cross-tenant access attempts

### Changed

- **Login Page Improvements**
  - Unified single login page at `/login` (replaced separate admin/tenant logins)
  - Role-based redirection after successful authentication
  - Improved error messaging with specific failure reasons
  - Loading states during authentication
  - Better mobile responsive design

- **Authentication Flow**
  - Consolidated from dual-auth system to single unified endpoint
  - Removed separate `adminToken` and `tenantToken` storage keys
  - Single `authToken` with role-based routing
  - Backward compatibility maintained during migration
  - Legacy token cleanup on logout

- **API Client Enhancements**
  - Added FormData support for multipart uploads
  - Improved error response parsing
  - Better TypeScript type inference
  - Consistent error message formatting

- **Component Architecture**
  - Split large admin components into focused, reusable modules
  - Improved separation of concerns
  - Better prop typing with TypeScript
  - Enhanced accessibility (ARIA labels, semantic HTML)

### Fixed - Critical Security Vulnerabilities

- **Cross-Authentication Vulnerability** (CRITICAL)
  - Platform Admin tokens were incorrectly accepted for tenant admin endpoints
  - Added strict role validation middleware on all routes
  - Implemented route-level authorization checks
  - Proper 403 Forbidden responses for unauthorized access
  - Comprehensive test coverage for cross-authentication scenarios

- **Package Photo Database Persistence Bug** (CRITICAL)
  - Photos uploading to filesystem but not persisting to database
  - Root cause: Server using stale Prisma client before migration applied
  - Solution: Proper server restart sequence after schema changes
  - Added database transaction support for atomic file + DB operations
  - Orphaned file cleanup implemented

- **Missing Middleware Protection** (HIGH)
  - Tenant admin routes missing proper authorization middleware
  - Added requireTenantAdmin middleware to all tenant routes
  - Enforced role validation before handler execution
  - Prevented privilege escalation attacks

- **Token Storage Security** (MEDIUM)
  - Improved token cleanup on logout
  - Better token validation before usage
  - Clear error messages for expired tokens
  - No sensitive data in localStorage

### Fixed - Other Issues

- **Photo Upload Error Handling**
  - 401 Unauthorized: "Authentication required. Please log in again."
  - 403 Forbidden: "You don't have permission to perform this action."
  - 404 Not Found: "Package not found." / "Photo not found in package."
  - 413 Payload Too Large: "File too large (maximum 5MB allowed)."
  - 400 Bad Request: Context-specific validation messages

- **File Size Validation**
  - Client-side validation before upload
  - Server-side enforcement via Multer
  - Clear error messages with actual file size
  - User-friendly guidance for resolution

- **Tenant Isolation Verification**
  - Cross-tenant access properly blocked with 403 Forbidden
  - Package ownership verification on all operations
  - API key tenant association validated
  - No data leakage between tenants

### Security

- **Implemented Security Features**
  - Login rate limiting (5 attempts per 15 minutes)
  - bcrypt password hashing (salt rounds: 10)
  - JWT signature validation with HS256
  - Token expiry enforcement (7 days)
  - Role-based access control (RBAC)
  - Tenant data isolation at database level
  - File upload validation (size, type, count)
  - Filename sanitization to prevent path traversal
  - Secure file storage with randomized names
  - Authorization header validation
  - CORS configuration for proper origin handling

- **Fixed Security Vulnerabilities**
  - Cross-authentication privilege escalation (CRITICAL)
  - Missing authorization middleware (HIGH)
  - Improper role validation (HIGH)
  - Tenant boundary violations (MEDIUM)

### Documentation

- **Comprehensive Test Reports**
  - COMPREHENSIVE_TEST_REPORT.md (850 lines) - 67 tests across 5 test suites
  - CRITICAL_BUG_FIX_REPORT.md - Database persistence issue resolution
  - AUTH_TEST_SUMMARY.md - 21 authentication/authorization tests
  - MCP_VERIFICATION_REPORT.md - Database and filesystem verification

- **Implementation Documentation**
  - ROLE_BASED_ARCHITECTURE.md - Complete architecture guide
  - PACKAGE_PHOTO_UPLOADER_IMPLEMENTATION.md - Photo upload feature docs
  - PACKAGE_PHOTO_API_IMPLEMENTATION_SUMMARY.md - API integration guide
  - AUTH_QUICK_REFERENCE.md - Developer authentication reference

- **Quick Start Guides**
  - QUICK_START_PHOTO_UPLOADER.md - Photo upload integration
  - AUTH_TEST_INDEX.md - Test navigation guide
  - ROLE_QUICK_REFERENCE.md - Role-based routing reference

- **Code Documentation**
  - Inline JSDoc comments for all public APIs
  - TypeScript type definitions exported
  - Component prop documentation
  - Usage examples in code

### Testing

- **Authentication & Authorization** - 21/21 tests passed (100%)
  - JWT signature validation
  - Token expiry enforcement
  - Cross-tenant access prevention
  - Role-based routing
  - Authorization header validation

- **Error Handling & Validation** - 19/19 tests passed (100%)
  - File size limits (5MB max)
  - File type validation (image/* only)
  - Photo count limits (5 max per package)
  - Missing field detection
  - Edge case handling

- **Database & Filesystem Verification** - 8 tests
  - Schema validation (photos column exists)
  - File upload verification
  - Naming convention compliance
  - Data integrity checks
  - Orphaned file detection

- **Frontend Integration** - Code quality A-
  - TypeScript type safety: Excellent
  - Error handling: Comprehensive
  - UI/UX patterns: Consistent
  - Performance: Optimized
  - Accessibility: Basic (needs improvement)

### Performance

- **Photo Upload Optimizations**
  - Client-side validation prevents unnecessary uploads
  - File size limits prevent large transfers
  - Optimized image storage paths
  - Efficient database JSON operations

- **Component Performance**
  - useCallback for memoized event handlers
  - Optimistic UI updates for better perceived performance
  - Debounced resize events
  - Lazy loading for large photo sets

### Known Limitations

- **Photo Management**
  - No drag-and-drop photo reordering (planned for future)
  - No batch photo upload (one at a time)
  - No image editing/cropping capabilities
  - Photos not yet displayed in public catalog views

- **Accessibility**
  - Missing ARIA live regions for screen readers
  - No aria-busy states during async operations
  - Limited keyboard navigation hints
  - Not yet WCAG 2.1 AA compliant

- **Documentation**
  - No deployment guide for production (to be created)
  - Security best practices scattered across files
  - No consolidated API reference

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
- **Documentation Structure**: Reorganized 70+ documentation files into structured `/docs` directory
  - Created 9 category subdirectories (setup, api, operations, security, architecture, multi-tenant, phases, roadmaps, archive)
  - Added navigation README files in each category for improved discoverability
  - Updated all cross-references in root documentation files
  - Reduced root directory clutter by 85% (from ~80 to 12 core files)
  - Archived historical audit reports and phase completion documents
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

[1.1.0]: https://github.com/username/elope/compare/v0.1.0...v1.1.0
[Unreleased]: https://github.com/username/elope/compare/v1.1.0...HEAD
[0.1.0]: https://github.com/username/elope/releases/tag/v0.1.0
