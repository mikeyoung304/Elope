# Elope API Documentation - Quick Start Guide

## Accessing the Documentation

### Swagger UI (Interactive)
```
http://localhost:3001/api/docs
```
Use this for:
- Exploring all available endpoints
- Testing API calls directly from the browser
- Understanding request/response formats
- Testing authentication flows

### OpenAPI JSON (For Tools)
```
http://localhost:3001/api/docs/openapi.json
```
Use this for:
- Importing into Postman or Insomnia
- Generating client SDKs
- API contract validation
- Integration with other tools

## Quick Testing Guide

### 1. Start the Server
```bash
cd server
npm run dev:mock  # For testing with mock data
# or
npm run dev:real  # For testing with real services
```

### 2. Open Swagger UI
Navigate to: http://localhost:3001/api/docs

### 3. Test Public Endpoints (No Auth Required)

**Get All Packages:**
1. Find `GET /v1/packages`
2. Click "Try it out"
3. Click "Execute"
4. See the response below

**Check Date Availability:**
1. Find `GET /v1/availability`
2. Click "Try it out"
3. Enter a date (format: YYYY-MM-DD, e.g., 2024-06-15)
4. Click "Execute"

### 4. Test Admin Endpoints (Auth Required)

**Step 1: Get Authentication Token**
1. Find `POST /v1/admin/login`
2. Click "Try it out"
3. Use these credentials:
   ```json
   {
     "email": "admin@elope.example.com",
     "password": "admin123"
   }
   ```
4. Click "Execute"
5. Copy the `token` from the response

**Step 2: Add Token to Swagger UI**
1. Click the "Authorize" button (top right with lock icon)
2. In the "Value" field, enter: `Bearer <your-token-here>`
3. Click "Authorize"
4. Click "Close"

**Step 3: Test Admin Endpoints**
Now all admin endpoints will automatically include your token. Try:
- `GET /v1/admin/bookings` - View all bookings
- `GET /v1/admin/blackouts` - View blackout dates
- `POST /v1/admin/packages` - Create a new package

## API Overview

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/packages | List all wedding packages |
| GET | /v1/packages/:slug | Get specific package details |
| GET | /v1/availability | Check if a date is available |
| POST | /v1/bookings/checkout | Create Stripe checkout session |
| GET | /v1/bookings/:id | Get booking details |
| POST | /v1/webhooks/stripe | Handle Stripe webhooks |

### Admin Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/admin/login | Get JWT token |
| GET | /v1/admin/bookings | List all bookings |
| GET | /v1/admin/blackouts | List blackout dates |
| POST | /v1/admin/blackouts | Create blackout date |
| POST | /v1/admin/packages | Create new package |
| PUT | /v1/admin/packages/:id | Update package |
| DELETE | /v1/admin/packages/:id | Delete package |
| POST | /v1/admin/packages/:packageId/addons | Add add-on to package |
| PUT | /v1/admin/addons/:id | Update add-on |
| DELETE | /v1/admin/addons/:id | Delete add-on |

## Common Error Responses

All errors follow this format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable description"
}
```

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request format or data |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., date already booked) |
| 422 | UNPROCESSABLE_ENTITY | Request cannot be processed |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limits

- **Public endpoints:** 100 requests per 15 minutes per IP
- **Admin endpoints:** 20 requests per 15 minutes per IP

## Example Workflows

### Booking Flow (Customer Perspective)

1. **Browse packages:** `GET /v1/packages`
2. **Get package details:** `GET /v1/packages/intimate-ceremony`
3. **Check date availability:** `GET /v1/availability?date=2024-06-15`
4. **Create checkout:** `POST /v1/bookings/checkout`
   ```json
   {
     "packageId": "pkg_123",
     "eventDate": "2024-06-15",
     "coupleName": "John & Jane Doe",
     "email": "john@example.com",
     "addOnIds": ["addon_456"]
   }
   ```
5. **Redirect to Stripe:** Use `checkoutUrl` from response
6. **After payment:** Stripe webhook handles booking confirmation
7. **View confirmation:** `GET /v1/bookings/:id`

### Admin Flow (Managing Packages)

1. **Login:** `POST /v1/admin/login`
2. **View bookings:** `GET /v1/admin/bookings`
3. **Create package:** `POST /v1/admin/packages`
   ```json
   {
     "slug": "deluxe-ceremony",
     "title": "Deluxe Ceremony",
     "description": "A premium wedding experience",
     "priceCents": 250000,
     "photoUrl": "https://example.com/photo.jpg"
   }
   ```
4. **Add add-ons:** `POST /v1/admin/packages/:packageId/addons`
5. **Set blackout dates:** `POST /v1/admin/blackouts`
   ```json
   {
     "date": "2024-12-25",
     "reason": "Holiday closure"
   }
   ```

## Using with Other Tools

### Postman
1. Open Postman
2. Click "Import" > "Link"
3. Enter: `http://localhost:3001/api/docs/openapi.json`
4. Click "Import"
5. All endpoints will be imported as a collection

### Insomnia
1. Open Insomnia
2. Click "Create" > "Import From" > "URL"
3. Enter: `http://localhost:3001/api/docs/openapi.json`
4. Click "Fetch and Import"

### VS Code REST Client
Create a `.http` file:
```http
### Get all packages
GET http://localhost:3001/v1/packages

### Admin login
POST http://localhost:3001/v1/admin/login
Content-Type: application/json

{
  "email": "admin@elope.example.com",
  "password": "admin123"
}

### Get bookings (with auth)
GET http://localhost:3001/v1/admin/bookings
Authorization: Bearer YOUR_TOKEN_HERE
```

## Tips & Tricks

1. **Persistent Auth:** Swagger UI remembers your token between refreshes
2. **Filter Endpoints:** Use the search box to find specific endpoints
3. **Copy as cURL:** Each request in Swagger UI shows the equivalent cURL command
4. **Response Examples:** Click on response schemas to see example data
5. **Try Different Status Codes:** Each response status code is documented

## Need Help?

- **View full specification:** /api/docs/openapi.json
- **Interactive UI:** /api/docs
- **GitHub Issues:** Report bugs or request features
- **Email Support:** support@elope.example.com

## Development Notes

The API documentation is:
- **Auto-updating:** Restart the server to see documentation changes
- **Type-safe:** All schemas match TypeScript types
- **Comprehensive:** Includes all endpoints, errors, and examples
- **Standards-compliant:** Follows OpenAPI 3.0 specification

---

For more details, see `API_DOCUMENTATION_COMPLETION_REPORT.md`
