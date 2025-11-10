# Documentation Index

Welcome to the Elope documentation hub. This index helps you navigate all available documentation organized by purpose.

## 🚀 Quick Start

**New to Elope?** Start here:

- **[README.md](../README.md)** - Project overview, features, and quick start guide
- **[DEVELOPING.md](../DEVELOPING.md)** - Development setup and workflow
- **[TESTING.md](../TESTING.md)** - Testing strategy and guidelines

## 🏗️ Architecture & Design

**Understanding the system:**

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System architecture, patterns, and data flow
  - Multi-tenant data isolation
  - Config-driven architecture (2025 transformation)
  - Concurrency control and double-booking prevention
  - Webhook processing and idempotency
- **[DECISIONS.md](../DECISIONS.md)** - Architectural Decision Records (ADRs)
- **[multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md](./multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)** - Multi-tenant patterns and implementation guide

## 🤖 Agent-Powered Platform (2025)

**Config-driven architecture transformation:**

- **Sprint 1 Documentation:**
  - [SPRINT_1_1_CACHE_FIX.md](../SPRINT_1_1_CACHE_FIX.md) - HTTP cache vulnerability investigation
  - [SPRINT_1_2_BRANDING_ENDPOINT.md](../SPRINT_1_2_BRANDING_ENDPOINT.md) - Widget branding API implementation
  - [SPRINT_1_3_STRIPE_REFUND.md](../SPRINT_1_3_STRIPE_REFUND.md) - Stripe refund logic implementation
  - [SPRINT_1_4_CACHE_AUDIT.md](../SPRINT_1_4_CACHE_AUDIT.md) - Cache tenant isolation audit

- **Planning Documentation:**
  - [archive/planning/2025-01-analysis/](./archive/planning/2025-01-analysis/) - Complete platform transformation analysis
  - Config schema design, versioning strategy, agent integration specs

## 📦 Multi-Tenant Features

**Tenant self-service capabilities:**

- **[multi-tenant/MULTI_TENANT_ROADMAP.md](./multi-tenant/MULTI_TENANT_ROADMAP.md)** - Phased tenant self-service implementation plan
- **[multi-tenant/TENANT_ADMIN_USER_GUIDE.md](./multi-tenant/TENANT_ADMIN_USER_GUIDE.md)** - Tenant admin user guide
- **[multi-tenant/MULTI_TENANCY_READINESS_REPORT.md](./multi-tenant/MULTI_TENANCY_READINESS_REPORT.md)** - Multi-tenancy readiness assessment

## 🛠️ Setup & Configuration

**Environment and service setup:**

- **[setup/ENVIRONMENT.md](./setup/ENVIRONMENT.md)** - Environment variables reference
- **[setup/SUPABASE.md](./setup/SUPABASE.md)** - Database setup and integration guide
- **[setup/LOCAL_TESTING_GUIDE.md](./setup/LOCAL_TESTING_GUIDE.md)** - Local development and testing

## 🔒 Security

**Security best practices and procedures:**

- **[security/SECURITY.md](./security/SECURITY.md)** - Security best practices and guardrails
- **[security/SECRETS.md](./security/SECRETS.md)** - Secret management overview
- **[security/SECRET_ROTATION_GUIDE.md](./security/SECRET_ROTATION_GUIDE.md)** - Secret rotation procedures
- **[security/IMMEDIATE_SECURITY_ACTIONS.md](./security/IMMEDIATE_SECURITY_ACTIONS.md)** - Urgent security action items
- **[security/AUDIT_SECURITY_PHASE2B.md](./security/AUDIT_SECURITY_PHASE2B.md)** - Phase 2B security audit

## 🚨 Operations & Production

**Running Elope in production:**

- **[operations/RUNBOOK.md](./operations/RUNBOOK.md)** - Operational procedures and troubleshooting
- **[operations/INCIDENT_RESPONSE.md](./operations/INCIDENT_RESPONSE.md)** - Production incident response playbook
- **[operations/DEPLOYMENT_GUIDE.md](./operations/DEPLOYMENT_GUIDE.md)** - Deployment procedures
- **[operations/PRODUCTION_DEPLOYMENT_GUIDE.md](./operations/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Production deployment checklist

## 📖 API Documentation

**API reference and contracts:**

- **[api/API_DOCS_QUICKSTART.md](./api/API_DOCS_QUICKSTART.md)** - Interactive API documentation
- **[api/README.md](./api/README.md)** - API documentation overview
- **[../packages/contracts/](../packages/contracts/)** - API contracts (Zod schemas + ts-rest endpoints)

## 🗺️ Roadmaps & Planning

**Feature roadmaps and implementation plans:**

- **[roadmaps/ROADMAP.md](./roadmaps/ROADMAP.md)** - Product roadmap
- **[roadmaps/EMBEDDABLE_MULTI_TENANT_IMPLEMENTATION_PLAN.md](./roadmaps/EMBEDDABLE_MULTI_TENANT_IMPLEMENTATION_PLAN.md)** - Embeddable widget multi-tenant plan
- **[roadmaps/WIDGET_INTEGRATION_GUIDE.md](./roadmaps/WIDGET_INTEGRATION_GUIDE.md)** - Widget integration guide
- **[roadmaps/SDK_IMPLEMENTATION_REPORT.md](./roadmaps/SDK_IMPLEMENTATION_REPORT.md)** - SDK implementation report

## 📊 Phase Completion Reports

**Historical implementation phases:**

- **[phases/PHASE_1_COMPLETION_REPORT.md](./phases/PHASE_1_COMPLETION_REPORT.md)** - Phase 1: Multi-tenant foundation
- **[phases/PHASE_2B_COMPLETION_REPORT.md](./phases/PHASE_2B_COMPLETION_REPORT.md)** - Phase 2B: Supabase integration
- **[phases/PHASE_2C_TEST_COVERAGE_REPORT.md](./phases/PHASE_2C_TEST_COVERAGE_REPORT.md)** - Phase 2C: Test coverage improvements
- **[phases/PHASE_2D_COMPLETION_REPORT.md](./phases/PHASE_2D_COMPLETION_REPORT.md)** - Phase 2D: Package photo upload
- **[phases/PHASE_3_STRIPE_CONNECT_COMPLETION_REPORT.md](./phases/PHASE_3_STRIPE_CONNECT_COMPLETION_REPORT.md)** - Phase 3: Stripe Connect integration
- **[phases/PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md](./phases/PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md)** - Phase 4: Tenant admin dashboard
- **[phases/PHASE_5_IMPLEMENTATION_SPEC.md](./phases/PHASE_5_IMPLEMENTATION_SPEC.md)** - Phase 5: Self-service features (in progress)

## 📚 Archive

**Historical documentation and deprecated guides:**

- **[archive/](./archive/)** - Deprecated documentation and migration logs
- **[archive/planning/2025-01-analysis/](./archive/planning/2025-01-analysis/)** - Platform transformation planning (Jan 2025)
- **[archive/overnight-runs/](./archive/overnight-runs/)** - Historical analysis reports
- **[archive/oct-22-analysis/](./archive/oct-22-analysis/)** - October 2024 comprehensive audit

## 🔍 Finding What You Need

**By task:**

| What you want to do | Where to look |
|---------------------|---------------|
| Set up local development | [README.md](../README.md) → Quick Start |
| Deploy to production | [operations/DEPLOYMENT_GUIDE.md](./operations/DEPLOYMENT_GUIDE.md) |
| Understand architecture | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| Fix a production incident | [operations/INCIDENT_RESPONSE.md](./operations/INCIDENT_RESPONSE.md) |
| Add a new feature | [DEVELOPING.md](../DEVELOPING.md) |
| Write tests | [TESTING.md](../TESTING.md) |
| Integrate the widget | [roadmaps/WIDGET_INTEGRATION_GUIDE.md](./roadmaps/WIDGET_INTEGRATION_GUIDE.md) |
| Manage secrets | [security/SECRET_ROTATION_GUIDE.md](./security/SECRET_ROTATION_GUIDE.md) |
| Set up database | [setup/SUPABASE.md](./setup/SUPABASE.md) |
| Understand multi-tenancy | [multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md](./multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md) |

## 📝 Contributing to Documentation

When adding new documentation:

1. **Place it in the appropriate subdirectory:**
   - `api/` - API documentation
   - `architecture/` - Architecture diagrams and design docs
   - `multi-tenant/` - Multi-tenant features and guides
   - `operations/` - Production operations and runbooks
   - `phases/` - Phase completion reports
   - `roadmaps/` - Feature roadmaps and planning
   - `security/` - Security guides and procedures
   - `setup/` - Setup and configuration guides

2. **Update this index** with a link to your new document

3. **Link from README.md** if it's a primary document users need

4. **Archive outdated docs** to `archive/` instead of deleting

## 🎯 Current Focus

**Sprint 1 (January 2025): COMPLETE ✅**
- Cache leak fix
- Widget branding endpoint
- Stripe refund logic
- Cache tenant isolation audit

**Sprint 2 (Current): Foundation**
- Audit logging system
- Type safety improvements (remove `as any`, add Zod)
- Core test suite (70% coverage target)

**Sprint 3 (Upcoming): Config Versioning**
- ConfigVersion database schema
- Versioning API endpoints
- Backward compatibility layer
- Widget config hydration

**Sprint 4 (Future): Agent Interface**
- Agent proposal system
- Agent API endpoints
- Admin proposal review UI
- Display rules configuration

---

**Last Updated:** January 2025
**Maintainer:** See [CONTRIBUTING.md](../CONTRIBUTING.md)
