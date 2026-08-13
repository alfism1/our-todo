import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/AuthProvider'
import { ThemeProvider, useTheme } from './lib/ThemeProvider'
import { ConfigGate } from './components/ConfigGate'
import { Home } from './pages/Home'
import { ProjectPage } from './pages/ProjectPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfigGate>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/project/:projectId" element={<ProjectPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfigGate>
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

function ThemedToaster() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 2600,
        style: {
          background: dark ? '#3a404f' : '#ffffff',
          color: dark ? '#eceef2' : '#181b23',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#eceef2'}`,
          borderRadius: '14px',
          boxShadow: '0 2px 4px rgb(16 18 24 / 0.06), 0 12px 32px -8px rgb(16 18 24 / 0.16)',
          fontSize: '14px',
          padding: '10px 14px',
        },
        success: { iconTheme: { primary: 'rgb(var(--accent-rgb))', secondary: '#fff' } },
      }}
    />
  )
}
