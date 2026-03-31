# ABES Marketplace

A Tinder-style marketplace exclusively for ABES college students (@abes.ac.in).

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + react-tinder-card + react-router-dom
- **Backend**: Cloudflare Workers (Hono framework) + Cloudflare D1
- **Storage**: Cloudinary (image uploads)
- **Auth**: Email OTP via Resend API + JWT sessions
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (backend)

## Project Structure

```
marketplace/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # Login, Home, Wishlist, PostAd, Dashboard
│       ├── components/ # SwipeCard, AdModal, Navbar, ProtectedRoute
│       ├── context/   # AuthContext (JWT)
│       └── utils/     # api.js, cloudinary.js, jwt.js
└── backend/           # Cloudflare Workers (Hono)
    ├── src/
    │   ├── routes/    # auth, ads, wishlist, contact
    │   ├── middleware/ # JWT auth
    │   └── utils/     # jwt, otp helpers
    ├── schema.sql     # D1 database schema
    └── wrangler.toml  # Cloudflare config
```

## Setup & Deployment

### Backend (Cloudflare Workers + D1)

```bash
cd backend
npm install
npx wrangler d1 create abes-marketplace   # Copy the database_id into wrangler.toml
npx wrangler d1 execute abes-marketplace --file=schema.sql --remote
npx wrangler deploy
```

Set secrets:
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
```

### Frontend (Cloudflare Pages)

```bash
cd frontend
cp .env.example .env
# Fill in VITE_API_URL, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET
npm install
npm run build
# Deploy dist/ to Cloudflare Pages
```

## Features

- 🔐 Email OTP auth (only @abes.ac.in emails)
- 🃏 Tinder-style swipe UI for browsing ads
- ❤️ Wishlist (persistent, per-user)
- 📱 WhatsApp contact flow (privacy-safe)
- 📸 Cloudinary image uploads (up to 5 per ad)
- 🛡️ JWT-protected routes, blocked-user checks
- 📋 User dashboard to manage ads
- 📱 Mobile-first design