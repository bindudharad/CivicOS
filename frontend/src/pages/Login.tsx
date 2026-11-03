import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Login failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  return (
    <div className="min-h-screen bg-bg-main grid-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 items-center justify-center mb-4 glow-cyan">
            <span className="text-2xl font-black text-accent-cyan">C</span>
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            CIVIC<span className="text-accent-cyan">OS</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">Urban Intelligence Command Center</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Sign in</h2>
          <p className="text-sm text-text-muted mb-6">Access your command dashboard</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-status-critical/10 border border-status-critical/30 text-status-critical text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted input-focus"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-surface-elevated border border-border-standard rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted input-focus"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-cyan text-bg-main font-semibold rounded-lg hover:bg-accent-deep-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-bg-main border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-border-subtle">
            <p className="text-xs text-text-muted text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', user: 'phase8_admin', note: 'Full access' },
                { label: 'Viewer', user: 'phase8_viewer', note: 'Read only' },
              ].map(c => (
                <button
                  key={c.user}
                  type="button"
                  onClick={() => { setUsername(c.user); setPassword('Phase8AdminSecure123!') }}
                  className="px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle hover:border-border-standard text-left transition-colors"
                >
                  <div className="text-xs font-medium text-text-secondary">{c.label}</div>
                  <div className="text-xs text-text-muted font-mono">{c.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          CivicOS v8.0 · Bengaluru Urban Intelligence Platform
        </p>
      </div>
    </div>
  )
}
