# Secrets Rotation Procedure

**Last Rotation Date**: 2025-10-29
**Reason**: Security audit identified potential exposure risk and established rotation baseline
**Rotated By**: Autonomous Agent 2 (Secret Rotation & Git History Sanitization)

---

## Secrets Inventory

### 1. JWT_SECRET (Application Authentication)
- **Location**: `server/.env`
- **Current Status**: ROTATED on 2025-10-29
- **Old Value**: `68fa0f2690e33a51659ce4a431826afaf3aa9848765bb4092d518dca0f4a7005` (DEPRECATED)
- **New Value**: `3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24`
- **Algorithm**: SHA-256 (64 hex characters = 256 bits)
- **Next Rotation**: 2026-01-29 (90 days)

### 2. Stripe Keys (Payment Processing)
- **Location**: `server/.env`
- **Current Status**: REQUIRES USER ACTION
- **Test Secret Key**: `sk_test_51SLPlvBPdt7IPpHp4VgimjlRIpzYvwa7Mvu2Gmbow0lrsxQsNpQzm1Vfv52vdF9qqEpFtw7ntaVmQyGU199zbRlf00RrztV7fZ` (ACTIVE - needs rotation)
- **Test Publishable Key**: Available in Stripe Dashboard
- **Webhook Secret**: `whsec_0ad225e1a56469eb6959f399ac7c9536e17cd1fb07ba5513001f46853b8078b2` (ACTIVE - needs rotation)
- **Next Rotation**: IMMEDIATE (user action required)

### 3. Supabase Credentials (Database)
- **Location**: `server/.env`
- **Current Status**: ACTIVE
- **Database Password**: `@Orangegoat11` (exposed in .env file)
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...V0AsaBIyUJoOFNArMNHaCnVOoQ1g-yyUdisWKK1v-nw`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...mIre5xP4UPn1BB-LRumfgMXwh0z1vvZc5WPXzJX0K-s`
- **Recommendation**: Consider rotating database password and updating connection strings
- **Next Rotation**: User discretion (not critical if .env remains protected)

---

## Git History Analysis

### Investigation Results
**Status**: NO SECRETS EXPOSED IN GIT HISTORY ✅

**Files Checked**:
- `server/.env` - Never committed to git
- `apps/api/.env` - Never committed to git
- `.env.example` files - Only contain placeholder values

**Commits Audited**:
- `8429114` - Real-mode transition commit - No secrets exposed
- `95debb2` - Stripe integration commit - Only placeholders in .env.example
- `b7f37b5` - Secrets matrix documentation - No actual secrets
- `78cad8c` - JWT middleware implementation - No secrets exposed
- `3264a2a` - Phase 1 structural changes - Keys truncated with "..." in work-log.md

**Search Patterns Used**:
```bash
# Full secret values
sk_test_51SLPlvBPdt7IPpHp4VgimjlRIpzYvwa7Mvu2Gmbow0lrsxQsNpQzm1Vfv52vdF9qqEpFtw7ntaVmQyGU199zbRlf00RrztV7fZ
whsec_0ad225e1a56469eb6959f399ac7c9536e17cd1fb07ba5513001f46853b8078b2
68fa0f2690e33a51659ce4a431826afaf3aa9848765bb4092d518dca0f4a7005

# Partial patterns
sk_test_51SLPlv
whsec_0ad225e1
@Orangegoat11
gpyvdknhmevcfdbgtqir.supabase.co
```

**Result**: ✅ No matches found in git history

### .gitignore Protection
**Status**: PROPERLY CONFIGURED ✅

```gitignore
# Line 2-3 of .gitignore
.env*
!.env.example
```

This configuration:
- ✅ Ignores all `.env` files (`.env`, `.env.local`, `.env.production`, etc.)
- ✅ Explicitly includes `.env.example` files for documentation
- ✅ Prevents accidental commit of secrets

---

## Rotation Procedures

### JWT_SECRET Rotation (Completed)

**Steps Taken**:
1. Generated new 256-bit random secret: `openssl rand -hex 32`
2. New value: `3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24`
3. Updated `server/.env` with new value
4. Documented old value as DEPRECATED
5. Set next rotation date: 90 days from now

**Impact**:
- All existing JWT tokens will be invalidated
- Users will need to re-authenticate
- No database changes required

**Testing Required**:
```bash
cd server
npm run test  # Verify authentication still works
```

### Stripe Keys Rotation (USER ACTION REQUIRED)

**Instructions for User**:

1. **Login to Stripe Dashboard**:
   - Navigate to: https://dashboard.stripe.com/test/apikeys
   - Or for production: https://dashboard.stripe.com/apikeys

2. **Create New Restricted API Key**:
   - Click "Create restricted key"
   - Name: "Elope Booking System - Production"
   - Permissions required:
     - ✅ Checkout Sessions: Read & Write
     - ✅ Webhook Endpoints: Read & Write
     - ✅ Events: Read
   - Copy the new secret key (starts with `sk_test_` or `sk_live_`)

3. **Update Webhook Configuration**:
   - Navigate to: https://dashboard.stripe.com/test/webhooks
   - Delete old webhook endpoint (if exists)
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/v1/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the new webhook signing secret (starts with `whsec_`)

4. **Update server/.env**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET_HERE
   ```

5. **Update client environment** (if using publishable key):
   - Copy new publishable key from Stripe Dashboard
   - Update client configuration

6. **Test Integration**:
   ```bash
   # Terminal 1: Start server
   cd server && npm run dev

   # Terminal 2: Test webhook forwarding (development only)
   stripe listen --forward-to localhost:3001/v1/webhooks/stripe

   # Terminal 3: Create test checkout
   curl -X POST http://localhost:3001/v1/bookings \
     -H "Content-Type: application/json" \
     -d '{"packageId": "pkg_123", "date": "2025-12-01", ...}'
   ```

7. **Revoke Old Keys**:
   - Return to Stripe Dashboard
   - Delete/revoke old API keys
   - Delete old webhook endpoints
   - Confirm no production systems are using old keys

**Estimated Time**: 15-20 minutes

### Supabase Database Password Rotation (OPTIONAL)

**Recommendation**: Consider rotating if:
- Database password has been exposed outside secure environments
- Compliance requirements mandate regular rotation
- Security audit identifies risk

**Steps** (if needed):
1. Login to Supabase Dashboard: https://app.supabase.com
2. Navigate to Project Settings > Database
3. Click "Reset database password"
4. Generate strong password (use password manager)
5. Update `DATABASE_URL` and `DIRECT_URL` in `server/.env`
6. Test database connectivity: `npm run db:test` or `npx prisma db pull`

---

## Verification Checklist

### Post-Rotation Testing

- [ ] **JWT Authentication**:
  ```bash
  cd server
  npm test -- auth.middleware.test.ts
  ```

- [ ] **Stripe Integration**:
  ```bash
  # Test checkout session creation
  curl -X POST http://localhost:3001/v1/bookings \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"packageId": "1", "date": "2025-12-01", ...}'
  ```

- [ ] **Database Connectivity**:
  ```bash
  cd server
  npx prisma db pull  # Should connect successfully
  npm run db:seed     # Should populate test data
  ```

- [ ] **Git History Clean**:
  ```bash
  # Search for any exposed secrets
  git log --all -p | grep -E "sk_test_51SLPlv|whsec_0ad225e1|68fa0f2690e33a51659ce4a431826afaf3aa9848765bb4092d518dca0f4a7005"
  # Should return: no results
  ```

- [ ] **.gitignore Protection**:
  ```bash
  git status --porcelain | grep ".env"
  # Should return: no results (or only untracked status)
  ```

---

## Rotation Schedule

| Secret | Current Rotation | Next Rotation | Frequency | Responsibility |
|--------|-----------------|---------------|-----------|----------------|
| JWT_SECRET | 2025-10-29 | 2026-01-29 | 90 days | Automated/DevOps |
| Stripe Test Keys | Pending | ASAP | As needed | Developer |
| Stripe Prod Keys | N/A | Before prod | Never in dev | DevOps/Security |
| Database Password | N/A | Optional | 180 days | DevOps |
| Supabase Anon Key | N/A | N/A | Regenerate if leaked | DevOps |
| Supabase Service Key | N/A | N/A | Regenerate if leaked | DevOps |

---

## Security Best Practices

### ✅ Current Protections
1. `.env` files properly ignored in `.gitignore`
2. `.env.example` contains only placeholder values
3. No secrets found in git history
4. JWT_SECRET rotated with strong 256-bit entropy
5. Documentation includes rotation procedures

### ⚠️ Recommendations
1. **Implement Secret Management System**:
   - Consider using AWS Secrets Manager, HashiCorp Vault, or 1Password CLI
   - Remove secrets from `.env` files entirely
   - Load secrets from secure vault at runtime

2. **Add Secret Scanning**:
   - Install pre-commit hooks: `npm install --save-dev @commitlint/cli`
   - Add GitHub Secret Scanning (if using GitHub)
   - Consider tools like: `gitleaks`, `trufflehog`, `git-secrets`

3. **Automate Rotation**:
   - Set calendar reminders for 90-day JWT rotation
   - Implement automated rotation for JWT_SECRET (with grace period for token expiry)
   - Monitor Stripe key age and usage

4. **Environment Separation**:
   - Use different keys for development/staging/production
   - Never use production keys in development
   - Implement key tagging/naming: `JWT_SECRET_DEV`, `JWT_SECRET_PROD`

5. **Audit Logging**:
   - Log all secret access and usage
   - Monitor for unauthorized secret access
   - Alert on repeated authentication failures

---

## Emergency Response

### If Secrets Are Exposed

1. **Immediate Actions** (within 1 hour):
   - Rotate compromised secrets immediately
   - Revoke exposed API keys
   - Monitor for unauthorized access
   - Notify security team/stakeholders

2. **Investigation** (within 24 hours):
   - Determine scope of exposure
   - Review access logs
   - Identify affected systems/users
   - Document incident

3. **Remediation**:
   - Update all systems with new secrets
   - Implement additional security controls
   - Review and update security procedures
   - Conduct post-incident review

4. **Git History Cleanup** (if secrets were committed):
   ```bash
   # Create backup branch
   git branch backup-before-secret-removal

   # Use BFG Repo-Cleaner (recommended)
   brew install bfg  # or download from: https://rtyley.github.io/bfg-repo-cleaner/
   bfg --replace-text passwords.txt  # File containing secrets to remove
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Alternative: git filter-branch (slower)
   git filter-branch --tree-filter 'rm -f server/.env' --prune-empty HEAD
   git filter-branch --index-filter 'git rm --cached --ignore-unmatch server/.env' HEAD

   # Force push (coordinate with team!)
   git push origin --force --all
   git push origin --force --tags
   ```

---

## Contact & Support

**For Security Issues**:
- Email: mikeyoung304@gmail.com
- Escalation: Create incident ticket

**For Rotation Questions**:
- Review this document first
- Check `SECRETS.md` for environment variable documentation
- Consult with DevOps team

---

**Document Version**: 1.0
**Last Updated**: 2025-10-29
**Next Review**: 2026-01-29
