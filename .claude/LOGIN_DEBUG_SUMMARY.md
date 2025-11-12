# Browser Login Debugging Session - RESOLVED ✅

**Date**: 2025-11-08
**Status**: All issues fixed, login working successfully

## Summary

Browser-based login was failing with 400 Bad Request errors. After comprehensive debugging using Playwright MCP, sequential thinking, and specialized debugging agents, we identified and fixed three critical bugs.

## Issues Found & Fixed

### 1. **Duplicate Content-Type Header** (PRIMARY BUG)

**File**: `client/src/lib/api.ts:100-104`

**Problem**:

- ts-rest v3.x already adds `Content-Type: application/json` to the headers
- Our custom API handler was spreading those headers AND adding `Content-Type` again
- Result: `Content-Type: application/json, application/json` (duplicate)
- This confused `express.json()` middleware, causing it to fail parsing the body
- Backend received `req.body = {}` (empty object)
- Zod validation failed → 400 Bad Request

**Fix**:

```typescript
// BEFORE (BROKEN):
headers: {
  ...authHeaders,
  "Content-Type": "application/json",  // ← Duplicate!
}

// AFTER (FIXED):
headers: requestHeaders,  // ts-rest already set Content-Type
```

**Lines Changed**: `client/src/lib/api.ts:72, 99-100`

---

### 2. **Double JSON Stringification**

**File**: `client/src/lib/api.ts:106`

**Problem**:

- ts-rest v3.x already serializes the body to JSON string
- Our code was calling `JSON.stringify(body)` again
- Result: `"{\"email\":\"admin@elope.com\"}"` (string containing JSON, not actual JSON)
- This would cause validation errors if the first bug was fixed

**Fix**:

```typescript
// BEFORE (BROKEN):
body: body ? JSON.stringify(body) : undefined,

// AFTER (FIXED):
body: body,  // ts-rest already serialized it
```

**Lines Changed**: `client/src/lib/api.ts:100`

---

### 3. **Role Validation Mismatch**

**File**: `client/src/lib/auth.ts:117`

**Problem**:

- Database stores user role as `'ADMIN'` (uppercase enum)
- Frontend was checking for `payload.role === 'admin'` (lowercase)
- Result: Token validation failed with "Unknown token payload type"
- User couldn't complete login despite backend returning 200 OK

**Fix**:

```typescript
// BEFORE (BROKEN):
return 'role' in payload && payload.role === 'admin';

// AFTER (FIXED):
return 'role' in payload && (payload.role === 'admin' || payload.role === 'ADMIN');
```

**Lines Changed**: `client/src/lib/auth.ts:118`

---

### 4. **Database Seed Data**

**File**: `server/fix-admin-user.ts` (new script)

**Problem**:

- Admin user existed in database with email `admin@example.com`
- Login form was trying to use `admin@elope.com`
- Credentials didn't match

**Fix**:

- Created script to update admin user email to `admin@elope.com`
- Password: `admin123`
- Role: `ADMIN`

---

## Debugging Process

### Tools Used

1. **Playwright MCP** - Browser automation to capture actual network requests
2. **Sequential Thinking (UltraThink)** - Analyzed problem systematically
3. **Specialized Debugging Agents** - Frontend and backend analysis in parallel
4. **Server-side logging** - Added middleware to inspect request body
5. **PostgreSQL MCP** - Verified database user data

### Key Discoveries

**Network Request Analysis**:

```json
{
  "url": "http://localhost:3001/v1/admin/login",
  "method": "POST",
  "headers": {
    "content-type": "application/json, application/json" // ← DUPLICATE!
  },
  "body": "{\"email\":\"admin@elope.com\",\"password\":\"admin123\"}"
}
```

**Server Logs**:

```
[MIDDLEWARE] Login request: {
  contentType: 'application/json, application/json',  // ← Duplicate
  bodyType: 'object',
  body: {}  // ← EMPTY! express.json() failed to parse
}
```

**After Fix**:

```
[MIDDLEWARE] Login request: {
  contentType: 'application/json',  // ✅ Single header
  bodyType: 'object',
  body: { email: 'admin@elope.com', password: 'admin123' }  // ✅ Parsed correctly
}

[SERVER] adminLogin called with: {
  body: { email: 'admin@elope.com', password: 'admin123' }  // ✅ Received correctly
}

Request completed: statusCode: 200  // ✅ SUCCESS!
```

---

## Test Results

### ✅ Login Flow Working

```
1. Navigate to http://localhost:5173/login
2. Pre-filled credentials: admin@elope.com / admin123
3. Click "Login" button
4. Backend returns 200 OK with JWT token
5. Frontend validates token successfully
6. Redirects to /admin/dashboard
7. Dashboard renders with user info: "admin@elope.com"
```

### Current Dashboard Status

- ✅ Login successful
- ✅ User authenticated
- ✅ JWT token stored in localStorage
- ✅ Dashboard renders correctly
- ⚠️ Dashboard shows error: `api.platformGetAllTenants is not a function`
  - This is expected - the API endpoint doesn't exist yet
  - The platform admin dashboard needs tenant management endpoints

---

## Files Modified

### Frontend

1. `client/src/lib/api.ts` - Fixed duplicate Content-Type and double stringification
2. `client/src/lib/auth.ts` - Fixed role validation to handle 'ADMIN' enum

### Backend

3. `server/src/app.ts` - Added debug logging middleware (can be removed)
4. `server/src/routes/index.ts` - Added debug logging (can be removed)
5. `server/fix-admin-user.ts` - Script to update admin credentials

### Database

6. Updated User record: `admin@example.com` → `admin@elope.com`

---

## Next Steps

### Immediate (Optional Cleanup)

- [ ] Remove debug logging from `server/src/app.ts` and `server/src/routes/index.ts`
- [ ] Remove debug console.log from `client/src/lib/api.ts`

### Feature Development

- [ ] Implement `platformGetAllTenants` API endpoint
- [ ] Implement tenant management CRUD operations
- [ ] Add tenant onboarding flow

---

## Credentials

**Platform Admin**:

- Email: `admin@elope.com`
- Password: `admin123`
- Role: `ADMIN` (database enum)
- Login URL: http://localhost:5173/login

---

## Technical Details

### Request/Response Flow

```
Client → fetch(POST /v1/admin/login)
  Headers: { Content-Type: application/json }
  Body: { email, password }

Server → express.json() middleware
  Parses JSON body
  Sets req.body = { email, password }

Server → ts-rest validation
  Validates against AdminLoginDtoSchema
  Passes to adminLogin handler

Server → IdentityService.login()
  Queries database for user
  Compares password with bcrypt
  Generates JWT with { userId, email, role: 'ADMIN' }

Server → Response
  Status: 200
  Body: { token: "eyJhbG..." }

Client → AuthContext.login()
  Receives token
  Decodes JWT payload
  Validates role (checks for 'admin' OR 'ADMIN')
  Stores token in localStorage
  Updates auth state
  Redirects to /admin/dashboard
```

### Error Chain Analysis

```
400 Bad Request
  ← Zod validation failed
  ← req.body was empty object {}
  ← express.json() failed to parse
  ← Content-Type header was duplicated: "application/json, application/json"
  ← Client sent duplicate headers
  ← ts-rest set Content-Type, then client set it again
```

---

## Lessons Learned

1. **ts-rest handles serialization** - Don't double-stringify bodies or duplicate headers
2. **Middleware order matters** - Debug logging should be added AFTER body parsing
3. **Case sensitivity** - Database enum values may differ from application constants
4. **Browser automation is essential** - Playwright MCP allowed us to see actual network traffic
5. **Parallel debugging** - Running specialized agents simultaneously was highly efficient

---

## Performance Impact

- No performance impact from the fixes
- Removed unnecessary `JSON.stringify()` call (minor improvement)
- Cleaner header handling (minor improvement)

---

**Status**: ✅ All critical bugs fixed, login working correctly
