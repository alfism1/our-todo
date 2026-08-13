# Our Todo

A shared, project-based todo app. You make a **project**, send someone the link, and you both
edit the same list in real time. No accounts, no signup — visitors are signed in silently via
Firebase Anonymous Auth so Firestore has an identity to check against.

Built to stay inside the Firebase **Spark (free) plan**: no Cloud Functions, one Firestore
listener per open project, and drag-reordering that costs a single write.

- React 18 + Vite · TailwindCSS · Framer Motion · lucide-react
- @dnd-kit for reordering · react-hot-toast for feedback
- Firestore + Anonymous Auth + Firebase Hosting

---

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
   Google Analytics is not needed.
2. **Build → Firestore Database → Create database.** Pick a region near you and start in
   **production mode** — the rules in `firestore.rules` replace the defaults on first deploy.
3. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
   The app cannot read or write anything until this is on.
4. **Project settings (gear icon) → General → Your apps → Web (`</>`)** to register a web app.
   Copy the `firebaseConfig` values it shows you.

### 2. Configure and run

```bash
npm install
cp .env.example .env      # then paste your config values in
npm run dev               # http://localhost:5173
```

If `.env` is missing or incomplete the app says so on screen and lists the missing keys, rather
than failing with an opaque SDK error.

> The `VITE_FIREBASE_*` values are **not secrets** — Firebase web config is meant to ship in the
> client bundle. Access is controlled by `firestore.rules`, not by hiding these.

### 3. Deploy the security rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project, alias it "default"
firebase deploy --only firestore:rules
```

`firebase use --add` writes a `.firebaserc` so later commands know which project to target.

### 4. Deploy the app

```bash
npm run build
firebase deploy --only hosting
```

Or `npm run deploy`, which does both. Hosting is already configured in `firebase.json`:
`dist/` is the web root, and all routes rewrite to `index.html` so `/project/:id` links work on
a cold load.

Deploy everything at once with `firebase deploy`.

### Optional: run against the emulator

Local development that costs nothing against your daily quota:

```bash
firebase emulators:start --only auth,firestore
```

Then add `VITE_USE_EMULATOR=true` to `.env` and restart the dev server. The six
`VITE_FIREBASE_*` values still need to be non-empty, but can be dummy strings. Emulator data is
in-memory and disappears when you stop it.

---

## How sharing works

A project is the unit you share. Its URL is `/project/<projectId>` — hit **Share** to copy it
(or open the native share sheet on a phone).

**There are no accounts**, so there is no server-side list of "your" projects. The Home page is
built from project ids kept in `localStorage` on that device. Opening a link adds the project
back to that list, and **Remove from this device** only clears it locally — everyone else keeps
the project. Deleting for real is inside the project's ⋮ menu.

Consequence worth knowing: clear your browser data and the Home page is empty. The projects
still exist; you just need the links again. Keep them somewhere.

### The passcode

A project can carry an optional passcode. Anyone opening the link is asked for it once, and the
unlock is remembered per device.

**This is a soft gate, not security.** The passcode is stored in plaintext on the project
document and compared in the browser, so anyone who knows where to look can read it out of the
network tab. With no real accounts there is nothing to scope a Firestore rule to, and checking a
secret server-side would need a Cloud Function, which means leaving the free plan. It's a
"don't wander in" latch for a trusted group — deliberate, and called out in the code.

Practically: **anyone signed in who has a project id can read and write it.** Treat the link
itself as the credential, and don't put anything sensitive in a list.

---

## Reminders and notifications

Set a reminder on a task and the browser shows a notification when the time arrives — **while
the tab is open**. Permission is requested inline the first time you set one, not on page load.

Close the tab and nothing fires. Reminders in the past are not replayed on your next visit, and
anything more than ~24 days out is only scheduled once you're closer to it.

Real background push would need Firebase Cloud Messaging plus a service worker. FCM itself is
free, but *sending* on a schedule needs a server or a Cloud Function (Blaze plan), so it's out
of scope here. Noted in `src/lib/reminders.js` if you want to pick it up later.

---

## Staying inside the free plan

Spark gives 50K reads, 20K writes and 20K deletes per day.

- **One listener per open project** (its todos), plus one on the project document.
- **Home progress bars use aggregation queries**, which bill per ~1000 index entries scanned
  rather than per document, instead of downloading every todo just to count them.
- **Reordering costs one write.** New positions are the midpoint between the two neighbours
  (`orderBetween` in `src/lib/db.js`), so dragging never rewrites the rest of the list. Repeated
  drops into the same gap eventually exhaust float precision, and `needsRebalance` catches that
  and spreads the values out again — the only case that costs a write per task.
- **Deleting a project deletes its todos in batches** — the client SDK has no recursive delete,
  so without that the todos would linger and count against storage.

---

## Notes on behaviour

- **Live sync.** Changes from other people flash briefly on the card and raise a toast. Your own
  edits don't, which needs a little care: a write containing `serverTimestamp()` lands locally
  with an estimated time and then *again* with the server's real one, and that second snapshot
  looks like someone else's edit unless you track what you have in flight (`src/hooks/useTodos.js`).
- **Dragging is only enabled in manual order with no filters active**, since dropping between two
  rows while others are hidden would write a position relative to neighbours you can't see.
- **Deleting a task offers an Undo** for a few seconds; it restores under the original id.
- The anonymous uid lives in IndexedDB, so you keep the same identity — and ownership of projects
  you created — until you clear site data.

---

## Project layout

```
src/
  lib/          firebase init, Firestore reads/writes, localStorage, reminders, sharing
  hooks/        auth-gated snapshot listeners, debounce, accent colour
  components/   cards, editor, filter bar, modals, and the small UI primitives
  pages/        Home (project list) and ProjectPage (the board)
firestore.rules Field validation; see the comment at the top for the access model
```
