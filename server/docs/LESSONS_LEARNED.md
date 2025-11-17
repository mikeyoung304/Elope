# Lessons Learned - Elope Platform

## Critical Authentication Bug - Platform Admin Login (Nov 2025)

### Issue Summary
Platform admin login was failing with "Invalid credentials" error despite correct credentials being used. The authentication succeeded at the API level (returned 200 with valid JWT), but the client couldn't parse or use the token.

### Root Cause Analysis

**Two-Part Bug:**

#### Bug #1: Server-Side Role Mismatch
**File:** `server/src/adapters/prisma/user.repository.ts:16`

```typescript
// ❌ BROKEN - Checking for legacy role
if (!user || user.role !== 'ADMIN') {
  return null;
}

// ✅ FIXED - Checking for current role
if (!user || user.role !== 'PLATFORM_ADMIN') {
  return null;
}
```

**Impact:** Server couldn't find users with `PLATFORM_ADMIN` role, returning null even though user existed in database.

#### Bug #2: Client-Side JWT Parsing Failure
**File:** `client/src/lib/auth.ts:118`

```typescript
// ❌ BROKEN - Missing PLATFORM_ADMIN variant
return 'role' in payload && (payload.role === 'admin' || payload.role === 'ADMIN');

// ✅ FIXED - Includes all variants
return 'role' in payload && (payload.role === 'admin' || payload.role === 'ADMIN' || payload.role === 'PLATFORM_ADMIN');
```

**Impact:** Client couldn't parse JWT tokens from server because type guard failed. Token was never stored in localStorage, so subsequent API requests had no Authorization header.

### Detection Process

1. ✅ Login API returned 200 status (success)
2. ✅ JWT token was generated and returned
3. ✅ Direct bcrypt password verification worked
4. ❌ Client showed "Invalid credentials" error
5. ❌ Browser localStorage had no `adminToken` stored
6. ❌ Subsequent API requests returned 401 "Missing Authorization header"

### Key Lessons

#### 1. **Test Full Authentication Flow End-to-End**
- Don't just test API endpoints in isolation
- Verify client can parse and use tokens
- Check browser localStorage after login
- Monitor network requests for Authorization headers

#### 2. **String Constants Are Dangerous**
- Role strings existed in 3 different places:
  - Database enum: `PLATFORM_ADMIN`
  - Server code: Legacy `ADMIN` → Current `PLATFORM_ADMIN`
  - Client type guards: `admin`, `ADMIN` (missing `PLATFORM_ADMIN`)
- **Solution:** Use TypeScript enums or const objects shared between client/server

#### 3. **Migration Pain Points**
- This bug was introduced during migration from `ADMIN` → `PLATFORM_ADMIN`
- Server repository wasn't updated
- Client type guard wasn't updated
- **Solution:** Global search for all role references when renaming

#### 4. **Debugging JWT Issues**
- Check these in order:
  1. Does API return 200 with token?
  2. Can client decode token? (Check browser console for errors)
  3. Is token stored in localStorage?
  4. Do subsequent requests include Authorization header?
  5. Does server successfully verify token?

#### 5. **Type Guards Must Match Server Reality**
- TypeScript type guards give false confidence
- If server changes enum values, client type guards must update
- **Test:** Manually verify JWT payload structure matches type guard expectations

### Prevention Strategies

#### Immediate Actions
- [ ] Create shared TypeScript types package for roles
- [ ] Add E2E tests for full login flow (including localStorage checks)
- [ ] Add integration tests that verify JWT payload structure

#### Long-Term
- [ ] Use GraphQL Code Generator or similar to ensure client/server type parity
- [ ] Add linting rules to detect hardcoded role strings
- [ ] Implement runtime validation of JWT payload structure

### Related Files
- `server/src/adapters/prisma/user.repository.ts`
- `server/prisma/schema.prisma` (UserRole enum)
- `client/src/lib/auth.ts` (isPlatformAdminPayload)
- `client/src/types/auth.ts`
- `packages/contracts/src/dto.ts`

### Testing Checklist for Auth Changes
- [ ] Backend: User can be found in database
- [ ] Backend: Password verification succeeds
- [ ] Backend: JWT is generated with correct role
- [ ] Backend: API returns 200 with token
- [ ] Frontend: Token can be decoded
- [ ] Frontend: Type guard correctly identifies role
- [ ] Frontend: Token is stored in localStorage
- [ ] Frontend: Subsequent requests include Authorization header
- [ ] Frontend: User can access protected routes
- [ ] E2E: Full login flow works in browser

---

## UI/UX Accessibility - Text Visibility (Nov 2025)

### Issue
White text on white background made hero section content completely invisible after switching from dark theme to light theme.

### Root Cause
When migrating from navy background to white background:
```typescript
// ❌ BROKEN
<h1 className="text-white">Your Perfect Day, Simplified</h1>
// White text on white background = invisible

// ✅ FIXED
<h1 className="text-gray-900">Your Perfect Day, Simplified</h1>
// Dark gray text on white background = 17.8:1 contrast (WCAG AAA)
```

### Key Lessons
1. **Always check contrast ratios** when changing background colors
2. **Use design tokens** instead of hardcoded colors
3. **Test in real browser** - don't rely on code review alone
4. **WCAG AA minimum:** 4.5:1 contrast for normal text
5. **WCAG AAA recommended:** 7:1 contrast for normal text

### Prevention
- [ ] Add automated contrast ratio checking in CI
- [ ] Use CSS custom properties for theme colors
- [ ] Create visual regression tests

---

## General Development Lessons

### Database Seeding Confusion
**Issue:** Seed script runs on every server start, could overwrite manual changes.

**Lessons:**
- Use `upsert` with caution in seed scripts
- Document when seed scripts run (dev only vs. all environments)
- Consider separate scripts for initial setup vs. dev data

### MCP Playwright Usage
**Issue:** MCP Playwright kept loading blank pages instead of actual application.

**Lessons:**
- Kill existing browser instances before starting new ones
- Use standalone Playwright scripts for complex testing
- MCP tools have limitations - know when to use alternatives

---

*Last Updated: November 16, 2025*
