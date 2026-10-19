# MemoFlow

**A fast, minimal Markdown note workspace with live Firestore sync — or a browser-local workspace when you would rather not sign in.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![React 19](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/backend-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)

Live app: **https://meno-webapp.vercel.app**

---

## Features

Everything below is implemented in this repository.

| Area | What you get |
| --- | --- |
| Markdown editor | Source pane and rendered GitHub-Flavored Markdown preview side by side, driven by `marked` |
| View modes | Split, editor-only, or preview-only; auto-switches to editor-only below 768 px |
| Formatting toolbar | Bold, italic, strikethrough, H1–H3, quote, inline code, code block, bullet / numbered / task list, link, table |
| Auto-save | 500 ms debounce on title and content, 200 ms on folder and tags, `⌘/Ctrl+S` to save immediately |
| Sync status | `Saving…` / `Saved` / `Offline` / `Error` indicator, with an offline banner |
| Organization | Flat folders (five defaults plus your own), tags, pinned notes, filter chips |
| Search | Keyword, `#tag`, `tag:`, `folder:`, `@folder`, `keyword:#tag`, quoted phrases; match highlighting and centered excerpts |
| Per-note stats | Word count, character count, estimated read time, last-updated time |
| Output | Copy raw Markdown to the clipboard, download the note as `.md` |
| Theme | Light and dark, persisted, following the system preference on first visit |
| Responsive | Mobile drawer navigation, collapsible sidebar, auto-adjusting editor layout |
| Accounts | Google sign-in, email/password sign-in and sign-up, or an account-less local workspace |

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl+N` | New note |
| `⌘/Ctrl+S` | Save the active note immediately |
| `⌘/Ctrl+\` | Collapse or expand the sidebar |
| `Enter` | Add a tag in the tag field |

---

## How it works

**Two working modes, one data layer.** `src/hooks/useNotes.ts` owns every read and write. When a user is signed in, notes live in the Firestore `notes` collection and arrive through a real-time `onSnapshot` listener. When the user chooses the account-less workspace, the same hook reads and writes `localStorage` instead. Components never talk to Firebase directly.

**Optimistic saves.** Edits update React state first so typing never waits on the network, then a debounced write commits to Firestore with `setDoc(..., { merge: true })`. See `src/hooks/useNotes.ts`.

**Guest notes follow you in.** On the first sign-in, the local workspace's notes are migrated to the new account, and the local copy is deleted only after every write commits. If a write fails, the notes stay in the browser and the migration retries on the next sign-in. That ordering guarantee lives in `src/utils/migration.ts`, where the Firestore write and the cleanup are injected — which is what makes it testable without a database.

**Note shape.** `src/types/note.ts`:

```ts
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  isPinned: boolean;
  updatedAt: number;
  createdAt: number;
  userId: string;
}
```

**Access control.** `firestore.rules` restricts every note to its owner:

```
match /notes/{noteId} {
  allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}
```

---

## Tech stack

- **React 19** + **TypeScript**, bundled by **Vite 6**
- **Tailwind CSS 4** (via `@tailwindcss/vite`) and **lucide-react** icons
- **marked** for GitHub-Flavored Markdown rendering
- **Firebase 12** modular SDK — Authentication and Firestore (no Storage, no Cloud Functions)
- **No state library.** State is React hooks plus two context providers (`AuthContext`, `ThemeContext`)

---

## Project structure

```text
meno-webapp/
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx              # in-workspace sign in / sign out
│   │   ├── ConfirmDeleteModal.tsx
│   │   ├── EditorSplitView.tsx        # editor, preview, toolbar, stats
│   │   ├── MarkdownRenderer.tsx       # marked → HTML
│   │   ├── NotesList.tsx              # list, search bar, filter chips
│   │   ├── OperationNotAllowedAlert.tsx
│   │   ├── Sidebar.tsx                # folders, tags, theme switch, account footer
│   │   ├── SignInPage.tsx             # signed-out screen, guest entry
│   │   ├── SyncStatusIndicator.tsx
│   │   └── UnauthorizedDomainAlert.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/useNotes.ts              # all note state, sync, folders, search
│   ├── test/factories.ts              # shared test fixtures
│   ├── types/note.ts
│   ├── assets/MEMO.png                # app mark, imported by the sidebar
│   ├── utils/
│   │   ├── folders.ts                 # folder list rules (tested)
│   │   ├── migration.ts               # local notes → account migration (tested)
│   │   ├── notes.ts                   # dedupe, sort, filter (tested)
│   │   ├── folderStyles.ts
│   │   └── searchUtils.tsx
│   ├── App.tsx                        # layout, routing between the three screens
│   ├── firebaseConfig.ts
│   ├── index.css
│   └── main.tsx
├── .github/workflows/check.yml     # install, type check and tests on push
├── firebase-applet-config.json        # Firebase client config (public by design)
├── firestore.rules
└── index.html
```

---

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

`bun install && bun run dev` works too.

### Firebase setup

The app expects a Firebase project with Authentication and Firestore:

1. Enable the **Google** and **Email/Password** sign-in providers in Firebase Console → Authentication → Sign-in method.
2. Create a Firestore database and publish the rules in `firestore.rules`.
3. Add your deployment hostname under Authentication → Settings → Authorized domains. A missing entry produces `auth/unauthorized-domain`, which the app reports with a dedicated alert.
4. Point the app at your project by editing `firebase-applet-config.json`, or by setting the `VITE_FIREBASE_*` variables — `src/firebaseConfig.ts` reads the environment first, then falls back to the JSON file.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | `tsc --noEmit` type check |
| `npm run test` | Vitest unit tests |

---

## Known limitations

- **Test coverage is limited to the pure logic.** Vitest covers note de-duplication and sorting, the filter rules, folder-list rules, the search-query parser, and the local-notes migration. React components and the Firestore wiring have no automated coverage; the migration is verified through injected write and cleanup functions rather than a live database.
- **Offline support is in-memory for signed-in users.** The Firestore client is created without persistent caching (`src/firebaseConfig.ts`), so queued writes survive a network drop but not a page reload. The offline banner's promise that edits are "safely stored locally" holds only for the account-less workspace, which uses `localStorage`.
- **The account-less workspace is tied to one browser.** Clearing site data deletes those notes. Signing in migrates them to the account and then clears the local copy.
- **Folders do not nest.** They are a flat, case-insensitive list; deleting a folder moves its notes to `General`.
- **Search is client-side** over the notes already loaded in the browser, not a Firestore query.
- **The bundle is one ~1 MB chunk.** No code splitting.
- **Duplicate guard is heuristic.** Notes are de-duplicated by id, and near-identical notes by a title+content+folder signature, which also collapses repeated copies of the welcome template.

---

## Possible future work

Not committed to: spaced-repetition flashcards, tasks linked to notes, a command palette, richer export (JSON/PDF), and study analytics. The current focus is making the note workspace itself solid.

---

## License

MIT — see [`LICENSE`](./LICENSE).
