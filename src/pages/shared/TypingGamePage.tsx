import TypingGame from '../../components/game/TypingGame';

export default function TypingGamePage() {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '1300px',
      margin: '0 auto',
      minHeight: '100vh',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      {/* Minimal header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          boxShadow: '0 4px 16px rgba(0,243,255,0.35)',
          flexShrink: 0,
        }}>🏎️</div>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: '#111827', margin: 0,
            fontFamily: '"Playfair Display", serif',
          }}>Nitro Typer</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            Type enemy words to destroy them · Chain combos · Survive all waves
          </p>
        </div>
      </div>

      {/* Game */}
      <TypingGame />
    </div>
  );
}
