# 🎨 Artist HUB Pro

<div align="center">

![Artist HUB Pro](https://img.shields.io/badge/Artist%20HUB%20Pro-Premium%20Platform-6366f1?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss)

**A production-ready, premium platform for artist discovery, event booking, and role-based management dashboards.**

[🚀 Live Demo](https://artist-hub-pro-main.vercel.app) · [📖 Docs](./docs) · [🐛 Issues](https://github.com/Varad-Shadow/Artist_HUB/issues)

</div>

---

## ✨ Features

### For Clients / Event Planners
- 🔍 **Artist Discovery** — Browse and filter artists by category, location, budget, and availability
- 📅 **Smart Booking Flow** — Step-by-step event → location → requirements booking wizard
- 🎭 **Artist Profiles** — Rich media profiles with portfolios, reviews, and availability calendars
- ⭐ **Reviews & Ratings** — Verified review system with star ratings

### For Artists
- 🎨 **Artist Dashboard** — Manage bookings, profile, and portfolio in one place
- 📸 **Media Portfolio** — Upload and showcase images, videos, and links
- 📊 **Booking Analytics** — Track earnings, booking history, and performance metrics
- 🔔 **Real-time Notifications** — Instant updates on booking requests and status changes

### For Admins
- 👥 **Artist Management** — Approve, suspend, or manage artist accounts
- 📋 **Booking Oversight** — Full visibility into platform-wide bookings
- 🗂️ **Category & Event Management** — Create and manage event types, categories, locations
- 📈 **Analytics Dashboard** — Platform-wide statistics and reporting
- ⚙️ **Platform Settings** — Firebase bootstrap and configuration tools

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **Animation** | Framer Motion + GSAP + Three.js |
| **Backend / Auth** | Firebase (Auth, Firestore, Storage) |
| **State Management** | React Context + TanStack Query |
| **Forms** | React Hook Form + Zod |
| **Routing** | React Router DOM v6 |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Vercel |

---

## 🗂️ Project Structure

```
src/
├── pages/                    # Route-level page components
│   ├── Index.tsx             # Home / Landing page
│   ├── SearchPage.tsx        # Artist discovery & search
│   ├── ArtistProfile.tsx     # Public artist profile
│   ├── ArtistRegister.tsx    # Artist registration flow
│   ├── ArtistLogin.tsx       # Auth (login/register)
│   ├── EventSelection.tsx    # Booking step 1 – event type
│   ├── LocationSelection.tsx # Booking step 2 – location
│   ├── EventRequirements.tsx # Booking step 3 – requirements
│   ├── EventDetails.tsx      # Event detail view
│   ├── UserProfile.tsx       # User account settings
│   ├── NotFound.tsx          # 404 page
│   ├── admin/                # Admin-only pages (protected)
│   └── artist/               # Artist dashboard pages (protected)
├── components/               # Reusable UI & feature components
│   ├── HeroBanner.jsx        # Landing page hero section
│   ├── PremiumScrollyExperience.tsx
│   ├── ArtistProtectedRoute.jsx
│   ├── AdminProtectedRoute.jsx
│   └── ProtectedRoute.jsx
├── contexts/                 # React context providers
│   └── AuthContext           # Firebase auth state
├── services/                 # Firebase API service layer
├── lib/                      # Firebase setup, utilities, helpers
├── hooks/                    # Custom React hooks
├── data/                     # Static data and constants
├── styles/                   # Global CSS and design tokens
└── AppRouter.jsx             # Route definitions (React Router)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **bun**)
- A **Firebase** project with Firestore, Auth, and Storage enabled

### 1. Clone the repository

```bash
git clone https://github.com/Varad-Shadow/Artist_HUB.git
cd Artist_HUB
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX   # optional
```

### 4. Start the development server

```bash
npm run dev
```

Visit: [http://localhost:8080](http://localhost:8080)

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Cloud Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚡ Optional | Google Analytics |

> ⚠️ **Never commit `.env` or `.env.local` files.** Use `.env.example` as a safe template.

---

## 🏗️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

### Vercel (Recommended)

The project includes a pre-configured `vercel.json` for SPA routing:

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new)
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Add all `VITE_` environment variables under **Project Settings → Environment Variables**
5. Click **Deploy** ✅

### Firebase Hosting (Alternative)

Deploy Firestore and Storage security rules:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest deploy \
  --only firestore:rules,storage:rules \
  --project <your-project-id>
```

---

## 🔒 Security & Privacy

- 🚫 **Never commit** `.env`, `.env.local`, or production secrets
- ✅ **Only commit** `.env.example` with placeholder values
- 🔐 Firebase Firestore and Storage rules are versioned in this repo (`firestore.rules`, `storage.rules`)
- 🔑 All Firebase config is loaded exclusively from environment variables
- 👮 Role-based access control enforced at both the UI level (protected routes) and database level (Firestore rules)

---

## 🗺️ Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/explore` | Public | Artist search & discovery |
| `/artist/:id` | Public | Artist public profile |
| `/events` | Public | Event type selection |
| `/login` | Public | Authentication |
| `/register` | Public | Artist registration |
| `/profile` | 🔒 Auth | User profile settings |
| `/artist/dashboard` | 🎨 Artist | Artist management dashboard |
| `/admin` | 👮 Admin | Admin control panel |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run tests and build: `npm run test && npm run build`
4. Commit with clear messages: `git commit -m "feat: add your feature"`
5. Push and open a Pull Request

---

## 📄 License

This project is **proprietary and private**, maintained by the Artist HUB team.

---

<div align="center">
  Built with ❤️ by the <strong>Artist HUB Pro</strong> team
  <br/>
  <sub>Powered by React · Vite · Firebase · Tailwind CSS</sub>
</div>
