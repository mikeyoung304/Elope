# Package Photo Upload - Authentication Quick Reference

## 🔐 Authentication Flow

### 1. Login and Get Token

```bash
curl -X POST http://localhost:3001/v1/tenant-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-tenant@example.com",
    "password": "Test123456"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Use Token for Authenticated Requests

```bash
# Store token in variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get packages
curl -X GET http://localhost:3001/v1/tenant/admin/packages \
  -H "Authorization: Bearer ${TOKEN}"

# Upload photo
curl -X POST http://localhost:3001/v1/tenant/admin/packages/pkg_123/photos \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "photo=@/path/to/image.jpg"

# Delete photo
curl -X DELETE http://localhost:3001/v1/tenant/admin/packages/pkg_123/photos/filename.jpg \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 📋 Required Headers

```
Authorization: Bearer <JWT_TOKEN>
```

**Format:** `Bearer` prefix is REQUIRED, followed by space and token

---

## ❌ Common Authentication Errors

| Error | Cause | HTTP Code | Solution |
|-------|-------|-----------|----------|
| Missing Authorization header | No `Authorization` header | 401 | Add `Authorization: Bearer <token>` |
| Invalid Authorization format | Missing `Bearer` prefix | 401 | Use format: `Bearer <token>` |
| Invalid or expired token | Token signature invalid or expired | 401 | Login again to get new token |
| Forbidden: Package belongs to different tenant | Trying to access another tenant's package | 403 | Use package ID from your tenant |
| Package not found | Package ID doesn't exist | 404 | Check package ID is correct |
| No photo uploaded | Missing `photo` field in multipart | 400 | Include `-F "photo=@file.jpg"` |
| Unexpected field | Wrong multipart field name | 400 | Use field name `photo` |
| File too large (max 5MB) | File exceeds 5MB limit | 413 | Use smaller file |

---

## 🎯 Frontend Implementation

### Store Token After Login

```typescript
// After successful login
const result = await api.tenantLogin({
  body: { email, password }
});

// Store token in localStorage
api.setTenantToken(result.body.token);
// This calls: localStorage.setItem('tenantToken', token)
```

### Retrieve Token for Requests

```typescript
// Get token from localStorage
const token = localStorage.getItem('tenantToken');

// Or use the helper function
function getAuthToken(): string | null {
  return localStorage.getItem('tenantToken');
}
```

### Logout

```typescript
// Clear token
api.logoutTenant();
// This calls: localStorage.removeItem('tenantToken')
```

---

## 🔑 Token Details

**Format:** JWT (JSON Web Token)
**Algorithm:** HS256
**Expiry:** 7 days
**Storage:** `localStorage.tenantToken`

**Payload Structure:**
```json
{
  "tenantId": "cmhp91lct0000p0i3hi347g0v",
  "slug": "test-tenant",
  "email": "test-tenant@example.com",
  "type": "tenant",
  "iat": 1762547438,
  "exp": 1763152238
}
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- Always use HTTPS in production
- Store token in `localStorage.tenantToken`
- Include `Authorization: Bearer <token>` header
- Handle 401 errors by redirecting to login
- Clear token on logout
- Validate token expiry client-side

### ❌ DON'T:
- Don't store token in URL parameters
- Don't log tokens to console in production
- Don't share tokens between tenants
- Don't assume token is always valid (check expiry)
- Don't forget the `Bearer` prefix

---

## 🧪 Test Scenarios Covered

### Authentication
- ✅ Valid token authentication
- ✅ Missing Authorization header
- ✅ Malformed Authorization header
- ✅ Invalid token format
- ✅ Invalid JWT signature
- ✅ Expired token
- ✅ Empty token

### Authorization
- ✅ Access own packages
- ✅ Cross-tenant access blocked (403)
- ✅ Non-existent package (404)
- ✅ Non-existent photo (404)
- ✅ Multiple photo uploads with ordering

### Input Validation
- ✅ Missing photo field
- ✅ Wrong field name
- ✅ File size > 5MB

---

## 📊 API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/v1/tenant-auth/login` | No | Get JWT token |
| GET | `/v1/tenant/admin/packages` | Yes | List packages |
| POST | `/v1/tenant/admin/packages` | Yes | Create package |
| POST | `/v1/tenant/admin/packages/:id/photos` | Yes | Upload photo |
| DELETE | `/v1/tenant/admin/packages/:id/photos/:filename` | Yes | Delete photo |

---

## 🚨 Troubleshooting

### "Missing Authorization header"
```bash
# ❌ Wrong
curl http://localhost:3001/v1/tenant/admin/packages

# ✅ Correct
curl http://localhost:3001/v1/tenant/admin/packages \
  -H "Authorization: Bearer ${TOKEN}"
```

### "Invalid Authorization header format"
```bash
# ❌ Wrong
curl -H "Authorization: ${TOKEN}" ...

# ✅ Correct
curl -H "Authorization: Bearer ${TOKEN}" ...
```

### "Forbidden: Package belongs to different tenant"
```bash
# You're trying to access a package that doesn't belong to your tenant
# Solution: Only use package IDs from your tenant's package list

# Get your packages first
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3001/v1/tenant/admin/packages

# Then use IDs from the response
```

### "File too large (max 5MB)"
```bash
# Check file size
ls -lh /path/to/image.jpg

# Reduce file size if needed (using ImageMagick)
convert input.jpg -quality 85 -resize 1920x1080 output.jpg
```

---

## 📝 Quick Test Commands

```bash
# Set your token
export TOKEN="your-jwt-token-here"

# 1. Test authentication
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3001/v1/tenant/admin/packages

# 2. Create a package
curl -X POST http://localhost:3001/v1/tenant/admin/packages \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-pkg","title":"Test","description":"Test","priceCents":10000}'

# 3. Upload photo
curl -X POST http://localhost:3001/v1/tenant/admin/packages/pkg_123/photos \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "photo=@test.jpg"

# 4. List packages (verify photo appears)
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3001/v1/tenant/admin/packages | jq

# 5. Delete photo
curl -X DELETE http://localhost:3001/v1/tenant/admin/packages/pkg_123/photos/filename.jpg \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 📚 Related Documentation

- Full Test Report: [AUTH_TEST_REPORT.json](./AUTH_TEST_REPORT.json)
- Test Summary: [AUTH_TEST_SUMMARY.md](./AUTH_TEST_SUMMARY.md)
- Package Photo API: [PACKAGE_PHOTO_API_IMPLEMENTATION_SUMMARY.md](./PACKAGE_PHOTO_API_IMPLEMENTATION_SUMMARY.md)
- Quick Start: [QUICK_START_PHOTO_UPLOADER.md](./QUICK_START_PHOTO_UPLOADER.md)
