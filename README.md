# MemoFlow

**A fast, real-time knowledge and study management workspace — notes, tasks, subjects, and spaced-repetition flashcards, all synced live.**

Built with React, TypeScript, and Firebase, MemoFlow keeps your study workflow in one place: write Markdown notes with live preview, organize them by subject and tag, track tasks alongside your notes, and review flashcards on a spaced-repetition schedule — online or offline.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Made with Vite](https://img.shields.io/badge/built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/backend-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [Security Rules](#security-rules)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Category                | What you get                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| 📝 **Notes**            | Split-pane Markdown editor with live preview, debounced auto-save, and inline media uploads        |
| 🔄 **Real-Time Sync**   | Changes save straight to Firestore, with offline support and `Saving…` / `Saved` status indicators |
| 🗂️ **Organization**     | Nested folder trees, subjects, tags, pinned notes, and full-text search                            |
| 🧠 **Flashcards & SRS** | Deck-based flashcards with a spaced-repetition scheduler for review sessions                       |
| ✅ **Tasks**            | To-do lists linked directly to notes and study subjects                                            |
| ⚡ **Command Palette**  | Keyboard-driven quick search and navigation across your workspace                                  |
| 🎨 **Customization**    | Multiple themes and UI preferences                                                                 |
| 📤 **Export**           | Export your workspace to Markdown, JSON, or PDF                                                    |
| 🛡️ **Admin Dashboard**  | Role-based access control, user management, system metrics, and storage tracking                   |

---

## Tech Stack

- **Frontend:** React + TypeScript, bundled with Vite
- **Styling & Icons:** Tailwind CSS, Lucide Icons
- **State Management:** Zustand
- **Auth:** Firebase Authentication (Google OAuth + Email/Password)
- **Database:** Firebase Firestore (v10+ Modular SDK)
- **File Storage:** Firebase Cloud Storage

---

## Project Structure

```text
memo-webapp/
├── src/
│   ├── components/            # UI components
│   │   ├── AuthModal.tsx
│   │   ├── ConfirmDeleteModal.tsx
│   │   ├── EditorSplitView.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── NotesList.tsx
│   │   ├── Sidebar.tsx
│   │   └── SyncStatusIndicator.tsx
│   ├── context/                # Auth and Theme context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                  # Custom React hooks
│   │   └── useNotes.ts
│   ├── types/                  # TypeScript interfaces
│   │   └── note.ts
│   ├── utils/                  # Helper utilities
│   │   ├── folderStyles.ts
│   │   └── searchUtils.tsx
│   ├── App.tsx                 # Main application router and layout
│   ├── firebaseConfig.ts       # Firebase initialization
│   ├── index.css               # Global styles
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts
├── bun.lock
├── firebase-applet-config.json
├── firestore.rules             # Firestore security rules
├── index.html                  # HTML template
├── metadata.json
├── package.json
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite bundler configuration
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** `v18.0.0` or higher
- **npm**, **pnpm**, or **yarn**
- A **Firebase project** with **Authentication**, **Firestore**, and **Storage** enabled

### Installation

```bash
git clone https://github.com/your-username/memo-webapp.git
cd memo-webapp
npm install
```

### Firebase Setup

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** → turn on the **Google** and **Email/Password** sign-in providers.
3. Create a **Firestore** database (start in production mode).
4. Enable **Cloud Storage** for media uploads.
5. In Project Settings, register a new Web App and copy the config values into a `.env.local` file (see below).

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ `.env.local` should never be committed. Make sure it's listed in `.gitignore`.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Building for Production

```bash
npm run build      # Create an optimized production build
npm run preview    # Preview the production build locally
```

---

## Deploying to Vercel & Troubleshooting `auth/unauthorized-domain`

When deploying to Vercel (e.g. `https://meno-webapp.vercel.app/`), Firebase Authentication requires your deployment domain to be explicitly whitelisted in your Firebase Console.

### 🚨 Fixing `Firebase: Error (auth/unauthorized-domain)`

If you see:
```text
Firebase: Error (auth/unauthorized-domain)
```

This error means Firebase Authentication is blocking sign-in requests because your deployed domain (`meno-webapp.vercel.app`) has not been added to your Firebase project's **Authorized Domains** list.

#### 🔧 Step-by-Step Fix (Takes 30 seconds):

1. **Go to Firebase Console**:
   Open [Firebase Console Authentication Settings](https://console.firebase.google.com/project/earnest-entity-dpthm/authentication/settings) (replace with your project ID if using a different one).
2. **Open the Settings Tab**:
   Click **Authentication** in the left sidebar, then click the **Settings** tab at the top.
3. **Add Authorized Domain**:
   - Scroll down to the **Authorized domains** card.
   - Click **Add domain**.
   - Enter `meno-webapp.vercel.app` (you can also add `*.vercel.app` or any custom domain you connect).
   - Click **Save**.
4. **Refresh & Test**:
   Return to your Vercel deployment at `https://meno-webapp.vercel.app/` and try signing in. Google Sign-In and Email authentication will now work seamlessly!

### Vercel Environment Variables (Optional)

If you don't commit `firebase-applet-config.json`, configure these environment variables in your Vercel Project Settings (**Project Settings** → **Environment Variables**):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=earnest-entity-dpthm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=earnest-entity-dpthm
VITE_FIREBASE_STORAGE_BUCKET=earnest-entity-dpthm.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=747004328924
VITE_FIREBASE_APP_ID=1:747004328924:web:6d7ea73e3eb8da4a0bed19
```

---

## Security Rules

MemoFlow ships with a `firestore.rules` file enforcing per-user authorization. Deploy it with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## Roadmap

- [x] **Phase 1 — Core Study Engine (V1):** Markdown editor with live preview & auto-save · subject/tag taxonomy · interactive flashcards · Firebase Auth & Firestore sync
- [ ] **Phase 2 — Task Management & Review Algorithms:** Spaced repetition scheduling · linked task lists · global command palette
- [ ] **Phase 3 — Media & Advanced Customization:** Inline image/asset uploads · extended themes · workspace export (Markdown/JSON/PDF)
- [ ] **Phase 4 — Analytics & Admin Controls:** Admin dashboard with roles & metrics · study analytics (review heatmaps, time-per-subject)

---

## Contributing

Contributions are welcome! To propose a change:

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`)
2. Commit your changes with clear messages
3. Push to your fork and open a Pull Request

Please open an issue first for large changes so we can discuss the approach.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
