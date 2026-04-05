import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Info, Trophy, Zap } from 'lucide-react';
import TypingGame from '../../components/game/TypingGame';

export default function TypingGamePage() {
  return (
    <div style={{
      padding: '24px', maxWidth: '1200px', margin: '0 auto',
      minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif'
    }}>
      {/* Header section */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 24, gap: 20, flexWrap: 'wrap'
      }}>
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 243, 255, 0.3)'
            }}>
              <Gamepad2 size={24} color="#fff" />
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: '#111827', margin: 0,
              fontFamily: '"Playfair Display", serif'
            }}>
              Nitro Typer: Turbo Divert
            </h1>
          </motion.div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Improve your typing speed and accuracy in a high-octane racing challenge.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
           <div style={{
             display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
             background: '#f5f3ff', borderRadius: 99, border: '1px solid #ddd6fe'
           }}>
             <Zap size={16} color="#7c3aed" />
             <span style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>Hone Your Skills</span>
           </div>
        </div>
      </div>

      {/* Main Game Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TypingGame />
      </motion.div>

      {/* Instructions / Info Footer */}
      <div style={{
        marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24, animation: '_sfu .5s ease .4s both'
      }}>
        <div style={{
          background: '#fff', padding: '20px', borderRadius: 20,
          border: '1px solid #f0eefe', boxShadow: '0 4px 12px rgba(109,40,217,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Info size={20} color="#6d28d9" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>How to Play</h3>
          </div>
          <ul style={{ fontSize: 14, color: '#4b5563', paddingLeft: 20, margin: 0, lineHeight: 1.6 }}>
            <li>Words will appear on cars approaching you.</li>
            <li>Type the word correctly to "divert" the car.</li>
            <li>Each correct word earns points based on length and speed.</li>
            <li>Don't let them reach your position or you loose a life!</li>
            <li>The game speeds up as you level up.</li>
          </ul>
        </div>

        <div style={{
          background: '#fff', padding: '20px', borderRadius: 20,
          border: '1px solid #f0eefe', boxShadow: '0 4px 12px rgba(109,40,217,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Trophy size={20} color="#fbbf24" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Top Rankings</h3>
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Competing with others? Your high score is saved locally on this device.
            Show your teachers and friends your ultimate Nitro speed!
          </p>
          <div style={{
            marginTop: 16, padding: '12px', background: '#fffbeb', borderRadius: 12,
            border: '1px dashed #fcd34d', textAlign: 'center'
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
              COMING SOON: Global School Leaderboard
            </span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes _sfu { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
