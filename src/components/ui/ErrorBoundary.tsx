// src/components/ui/ErrorBoundary.tsx
// Global error boundary – prevents a single widget crash from wiping out
// the entire UI. Wrap any subtree (or the whole app) with this component.
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional custom fallback. If omitted, uses the built-in error screen. */
  fallback?: ReactNode
  /** Optional callback to log errors to your monitoring service. */
  onError?: (error: Error, info: { componentStack: string }) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Acadera ErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}

// ── Built-in fallback UI ──────────────────────────────────────────────────────
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)',
      padding: '24px',
    }}>
      <style>{`
        @keyframes _eb_shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes _eb_fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ._eb_card { animation: _eb_fadeIn 0.4s ease both; }
        ._eb_icon { animation: _eb_shake 0.5s ease 0.3s both; }
        ._eb_btn:hover { background: #5b21b6 !important; }
        ._eb_retry:hover { background: #f5f3ff !important; }
      `}</style>

      <div className="_eb_card" style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 8px 48px rgba(109,40,217,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1.5px solid #ede9fe',
        textAlign: 'center',
      }}>
        <div className="_eb_icon" style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>

        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#1e1b4b',
          margin: '0 0 8px',
          fontFamily: '"Playfair Display", serif',
        }}>
          Something went wrong
        </h2>

        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
          A part of the page crashed unexpectedly. Your data is safe — this
          section just needs a refresh.
        </p>

        {error && (
          <details style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 24,
            textAlign: 'left',
            cursor: 'pointer',
          }}>
            <summary style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>
              Error details (for support)
            </summary>
            <pre style={{
              fontSize: 11,
              color: '#7f1d1d',
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}>
              {error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="_eb_btn"
            onClick={onReset}
            style={{
              padding: '11px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            🔄 Try Again
          </button>
          <button
            className="_eb_retry"
            onClick={() => window.location.reload()}
            style={{
              padding: '11px 24px',
              borderRadius: 10,
              border: '1.5px solid #ede9fe',
              background: '#fff',
              color: '#6d28d9',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            ↺ Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}
