# GitHub Actions CI/CD Pipeline

## Overview

This directory contains GitHub Actions workflows for the Elope project's continuous integration and deployment pipeline.

## Status Badges

Add these to your README.md to show CI status:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/Elope/actions/workflows/ci.yml/badge.svg)
![E2E Tests](https://github.com/YOUR_USERNAME/Elope/actions/workflows/e2e.yml/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/Elope/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/Elope)
```

## Workflows

### `ci.yml` - Comprehensive CI/CD Pipeline

The main CI/CD pipeline that runs on every push and pull request. It includes:

#### Jobs

1. **Lint & Format Check** (`lint`)
   - Runs ESLint on all TypeScript files
   - Checks code formatting with Prettier
   - Fast fail: 5 minutes timeout
   - Runs in parallel with other jobs

2. **TypeScript Type Check** (`typecheck`)
   - Validates TypeScript types across all packages
   - Ensures type safety without emitting files
   - Fast fail: 5 minutes timeout
   - Runs in parallel with other jobs

3. **Unit Tests** (`unit-tests`)
   - Runs 111 unit tests via Vitest (~5-7s)
   - Tests pure services with fake ports (no HTTP/SDK)
   - Generates coverage reports (lcov, html, json)
   - Uploads coverage artifacts and to Codecov
   - Coverage thresholds: 80% lines, 75% branches, 80% functions
   - Timeout: 10 minutes

4. **Integration Tests** (`integration-tests`)
   - Runs 89 integration tests with real PostgreSQL database
   - Uses PostgreSQL 16 service container
   - Tests database operations, repositories, race conditions
   - Includes Prisma migrations and multi-tenancy isolation
   - Generates coverage reports with separate flags
   - Uploads coverage artifacts and to Codecov
   - Timeout: 15 minutes

   **Database Configuration:**
   - Service: PostgreSQL 16
   - Database: `elope_test`
   - Connection limit: 10 (prevents pool exhaustion)
   - Pool timeout: 20s
   - Health checks ensure DB is ready before tests

5. **E2E Tests** (`e2e-tests`)
   - Runs 9 Playwright end-to-end tests
   - Tests complete user flows (booking, admin dashboard)
   - API server runs in mock mode (no external dependencies)
   - Web server starts automatically via Playwright config
   - Browser: Chromium only (for CI speed)
   - Uploads HTML reports, screenshots, and videos on failure
   - Timeout: 20 minutes

   **Test Scenarios:**
   - Mock booking flow (2 tests)
   - Complete booking journey (2 tests)
   - Admin dashboard flow (5 tests)

6. **Build Check** (`build`)
   - Builds all workspace packages
   - Validates production build
   - Depends on: lint, typecheck
   - Timeout: 10 minutes

7. **CI Success** (`ci-success`)
   - Summary job that requires all other jobs to pass
   - Provides clear success/failure status
   - Useful for branch protection rules

## Features

### Parallel Execution

Jobs run in parallel where possible to minimize total CI time:
- Lint, typecheck, unit tests, integration tests, and E2E tests run simultaneously
- Build job waits for lint and typecheck to pass first

### Dependency Caching

All jobs use npm caching to speed up dependency installation:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

### Concurrency Control

Automatically cancels in-progress runs when new commits are pushed:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Coverage Reporting

Both unit and integration tests generate comprehensive coverage reports:
- **Formats:** lcov, html, json (for different tools)
- **Codecov Upload:** Separate flags for `unit` and `integration` coverage
- **GitHub Artifacts:** Full coverage reports available for download (7-day retention)
- **Non-blocking:** `fail_ci_if_error: false` prevents CI failures if Codecov is down
- **Thresholds:** 80% lines, 75% branches, 80% functions, 80% statements
- Requires `CODECOV_TOKEN` secret to be set in repository settings

### Artifact Uploads

The pipeline automatically uploads artifacts for debugging:

**Always Uploaded:**
- Unit test coverage reports (HTML + lcov)
- Integration test coverage reports (HTML + lcov)

**On Failure:**
- Playwright HTML reports (7-day retention)
- Test results with traces (7-day retention)
- Screenshots from failed E2E tests
- Videos of failed test runs

## First-Time Setup

### Prerequisites

The CI/CD pipeline requires minimal setup as most configuration is in the workflow files. Follow these steps for first-time setup:

1. **Push the workflow files to GitHub:**
   ```bash
   git add .github/workflows/
   git commit -m "chore: add comprehensive CI/CD pipeline"
   git push
   ```

2. **Verify workflow runs:**
   - Go to the Actions tab in your GitHub repository
   - You should see the "CI/CD Pipeline" workflow running
   - All jobs should appear and start executing

3. **Configure secrets (optional but recommended):**
   - Go to Settings → Secrets and variables → Actions
   - Add `CODECOV_TOKEN` for coverage reporting (see below)

4. **Enable branch protection (recommended):**
   - Go to Settings → Branches → Add rule
   - Branch name pattern: `main` (or your default branch)
   - Enable "Require status checks to pass before merging"
   - Select required checks: `lint`, `typecheck`, `unit-tests`, `integration-tests`, `e2e-tests`, `build`

5. **Add status badges to README (optional):**
   - Copy badge markdown from the "Status Badges" section above
   - Replace `YOUR_USERNAME` with your GitHub username
   - Add to your project's README.md

### Required Secrets

Configure these in your GitHub repository settings (Settings → Secrets and variables → Actions):

- `CODECOV_TOKEN` - Optional, for coverage reporting to Codecov.io
  - Sign up at https://codecov.io
  - Add your repository
  - Copy the token and add to GitHub Secrets
  - Without this token, coverage reports still work via artifacts

### Test Environment Variables

The pipeline sets these automatically for tests:

**Unit Tests:**
- `NODE_ENV=test`

**Integration Tests:**
- `NODE_ENV=test`
- `DATABASE_URL_TEST` - PostgreSQL connection string with connection limits
- `JWT_SECRET` - Test-only JWT secret
- `TENANT_SECRETS_ENCRYPTION_KEY` - Test-only encryption key

**E2E Tests:**
- `CI=true` - Enables CI mode in Playwright
- `NODE_ENV=development`
- `ADAPTERS_PRESET=mock` - Uses mock adapters
- `JWT_SECRET` - Test-only JWT secret
- `API_PORT=3001`
- `CORS_ORIGIN=http://localhost:3000`

## Node.js Version

The pipeline uses Node.js 20 (LTS) to match the project's engine requirement:
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=8.0.0"
}
```

## Timeouts & Estimated Run Times

Each job has appropriate timeouts to prevent hanging:

| Job | Timeout | Typical Duration | Notes |
|-----|---------|------------------|-------|
| Lint | 5 min | ~30-45s | Fast fail on style issues |
| Typecheck | 5 min | ~45-60s | Fast fail on type errors |
| Unit Tests | 10 min | ~1-2 min | 111 tests + coverage |
| Integration Tests | 15 min | ~2-3 min | 89 tests + DB setup |
| E2E Tests | 20 min | ~3-5 min | 9 tests + browser automation |
| Build | 10 min | ~1-2 min | All workspace packages |

**Total Parallel CI Time:** ~3-5 minutes (jobs run in parallel)
**Total Sequential Time:** ~7-13 minutes (if run sequentially)

## Local Testing

To run the same checks locally before pushing:

```bash
# Lint and format
npm run lint
npm run format:check

# Type checking
npm run typecheck

# Unit tests
npm run test:unit

# Integration tests (requires PostgreSQL)
npm run test:integration

# E2E tests (requires API server running)
npm run dev:api        # Terminal 1
npm run test:e2e       # Terminal 2

# Build all packages
npm run build --workspaces --if-present
```

## Troubleshooting

### Integration Tests Failing

**Problem:** `PrismaClientInitializationError: Too many database connections`

**Solution:** The workflow sets `connection_limit=10&pool_timeout=20` in `DATABASE_URL_TEST`. This is critical for preventing connection pool exhaustion.

### E2E Tests Timing Out

**Problem:** E2E tests timeout waiting for API server

**Solution:**
- Check the "Wait for API server" step logs
- Ensure mock mode is starting correctly
- The timeout is set to 60 seconds, which should be sufficient

### Coverage Upload Failing

**Problem:** Codecov upload fails

**Solution:**
- Ensure `CODECOV_TOKEN` is set in repository secrets
- The job won't fail if upload fails (`fail_ci_if_error: false`)
- Check if coverage files are being generated

### Workflow Not Triggering

**Problem:** Workflow doesn't run on push

**Solution:**
- Check branch protection rules
- Verify the workflow file is on the default branch
- Check workflow permissions in repository settings

## Viewing Results

### Test Results & Coverage

1. **GitHub Actions UI:**
   - Go to Actions tab in your repository
   - Click on a workflow run to see all jobs
   - Each job shows detailed logs and status

2. **Coverage Reports:**
   - Download coverage artifacts from the workflow run
   - View HTML reports locally: `open server/coverage/index.html`
   - Check Codecov dashboard for trend analysis

3. **E2E Test Reports (on failure):**
   - Download `playwright-report` artifact
   - Extract and open `index.html` in browser
   - View screenshots, videos, and traces

4. **Pull Request Checks:**
   - Status checks appear on PR page
   - Click "Details" to see specific job results
   - Codecov bot comments with coverage changes

## Best Practices

1. **Run tests locally** before pushing to catch issues early
2. **Keep jobs fast** - optimize dependencies and test setup
3. **Use caching** - npm caching saves 30-60 seconds per job
4. **Fail fast** - lint and typecheck have short timeouts
5. **Parallel execution** - independent jobs run simultaneously
6. **Informative names** - each step has a clear description
7. **Monitor coverage** - maintain 80%+ coverage on new code
8. **Review artifacts** - download coverage reports to investigate issues

## Future Enhancements

Potential improvements for the CI/CD pipeline:

- [ ] Add deployment jobs for staging/production
- [ ] Implement matrix testing across multiple Node.js versions
- [ ] Add performance regression testing
- [ ] Integrate security scanning (npm audit, Snyk)
- [ ] Add visual regression testing
- [ ] Implement automatic dependency updates (Dependabot)
- [ ] Add smoke tests for production deployments

## Related Documentation

- [Testing Strategy](../../TESTING.md) - Overview of testing approach
- [Development Guide](../../DEVELOPING.md) - Local development setup
- [Contributing Guidelines](../../CONTRIBUTING.md) - How to contribute
