# ABES Marketplace

A Tinder-style marketplace exclusively for ABES college students (@abes.ac.in).

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend setup](#2-backend-setup)
  - [3. Frontend setup](#3-frontend-setup)
- [Configuration Reference](#configuration-reference)
  - [Backend – wrangler.toml](#backend--wranglertoml)
  - [Backend – .dev.vars (local secrets)](#backend--devvars-local-secrets)
  - [Frontend – .env](#frontend--env)
- [Third-party Service Setup](#third-party-service-setup)
  - [Cloudinary (image uploads)](#cloudinary-image-uploads)
  - [Resend (email OTP)](#resend-email-otp)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Deployment](#deployment)
  - [Backend – Cloudflare Workers](#backend--cloudflare-workers)
  - [Frontend – Cloudflare Pages](#frontend--cloudflare-pages)
- [Troubleshooting](#troubleshooting)

---

## Features

- 🔐 Email OTP authentication (restricted to `@abes.ac.in` addresses)
- 🃏 Tinder-style swipe UI for browsing ads
- ❤️ Per-user persistent wishlist
- 📱 Privacy-safe WhatsApp contact flow
- 📸 Cloudinary image uploads (up to 5 images per ad)
- 🛡️ JWT-protected routes with blocked-user enforcement
- 📋 User dashboard to manage and deactivate listings
- 📱 Mobile-first responsive design

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite) + Tailwind CSS v4 + react-tinder-card + react-router-dom v7 |
| Backend | Cloudflare Workers (Hono v4) |
| Database | Cloudflare D1 (SQLite-compatible) |
| Image storage | Cloudinary |
| Email delivery | Resend API |
| Auth | Email OTP + HS256 JWT (7-day sessions) |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Workers (backend) |

---

## Project Structure

```
marketplace/
├── frontend/                  # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── pages/             # Login, Home, Wishlist, PostAd, Dashboard
│   │   ├── components/        # SwipeCard, AdModal, Navbar, ProtectedRoute
│   │   ├── context/           # AuthContext (JWT state)
│   │   └── utils/
│   │       ├── api.js         # Axios instance with auth interceptors
│   │       ├── cloudinary.js  # Image upload helper
│   │       └── jwt.js         # JWT decode helper
│   ├── .env.example           # Frontend environment variable template
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/                   # Cloudflare Workers (Hono)
    ├── src/
    │   ├── index.js           # App entry point, CORS, route mounting
    │   ├── routes/
    │   │   ├── auth.js        # POST /auth/send-otp, POST /auth/verify
    │   │   ├── ads.js         # CRUD /ads
    │   │   ├── wishlist.js    # GET/POST/DELETE /wishlist
    │   │   └── contact.js     # POST /contact
    │   ├── middleware/
    │   │   └── auth.js        # JWT Bearer token middleware
    │   └── utils/
    │       ├── jwt.js         # HS256 sign/verify (Web Crypto API)
    │       └── otp.js         # OTP generation + Resend email delivery
    ├── schema.sql             # D1 database schema
    ├── wrangler.toml          # Cloudflare Workers configuration
    ├── .dev.vars.example      # Local secrets template
    └── package.json
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | Required by Vite and Wrangler |
| npm | ≥ 9 | Bundled with Node.js |
| Wrangler CLI | ≥ 3 | `npm install -g wrangler` |
| Cloudflare account | – | Free tier is sufficient |
| Cloudinary account | – | Free tier is sufficient |
| Resend account | – | Free tier (100 emails/day) is sufficient |

> **Tip:** Run `wrangler --version` to confirm the CLI is installed.

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/aksri648/marketplace.git
cd marketplace
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Create the local secrets file from the template
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set JWT_SECRET (and optionally RESEND_API_KEY)

# Create a local D1 database for development
npx wrangler d1 create abes-marketplace-dev
# Copy the printed database_id and update the [[d1_databases]] section in wrangler.toml

# Apply the schema to your local D1 database
npx wrangler d1 execute abes-marketplace-dev --file=schema.sql --local

# Start the local development server (default: http://localhost:8787)
npx wrangler dev
```

> **OTP in development:** If `RESEND_API_KEY` is left empty in `.dev.vars`, OTPs are printed to the
> wrangler console instead of being sent by email. Look for a line like:
> `[DEV] OTP for student@abes.ac.in: 123456`

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Create the environment file from the template
cp .env.example .env
```

Edit `frontend/.env` and set the following (see [Frontend – .env](#frontend--env) for details):

```env
VITE_API_URL=http://localhost:8787
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

```bash
# Start the Vite dev server (default: http://localhost:5173)
npm run dev
```

---

## Configuration Reference

### Backend – wrangler.toml

`backend/wrangler.toml` is the Cloudflare Workers configuration file. It is safe to commit and
should **not** contain secrets.

```toml
name = "abes-marketplace-api"         # Worker name (shown in Cloudflare dashboard)
main = "src/index.js"                 # Entry point
compatibility_date = "2024-01-01"     # Cloudflare compatibility flags snapshot

[[d1_databases]]
binding = "DB"                        # Variable name used in Worker code (c.env.DB)
database_name = "abes-marketplace"    # Human-readable name
database_id = "YOUR_DATABASE_ID"      # ← Replace after running `wrangler d1 create`

[vars]
# Non-secret runtime variables only (visible in Cloudflare dashboard).
# JWT_SECRET and RESEND_API_KEY must be set as Cloudflare secrets (see Deployment).
FRONTEND_URL = "https://abes-marketplace.pages.dev"   # ← Update to your Pages URL
```

> ⚠️ **Important:** `JWT_SECRET` and `RESEND_API_KEY` must **not** be placed in `[vars]`
> (they would be visible in the Cloudflare dashboard). Set them as encrypted secrets instead
> (see [Deployment](#deployment)).

### Backend – .dev.vars (local secrets)

`backend/.dev.vars` stores local development secrets that Wrangler injects at runtime.
It is git-ignored. Copy `.dev.vars.example` to get started:

```bash
cp backend/.dev.vars.example backend/.dev.vars
```

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random string for signing/verifying JWTs. Generate with `openssl rand -base64 32`. |
| `RESEND_API_KEY` | No | Resend API key. Leave empty to log OTPs to the console instead of sending email. |

### Frontend – .env

`frontend/.env` is git-ignored. Copy `frontend/.env.example` to get started:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the backend API. Use `http://localhost:8787` for local dev. |
| `VITE_CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary **cloud name** (found on the Cloudinary dashboard). |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | An **unsigned** upload preset configured in Cloudinary. |

---

## Third-party Service Setup

### Cloudinary (image uploads)

1. Sign up at [cloudinary.com](https://cloudinary.com) and note your **cloud name**.
2. In the Cloudinary dashboard, go to **Settings → Upload**.
3. Under **Upload presets**, click **Add upload preset**.
4. Set **Signing mode** to **Unsigned** (required for browser-side uploads).
5. Optionally restrict the allowed formats to `jpg,jpeg,png,webp`.
6. Save and copy the preset name into `VITE_CLOUDINARY_UPLOAD_PRESET` in `frontend/.env`.

### Resend (email OTP)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Add and **verify** your sending domain in the Resend dashboard (Domains → Add domain).
   The backend sends OTPs from `noreply@abes.ac.in`, so that domain must be verified.
3. Set the API key:
   - **Local:** add `RESEND_API_KEY=re_...` to `backend/.dev.vars`.
   - **Production:** run `npx wrangler secret put RESEND_API_KEY`.

> **Development shortcut:** Leave `RESEND_API_KEY` empty in `.dev.vars`. Wrangler will print the
> OTP directly to the terminal – no email is sent.

---

## Database Schema

The database lives in Cloudflare D1 (`schema.sql`).

| Table | Purpose |
|---|---|
| `users` | Registered students (email, name, phone, role, blocked status) |
| `ads` | Marketplace listings (title, description, price, category, images, status) |
| `wishlist` | Per-user saved ads (user_id ↔ ad_id, unique constraint) |
| `contact_requests` | Audit log of buyer contact events |
| `otps` | Temporary OTP storage (email, hashed OTP, expiry, attempt counter) |

To apply or re-apply the schema:

```bash
# Local
npx wrangler d1 execute abes-marketplace --file=backend/schema.sql --local

# Remote (production)
npx wrangler d1 execute abes-marketplace --file=backend/schema.sql --remote
```

---

## API Reference

All endpoints are relative to the `VITE_API_URL` / Worker base URL.

### Authentication (`/auth`)

> No authentication required.

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/auth/send-otp` | `{ "email": "student@abes.ac.in" }` | Sends a 6-digit OTP to the given email. Only `@abes.ac.in` addresses are accepted. OTP expires in 5 minutes; max 3 verification attempts. |
| `POST` | `/auth/verify` | `{ "email", "otp", "name"? }` | Verifies the OTP. Creates the user on first login. Returns `{ token, user }`. |

### Ads (`/ads`)

> `POST`, `PATCH`, and `DELETE` require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ads` | No | List active ads. Query params: `page` (default `1`), `limit` (default `10`), `category`. |
| `GET` | `/ads/:id` | No | Get a single ad by ID. |
| `POST` | `/ads` | Yes | Create an ad. Body: `{ title, description?, price?, category, image_urls? }`. Max 5 active ads per user. |
| `PATCH` | `/ads/:id` | Yes | Update ad status. Body: `{ "status": "active" \| "sold" \| "inactive" }`. Owner or admin only. |
| `DELETE` | `/ads/:id` | Yes | Delete an ad. Owner or admin only. |

### Wishlist (`/wishlist`)

> All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/wishlist` | – | List the authenticated user's saved ads. |
| `POST` | `/wishlist` | `{ "ad_id" }` | Toggle wishlist entry (adds if not present, removes if present). |
| `DELETE` | `/wishlist` | `{ "ad_id" }` | Explicitly remove an ad from the wishlist. |

### Contact (`/contact`)

> Requires `Authorization: Bearer <token>`.

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/contact` | `{ "ad_id", "buyer_name"? }` | Logs a contact request and returns a pre-filled WhatsApp link for the seller. |

---

## Deployment

### Backend – Cloudflare Workers

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Authenticate with Cloudflare (one-time)
npx wrangler login

# 3. Create the D1 database (one-time)
npx wrangler d1 create abes-marketplace
# → Copy the printed database_id into wrangler.toml [[d1_databases]]

# 4. Apply the database schema (run again after any schema changes)
npx wrangler d1 execute abes-marketplace --file=schema.sql --remote

# 5. Set production secrets (never commit these)
npx wrangler secret put JWT_SECRET       # enter a strong random value
npx wrangler secret put RESEND_API_KEY   # enter your Resend API key

# 6. Deploy
npx wrangler deploy
```

After deploying, note the Worker URL (e.g. `https://abes-marketplace-api.<account>.workers.dev`).
Set it as `VITE_API_URL` in the frontend build.

### Frontend – Cloudflare Pages

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set production environment variables in Cloudflare Pages dashboard
#    (Settings → Environment variables) or use a .env file for local builds:
#    VITE_API_URL=https://abes-marketplace-api.<account>.workers.dev
#    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
#    VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# 3. Build
npm run build

# 4. Deploy dist/ to Cloudflare Pages
#    Option A – Wrangler
npx wrangler pages deploy dist --project-name abes-marketplace

#    Option B – Git integration
#    Connect this repository to Cloudflare Pages in the dashboard.
#    Set build command: npm run build  |  output directory: dist
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Only @abes.ac.in email addresses are allowed` | Wrong email domain | Use a valid `@abes.ac.in` address. |
| OTP never arrives | `RESEND_API_KEY` not set or domain not verified | Check `.dev.vars` / Cloudflare secrets. In dev, check the wrangler terminal for the printed OTP. |
| `Invalid or expired token` | JWT secret mismatch or expired session | Ensure `JWT_SECRET` is the same value used to issue the token. Tokens expire after 7 days. |
| `User is blocked or not found` | Account was blocked by an admin | Contact the marketplace administrator. |
| `You can only have 5 active ads at a time` | Active ad limit reached | Deactivate or delete an existing ad from the Dashboard before posting a new one. |
| Cloudinary upload fails | Wrong cloud name or upload preset | Verify `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` in `.env`. Ensure the preset is **unsigned**. |
| `database_id` error in Wrangler | Placeholder not replaced in `wrangler.toml` | Run `npx wrangler d1 create abes-marketplace` and paste the returned ID into `wrangler.toml`. |