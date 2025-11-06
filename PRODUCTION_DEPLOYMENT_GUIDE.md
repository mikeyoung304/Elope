# Production Deployment Guide - Vercel + Render

**Target:** Deploy Elope application for investor demo
**Frontend:** Vercel (client)
**Backend:** Render (API server)
**Database:** Supabase (already configured)

---

## Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier works)
- [ ] Render account (free tier works)
- [ ] Supabase database running (✅ already configured)
- [ ] Stripe account (test mode is fine)
- [ ] Code committed to git repository

---

## Part 1: Prepare for Deployment

### Step 1.1: Commit All Changes

```bash
cd /Users/mikeyoung/CODING/Elope

# Check git status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Production deployment: Phase 2B complete with 129 tests passing"

# Push to GitHub
git push origin main  # or your branch name
```

### Step 1.2: Create Production Environment Files

We need to prepare environment configurations for production.

**For Render (API Server):**
Create a file to reference during Render setup:
```bash
cat > RENDER_ENV_TEMPLATE.txt << 'EOF'
# Render Environment Variables (copy these during setup)

# Mode
ADAPTERS_PRESET=real

# Server
API_PORT=3001
NODE_ENV=production

# Database (Supabase)
DATABASE_URL=postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres

# JWT (ROTATE THIS FOR PRODUCTION!)
JWT_SECRET=3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24

# Stripe (use your real keys)
STRIPE_SECRET_KEY=sk_test_51SLPlvBPdt7IPpHp4VgimjlRIpzYvwa7Mvu2Gmbow0lrsxQsNpQzm1Vfv52vdF9qqEpFtw7ntaVmQyGU199zbRlf00RrztV7fZ
STRIPE_WEBHOOK_SECRET=whsec_0ad225e1a56469eb6959f399ac7c9536e17cd1fb07ba5513001f46853b8078b2
STRIPE_SUCCESS_URL=https://your-vercel-app.vercel.app/success
STRIPE_CANCEL_URL=https://your-vercel-app.vercel.app

# CORS (update with Vercel URL)
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Supabase
SUPABASE_URL=https://gpyvdknhmevcfdbgtqir.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXZka25obWV2Y2ZkYmd0cWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDUyMTUsImV4cCI6MjA3NjEyMTIxNX0.V0AsaBIyUJoOFNArMNHaCnVOoQ1g-yyUdisWKK1v-nw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXZka25obWV2Y2ZkYmd0cWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU0NTIxNSwiZXhwIjoyMDc2MTIxMjE1fQ.mIre5xP4UPn1BB-LRumfgMXwh0z1vvZc5WPXzJX0K-s
EOF
```

---

## Part 2: Deploy API Server to Render

### Step 2.1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (easier integration)
3. Authorize Render to access your repositories

### Step 2.2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the **Elope** repository

### Step 2.3: Configure Web Service

**Basic Settings:**
- **Name:** `elope-api` (or your preferred name)
- **Region:** Oregon (US West) or closest to you
- **Branch:** `main` (or your deployment branch)
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `pnpm install && pnpm run build`
- **Start Command:** `pnpm start`

**⚠️ IMPORTANT:** If you don't have a build script, we need to add one.

### Step 2.4: Add Build Script (if needed)

Check if `server/package.json` has a `start` script:

```bash
# Check current scripts
cat server/package.json | grep -A 5 '"scripts"'
```

If missing, add these scripts to `server/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### Step 2.5: Configure Environment Variables

In Render dashboard:

1. Scroll to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add each variable from `RENDER_ENV_TEMPLATE.txt`:

**Copy these one by one:**

| Key | Value |
|-----|-------|
| `ADAPTERS_PRESET` | `real` |
| `API_PORT` | `3001` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres` |
| `DIRECT_URL` | `postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres` |
| `JWT_SECRET` | (copy from template) |
| `STRIPE_SECRET_KEY` | (your Stripe key) |
| `STRIPE_WEBHOOK_SECRET` | (your webhook secret) |
| `CORS_ORIGIN` | `https://your-vercel-app.vercel.app` (update after Vercel deploy) |

### Step 2.6: Deploy

1. Click **"Create Web Service"**
2. Render will start building
3. Wait 5-10 minutes for first deployment
4. You'll get a URL like: `https://elope-api.onrender.com`

### Step 2.7: Test API Deployment

```bash
# Replace with your Render URL
RENDER_URL="https://elope-api.onrender.com"

# Test packages endpoint
curl $RENDER_URL/v1/packages

# Should return JSON with packages
```

---

## Part 3: Deploy Client to Vercel

### Step 3.1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access repositories

### Step 3.2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your **Elope** repository
3. Vercel will auto-detect it's a monorepo

### Step 3.3: Configure Project

**Framework Preset:** Vite
**Root Directory:** `client`
**Build Command:** `pnpm run build`
**Output Directory:** `dist`
**Install Command:** `pnpm install`

### Step 3.4: Configure Environment Variables

In Vercel project settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_URL` | `https://elope-api.onrender.com` | Production, Preview, Development |

**Note:** Vite requires `VITE_` prefix for environment variables.

### Step 3.5: Update Client API Configuration

Check `client/src/config.ts` or wherever API URL is configured:

```typescript
// client/src/config.ts (or similar)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

If this file doesn't exist, create it and update imports throughout the client.

### Step 3.6: Deploy

1. Click **"Deploy"**
2. Vercel builds and deploys (usually 2-3 minutes)
3. You'll get a URL like: `https://elope-abc123.vercel.app`

---

## Part 4: Connect Frontend and Backend

### Step 4.1: Update CORS in Render

1. Go to Render dashboard
2. Open your `elope-api` service
3. Go to **Environment** tab
4. Update `CORS_ORIGIN` with your Vercel URL:
   ```
   CORS_ORIGIN=https://elope-abc123.vercel.app
   ```
5. Save and redeploy

### Step 4.2: Update Stripe Webhook URL

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint (or create new)
3. Update endpoint URL to:
   ```
   https://elope-api.onrender.com/v1/webhooks/stripe
   ```
4. Save changes
5. Copy the new webhook secret
6. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables

### Step 4.3: Update Stripe Success/Cancel URLs

In Render environment variables:
```
STRIPE_SUCCESS_URL=https://elope-abc123.vercel.app/success
STRIPE_CANCEL_URL=https://elope-abc123.vercel.app
```

---

## Part 5: Database Migration (if not already done)

### Step 5.1: Run Migration on Supabase

```bash
# Connect to Supabase
psql "postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres"

# Or run migration file directly
psql "postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres" < server/prisma/migrations/01_add_webhook_events.sql
```

### Step 5.2: Seed Production Data (optional)

```bash
# From server directory
cd server
DATABASE_URL="postgresql://postgres:%40Orangegoat11@db.gpyvdknhmevcfdbgtqir.supabase.co:5432/postgres" pnpm exec prisma db seed
```

---

## Part 6: Testing Production Deployment

### Test Checklist

**Frontend Tests:**
- [ ] Visit your Vercel URL
- [ ] Homepage loads with all packages
- [ ] Images display correctly
- [ ] Calendar works
- [ ] Can select date and proceed to checkout

**Backend Tests:**
```bash
VERCEL_URL="https://elope-abc123.vercel.app"
RENDER_URL="https://elope-api.onrender.com"

# Test API directly
curl $RENDER_URL/v1/packages

# Test CORS (from browser console on Vercel site)
fetch('https://elope-api.onrender.com/v1/packages')
  .then(r => r.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS error:', err))
```

**Integration Tests:**
- [ ] Admin login works
- [ ] Can create test booking
- [ ] Stripe checkout redirects properly
- [ ] Webhook fires after payment
- [ ] Booking appears in database

---

## Part 7: Custom Domains (Optional but Professional)

### For Vercel (Frontend)

1. Purchase domain (e.g., `elope.wedding` from Namecheap, GoDaddy)
2. In Vercel project → Settings → Domains
3. Add your custom domain
4. Configure DNS records as shown by Vercel
5. Wait for DNS propagation (5-30 minutes)

### For Render (Backend)

1. In Render service → Settings → Custom Domains
2. Add your API subdomain (e.g., `api.elope.wedding`)
3. Configure DNS CNAME record
4. Wait for SSL certificate generation

### Update Environment Variables

After custom domains:
- Update `CORS_ORIGIN` in Render
- Update `VITE_API_URL` in Vercel
- Update Stripe webhook URL
- Redeploy both services

---

## Part 8: Monitoring & Debugging

### Render Logs

1. Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Watch for:
   - Build errors
   - Runtime errors
   - Webhook processing
   - Database connection issues

### Vercel Logs

1. Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click deployment → **"Function Logs"**
4. Or use Vercel CLI: `vercel logs`

### Common Issues

**Issue: CORS Error**
```
Solution: Update CORS_ORIGIN in Render to match Vercel URL exactly
```

**Issue: Database Connection Failed**
```
Solution: Check DATABASE_URL is correctly encoded (%40 for @)
Verify Supabase is allowing connections from Render IPs
```

**Issue: Stripe Webhooks Not Working**
```
Solution: Verify webhook URL in Stripe dashboard
Check STRIPE_WEBHOOK_SECRET matches
View Render logs for webhook errors
```

**Issue: Build Failed on Render**
```
Solution: Check package.json has correct scripts
Verify all dependencies in package.json
Check Render build logs for specific errors
```

---

## Part 9: Investor Demo Preparation

### Create Demo Data

```bash
# Add some realistic demo bookings
psql "$DATABASE_URL" -c "
INSERT INTO \"Booking\" (id, \"customerId\", \"packageId\", date, \"totalPrice\", status, \"createdAt\")
VALUES
  ('demo-1', (SELECT id FROM \"Customer\" LIMIT 1), (SELECT id FROM \"Package\" WHERE slug = 'basic-elopement' LIMIT 1), '2025-06-15', 149900, 'CONFIRMED', NOW()),
  ('demo-2', (SELECT id FROM \"Customer\" LIMIT 1), (SELECT id FROM \"Package\" WHERE slug = 'luxury-escape' LIMIT 1), '2025-07-20', 899900, 'CONFIRMED', NOW());
"
```

### Demo Script

**For Investors:**

1. **Homepage** (`https://your-app.vercel.app`)
   - "Here's our elopement booking platform"
   - "6 curated packages from $799 to $8,999"
   - "Beautiful photography and user-friendly design"

2. **Package Selection**
   - Click any package
   - "Each package has detailed descriptions and add-ons"
   - "Real-time availability checking"

3. **Booking Flow**
   - Select date from calendar
   - Add add-ons (video, flowers, etc.)
   - Fill in details
   - "Proceed to Checkout" → Stripe integration

4. **Admin Dashboard** (`/admin`)
   - Login: `admin@elope.com` / `admin123`
   - "Complete admin control panel"
   - "View all bookings, manage packages"
   - "Blackout date management"

5. **Technical Highlights**
   - "129 tests passing with 100% success rate"
   - "Webhook-based payment processing"
   - "Race condition prevention for double bookings"
   - "Deployed on enterprise infrastructure (Vercel + Render)"
   - "PostgreSQL database with Supabase"
   - "Stripe payment integration"

### Demo Checklist

- [ ] Test full booking flow before demo
- [ ] Verify admin panel works
- [ ] Check all images load
- [ ] Confirm Stripe test mode active
- [ ] Prepare to show codebase quality (optional)
- [ ] Have `REMEDIATION_COMPLETE.md` ready to share

---

## Part 10: Cost Breakdown

### Free Tier Limits

**Vercel (Free):**
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Perfect for demos
- Cost: **$0/month**

**Render (Free):**
- ✅ 750 hours/month
- ⚠️ Spins down after 15 min inactivity
- ⚠️ 30-60s cold start
- ✅ Enough for demos
- Cost: **$0/month**

**Supabase (Free):**
- ✅ 500 MB database
- ✅ Unlimited API requests
- ✅ Perfect for MVP
- Cost: **$0/month**

**Stripe (Test Mode):**
- ✅ Free test mode
- ✅ No charges
- Cost: **$0/month**

**Total Cost for Demo:** **$0/month** 🎉

### Paid Tier (When Scaling)

**Render Pro ($7/month):**
- Always on (no cold starts)
- Better performance
- More resources

**Vercel Pro ($20/month):**
- More bandwidth
- Team collaboration
- Analytics

---

## Quick Reference Commands

### Update Frontend
```bash
cd client
git pull
vercel --prod
```

### Update Backend
```bash
cd server
git pull
# Render auto-deploys on git push
```

### Check Deployment Status
```bash
# Vercel
vercel ls

# Render
# Check dashboard: https://dashboard.render.com
```

### View Logs
```bash
# Vercel
vercel logs

# Render
# Use dashboard or Render CLI
```

---

## 🎯 Step-by-Step Deployment Checklist

### Phase 1: Preparation (15 minutes)
- [ ] Commit all code changes
- [ ] Push to GitHub
- [ ] Copy RENDER_ENV_TEMPLATE.txt content
- [ ] Create Render account
- [ ] Create Vercel account

### Phase 2: Deploy Backend (20 minutes)
- [ ] Create Render web service
- [ ] Configure root directory: `server`
- [ ] Add all environment variables
- [ ] Wait for build to complete
- [ ] Test API endpoint
- [ ] Note down Render URL

### Phase 3: Deploy Frontend (15 minutes)
- [ ] Import project to Vercel
- [ ] Configure root directory: `client`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy
- [ ] Test Vercel URL
- [ ] Note down Vercel URL

### Phase 4: Connect Services (10 minutes)
- [ ] Update CORS_ORIGIN in Render with Vercel URL
- [ ] Update Stripe webhook URL with Render URL
- [ ] Update Stripe success/cancel URLs with Vercel URL
- [ ] Redeploy Render service
- [ ] Test integration

### Phase 5: Final Testing (10 minutes)
- [ ] Browse packages on Vercel URL
- [ ] Test date selection
- [ ] Try checkout flow
- [ ] Login to admin panel
- [ ] Verify bookings appear

**Total Time:** ~70 minutes (1 hour 10 minutes)

---

## 🚨 Critical Notes for Investors Demo

1. **Render Free Tier Cold Starts:**
   - First request after 15 min may take 30-60s
   - **Solution:** Visit API URL before demo to "wake it up"
   - Or upgrade to Render Pro ($7/mo) for always-on

2. **Use Test Mode:**
   - Keep Stripe in test mode for demo
   - Use test card: `4242 4242 4242 4242`
   - Never charge real cards during demo

3. **Demo Data:**
   - Add 3-5 realistic bookings before demo
   - Use real-looking names and dates
   - Shows the platform in "active" use

4. **Admin Password:**
   - Consider changing from `admin123` to something more secure
   - Or at least mention "demo credentials" during presentation

---

## Need Help?

**Vercel Docs:** https://vercel.com/docs
**Render Docs:** https://render.com/docs
**Supabase Docs:** https://supabase.com/docs

**Common Support:**
- Vercel: support@vercel.com
- Render: support@render.com
- Stripe: support via dashboard

---

**Created:** 2025-10-29
**Purpose:** Production deployment for investor demo
**Target Completion:** 1-2 hours
**Expected Cost:** $0 (free tiers)

Good luck with your investor demo! 🚀
