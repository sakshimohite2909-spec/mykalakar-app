<div align="center">

# 🎭 Artist HUB Pro
### *The Premium Platform for Elite Artist Discovery & Event Booking*

[![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)](#)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#)
<br/>
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](#)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss)](#)

[🚀 Live Demo]([PLACEHOLDER]) · [📖 Documentation]([PLACEHOLDER]) · [🐛 Report Bug]([PLACEHOLDER])

</div>

---

## 🌟 Executive Summary

**Artist HUB Pro** is a comprehensive, production-grade SaaS platform engineered to bridge the gap between world-class artists and elite event planners. It eliminates the friction of talent acquisition by providing a seamless, end-to-end booking experience.

Built for **Talent Agencies, Premium Event Planners, and Professional Artists**, the platform offers:
- A frictionless, luxury-tier artist discovery engine
- Secure, role-based workflows for artists, clients, and platform administrators
- Real-time availability, dynamic pricing, and comprehensive booking lifecycles

**Key Differentiators:** Focus on high-end aesthetic presentation, robust Firebase-backed security architecture, and an unparalleled developer experience using the modern React ecosystem.

---

## ✨ Feature Showcase

### 🔐 Authentication & Authorization
- **Role-Based Access Control (RBAC):** Secure routing and data access tailored for Users, Artists, and Admins.
- **Firebase Auth:** Enterprise-grade security handling OAuth, email/password, and session management.

### 🎨 Artist Dashboard & Profile Management
- **Rich Media Portfolios:** Upload and showcase high-resolution images, videos, and professional accolades.
- **Availability Engine:** Manage blackout dates, booking requests, and active engagements seamlessly.
- **Analytics:** Visualize profile views, booking conversion rates, and revenue metrics.

### 📅 Advanced Booking System
- **Smart Booking Wizard:** Step-by-step contextual flow capturing event type, venue details, and specific talent requirements.
- **Dynamic Status Lifecycle:** Track bookings from *Pending* → *Approved* → *Completed*.

### 👥 Admin Control Center
- **User Oversight:** Complete control over artist verification, suspension, and platform moderation.
- **System Configuration:** Dynamic category management, pricing tiers, and platform-wide announcements.
- **Global Analytics:** High-level metrics on platform health, booking volume, and revenue.

---

## 🛠️ Technology Stack

| Category | Technology | Description |
|----------|------------|-------------|
| **Frontend Framework** | React 18 | Component-based UI architecture |
| **Language** | TypeScript | Strict static typing for enterprise reliability |
| **Build Tool** | Vite 5 | Lightning-fast HMR and optimized builds |
| **UI/Styling** | Tailwind CSS + shadcn/ui | Utility-first styling with accessible, headless components |
| **State Management** | React Query + Context | Server-state caching and lightweight global state |
| **Animations** | GSAP, Framer Motion, Three.js | High-performance, luxury micro-interactions |
| **Backend & Database**| Firebase (Firestore) | Real-time NoSQL database with strict security rules |
| **Storage & Auth** | Firebase Storage & Auth | Secure blob storage and identity management |
| **Forms & Validation** | React Hook Form + Zod | Schema-based validation for bulletproof data entry |

---

## 🏛️ Architecture Overview

The application follows a modular, feature-based architecture to ensure maintainability and high scalability:

- **Application Flow:** Client requests → React Router handling → Protected Route Validation → Component Render.
- **Database Structure (NoSQL):** Normalized collections for `users`, `artists`, `events`, and `bookings` with referencing for efficient querying.
- **Authentication Flow:** JWT-based session handling via Firebase, with custom claims mapped to user roles (Admin/Artist/Client).
- **Security:** Firestore Security Rules enforce zero-trust policies—users can only mutate their own records unless holding admin claims.

---

## 🚀 Installation Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.x) or **pnpm**
- Firebase Project (Firestore, Storage, Authentication enabled)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Varad-Shadow/Artist_HUB.git
cd Artist_HUB
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
```
*(Populate `.env.local` with your Firebase credentials as detailed in the Environment Variables section)*

4. **Start the Development Server**
```bash
npm run dev
```
Access the application at `http://localhost:5173`

5. **Build for Production**
```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory. **Never commit this file.**

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

---

## 📁 Folder Structure

```text
src/
├── components/          # Shared, reusable UI components (shadcn, globals)
│   ├── admin/           # Admin dashboard specific components
│   ├── artist/          # Artist dashboard specific components
│   └── ui/              # Base UI primitives (buttons, inputs, dialogs)
├── contexts/            # React Context providers (Auth, Theme)
├── hooks/               # Custom reusable React hooks
├── lib/                 # Utility functions, API clients, Firebase config
├── pages/               # Route-level components mapping to URLs
├── services/            # Business logic and external API integrations
├── styles/              # Global CSS, Tailwind configurations
└── types/               # TypeScript interface and type definitions
```

---

## 🖼️ Screenshots

| Home Page | Artist Discovery |
|:---:|:---:|
| ![Home Page]([PLACEHOLDER_HOME_SCREENSHOT]) | ![Discovery]([PLACEHOLDER_DISCOVERY_SCREENSHOT]) |

| Artist Dashboard | Admin Panel |
|:---:|:---:|
| ![Artist Dashboard]([PLACEHOLDER_DASHBOARD_SCREENSHOT]) | ![Admin Panel]([PLACEHOLDER_ADMIN_SCREENSHOT]) |

---

## ⚡ Performance Highlights

- **Bundle Optimization:** Code-splitting at the route level using React `lazy` and `Suspense`.
- **Image Optimization:** Intelligent image compression before Firebase upload; global usage of WebP/optimized formats.
- **Caching Strategy:** Aggressive data caching and automatic background refetching via TanStack Query.
- **Animation Performance:** Hardware-accelerated CSS transforms and highly optimized GSAP timelines.

---

## 🛡️ Security Features

- **Route Protection:** Higher-Order Components (`ProtectedRoute`, `AdminRoute`) prevent unauthorized client-side rendering.
- **Data Validation:** Strict runtime validation using `Zod` before any database mutation.
- **Firebase Security Rules:** Comprehensive `firestore.rules` and `storage.rules` validating schema, data ownership, and role authorization at the database layer.

---

## 🗺️ Future Roadmap

- [ ] **Phase 1:** Integrated Payment Gateway (Stripe/Razorpay) for direct booking deposits.
- [ ] **Phase 2:** Real-time Chat System between Artists and Event Planners.
- [ ] **Phase 3:** AI-Powered Artist Recommendation Engine.
- [ ] **Phase 4:** Mobile Application (React Native) for push notifications.

---

## 🤝 Contribution Guidelines

We enforce strict engineering standards:
1. **Branch Strategy:** `feature/` for new capabilities, `fix/` for bug resolution, `chore/` for maintenance.
2. **Commit Convention:** Adhere to [Conventional Commits](https://www.conventionalcommits.org/).
   - Example: `feat: implement role-based dashboard architecture`
3. **Pull Request Process:** All PRs require review, passing CI/CD pipelines (ESLint, Vitest), and an updated changelog.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or usage of this codebase, via any medium, is strictly prohibited unless explicitly authorized.

---


<div align="center">
  <sub>Built with precision and passion.</sub>
</div>
