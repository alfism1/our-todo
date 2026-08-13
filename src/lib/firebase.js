import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Keyed by env var name so <ConfigGate> can name the exact lines to fill in.
const ENV_KEYS = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
}

const config = Object.fromEntries(
  Object.entries(ENV_KEYS).map(([envKey, configKey]) => [configKey, import.meta.env[envKey]]),
)

// Surfaced by <ConfigGate> so a missing .env shows setup instructions
// instead of an opaque Firebase SDK crash.
export const missingConfigKeys = Object.keys(ENV_KEYS).filter(
  (envKey) => !import.meta.env[envKey],
)

export const isConfigured = missingConfigKeys.length === 0

const app = isConfigured ? initializeApp(config) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

// Opt-in local development against `firebase emulators:start`, so iterating
// never touches the real project's daily read/write allowance.
if (app && import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

/**
 * Resolves with the anonymous uid. Firebase persists the anon account in
 * IndexedDB, so a returning visitor keeps the same uid (and therefore keeps
 * ownership of projects they created) until they clear site data.
 */
export function ensureAnonymousUser() {
  if (!auth) return Promise.reject(new Error('Firebase is not configured'))

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub()
          resolve(user)
          return
        }
        signInAnonymously(auth).catch((err) => {
          unsub()
          reject(err)
        })
      },
      (err) => {
        unsub()
        reject(err)
      },
    )
  })
}
