import { AlertTriangle, KeyRound } from 'lucide-react'
import { missingConfigKeys } from '../lib/firebase'
import { useAuth } from '../lib/AuthProvider'

/** Turns the two setup mistakes everyone makes into readable instructions. */
export function ConfigGate({ children }) {
  const { status, error } = useAuth()

  if (missingConfigKeys.length) {
    return (
      <Notice icon={KeyRound} title="Firebase isn't configured yet">
        <p>
          Copy <Code>.env.example</Code> to <Code>.env</Code>, fill in your Firebase web app config,
          and restart <Code>npm run dev</Code>.
        </p>
        <p className="mt-3 font-medium">Missing:</p>
        <ul className="mt-1 space-y-0.5">
          {missingConfigKeys.map((key) => (
            <li key={key}>
              <Code>{key}</Code>
            </li>
          ))}
        </ul>
      </Notice>
    )
  }

  if (status === 'error') {
    const isAuthDisabled = error?.code === 'auth/operation-not-allowed'
    return (
      <Notice icon={AlertTriangle} title="Couldn't sign in">
        {isAuthDisabled ? (
          <p>
            Anonymous sign-in is turned off for this Firebase project. Enable it under{' '}
            <strong>Authentication → Sign-in method → Anonymous</strong>, then reload.
          </p>
        ) : (
          <p>
            {error?.message || 'Unknown error.'} Check that the values in <Code>.env</Code> belong
            to a live Firebase project.
          </p>
        )}
      </Notice>
    )
  }

  return children
}

function Notice({ icon: Icon, title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
          <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{children}</div>
      </div>
    </div>
  )
}

function Code({ children }) {
  return (
    <code className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8em] text-ink-700 dark:bg-white/10 dark:text-ink-200">
      {children}
    </code>
  )
}
