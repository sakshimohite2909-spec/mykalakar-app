# Artist HUB

A production-ready React + Vite platform for artist discovery, booking workflows, and role-based dashboards.

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- Firebase (Auth, Firestore, Storage)
- Vitest

## Project Structure

- `src/pages` - route pages (public, artist, admin)
- `src/components` - reusable UI and feature components
- `src/contexts` - global state providers (auth)
- `src/lib` - firebase integration, utilities, domain helpers
- `firestore.rules` / `storage.rules` - Firebase security rules

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env
```

3. Fill all values in `.env` using your Firebase project config.

4. Start dev server:

```bash
npm run dev
```

5. Open the app in browser:

```text
http://localhost:8080
```

## Environment Variables

Use `.env.example` as reference. Required variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

## Security and Privacy Practices

- Never commit `.env`, `.env.local`, or production secrets.
- Keep real keys in local env files and deployment platform secret stores.
- Commit only `.env.example` with placeholder values.
- Firebase rules are versioned and deployed explicitly from this repo.
- Source code reads Firebase config from environment variables only.

## Build and Tests

Run production build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Deployment

### Option A: Vercel (frontend)

1. Import this GitHub repository into Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add all `VITE_` environment variables in Vercel Project Settings.
5. Deploy.

`vercel.json` is configured for SPA route rewrites.

### Option B: Firebase Rules Deployment

Deploy Firestore and Storage rules:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest deploy --only firestore:rules,storage:rules --project <your-project-id>
```

## Git Workflow

Recommended release workflow:

1. Create a feature/release branch.
2. Run `npm run build` and `npm run test`.
3. Commit with clear messages.
4. Push branch and open a Pull Request.
5. Merge after review and CI checks.

## License

This project is currently private and maintained by the Artist HUB team.
