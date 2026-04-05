import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Heart, Trophy, Zap, RefreshCcw, ArrowLeft } from 'lucide-react';

// --- Constants & Types ---
const LANES = [-150, 0, 150]; // X positions for 3 lanes
const INITIAL_SPEED = 2;
const SPEED_INCREMENT = 0.2;
const SPAWN_INTERVAL = 2500;
const WORDS = [
  'NITRO', 'TURBO', 'FAST', 'SPEED', 'DRIVE', 'RACE', 'GEAR', 'DRIFT', 
  'ENGINE', 'BOOST', 'VECTOR', 'HYPER', 'CYBER', 'LIGHT', 'SONIC',
  'PYTHON', 'REACT', 'CODE', 'LOGIC', 'PIXEL', 'CLOUD', 'DATA', 'FLOW',
  'SMART', 'LEARN', 'BRAIN', 'STUDY', 'UNI', 'WORLD', 'GLOBAL', 'GOAL'
];

interface Car {
  id: string;
  word: string;
  lane: number;
  y: number;
  speed: number;
  isDiverted: boolean;
}

export default function TypingGame() {
  // --- State ---
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [cars, setCars] = useState<Car[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(3);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('typing_high_score') || 0));

  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Game Functions ---
  const spawnCar = useCallback(() => {
    const laneIndex = Math.floor(Math.random() * LANES.length);
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const newCar: Car = {
      id: Math.random().toString(36).substr(2, 9),
      word,
      lane: LANES[laneIndex],
      y: -100, // Start above screen
      speed: INITIAL_SPEED + (level - 1) * SPEED_INCREMENT,
      isDiverted: false,
    };
    setCars(prev => [...prev, newCar]);
  }, [level]);

  const startGame = () => {
    setGameState('playing');
    setCars([]);
    setScore(0);
    setLevel(1);
    setHealth(3);
    setCombo(0);
    setCurrentInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const gameOver = () => {
    setGameState('gameover');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('typing_high_score', score.toString());
    }
  };

  // --- Input Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCurrentInput(val);

    // Check if input matches any car's word
    const targetCar = cars.find(c => c.word === val && !c.isDiverted && c.y > -50);
    if (targetCar) {
      setCars(prev => prev.map(c => 
        c.id === targetCar.id ? { ...c, isDiverted: true } : c
      ));
      setScore(prev => prev + (10 * level) + (combo * 2));
      setCombo(prev => prev + 1);
      setCurrentInput('');
      
      // Level up every 10 cars
      if ((score + 10) % 100 === 0) {
        setLevel(prev => prev + 1);
      }
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = (time: number) => {
      // Spawning
      if (time - lastSpawnRef.current > SPAWN_INTERVAL / (1 + level * 0.1)) {
        spawnCar();
        lastSpawnRef.current = time;
      }

      // Movement & Collision
      setCars(prev => {
        const nextCars = prev.map(car => ({
          ...car,
          y: car.isDiverted ? car.y + car.speed * 2 : car.y + car.speed,
          lane: car.isDiverted ? car.lane + (car.lane < 0 ? -10 : 10) : car.lane
        }));

        // Check for missed cars (reach bottom)
        const activeCars = nextCars.filter(car => {
          if (!car.isDiverted && car.y > 600) {
            setHealth(h => {
              const nextH = h - 1;
              if (nextH <= 0) gameOver();
              return nextH;
            });
            setCombo(0);
            return false;
          }
          return car.y < 800; // Remove far off cars
        });

        return activeCars;
      });

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, level, spawnCar]);

  // --- UI Components ---
  return (
    <div style={{
      width: '100%', height: 'calc(100vh - 120px)', minHeight: 600,
      background: '#0a0a1f', borderRadius: 24, overflow: 'hidden',
      position: 'relative', display: 'flex', flexDirection: 'column',
      fontFamily: '"DM Sans", system-ui, sans-serif', color: '#fff',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Background Grid / Road */}
      <div style={{
        position: 'absolute', inset: 0, 
        background: 'radial-gradient(circle at 50% 100%, #1a1a4b 0%, #0a0a1f 70%)',
        perspective: '500px', pointerEvents: 'none'
      }}>
        {/* Animated Road Lines */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) rotateX(60deg)',
          width: 600, height: '1000px', display: 'flex', justifyContent: 'center'
        }}>
          {[-1, 0, 1].map(lane => (
            <div key={lane} style={{
              width: 150, height: '100%', borderLeft: '2px dashed rgba(0, 243, 255, 0.2)',
              borderRight: '2px dashed rgba(0, 243, 255, 0.2)', position: 'relative'
            }}>
              {/* Perspective lanes */}
            </div>
          ))}
        </div>
      </div>

      {/* --- HUD --- */}
      <div style={{
        position: 'relative', zIndex: 10, padding: '24px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(10,10,31,0.8), transparent)'
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00f3ff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Score</div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace' }}>{score.toString().padStart(6, '0')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ff00ff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Level</div>
            <div style={{ fontSize: 24, fontWeight: 900, textAlign: 'center' }}>{level}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: i < health ? 1 : 0.2, scale: i < health ? 1 : 0.8 }}
            >
              <Heart fill={i < health ? "#ff0066" : "transparent"} color={i < health ? "#ff0066" : "#444"} size={24} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- Game Canvas / Arena --- */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence>
          {gameState === 'playing' && cars.map(car => (
            <motion.div
              key={car.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                x: car.lane, 
                y: car.y, 
                scale: 1, 
                opacity: car.isDiverted ? 0 : 1,
                rotateY: car.isDiverted ? (car.lane < 0 ? -45 : 45) : 0
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute', top: 0, left: '50%', marginLeft: -40,
                width: 80, height: 120, display: 'flex', flexDirection: 'column',
                alignItems: 'center', zIndex: 5
              }}
            >
              {/* The Car Body */}
              <div style={{
                width: 50, height: 80, background: car.isDiverted ? '#444' : '#00f3ff',
                borderRadius: '12px 12px 20px 20px', position: 'relative',
                boxShadow: car.isDiverted ? 'none' : '0 0 20px rgba(0,243,255,0.5)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                {/* Windshield */}
                <div style={{ position: 'absolute', top: 10, left: 5, right: 5, height: 15, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
                {/* Highlights */}
                <div style={{ position: 'absolute', bottom: 5, left: '50%', width: 20, height: 4, background: '#ff00ff', borderRadius: 2, marginLeft: -10 }} />
              </div>

              {/* Word Tag */}
              <div style={{
                marginTop: 8, padding: '4px 12px', background: 'rgba(0,0,0,0.8)',
                borderRadius: 99, border: '1px solid #00f3ff',
                boxShadow: '0 0 10px rgba(0,243,255,0.3)',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  {car.word}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* --- Menus --- */}
        <AnimatePresence>
          {gameState === 'menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', zIndex: 100,
                background: 'rgba(10,10,31,0.9)', backdropFilter: 'blur(10px)'
              }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: 48, fontWeight: 900, letterSpacing: '0.2em', textAlign: 'center', color: '#00f3ff', textShadow: '0 0 20px #00f3ff' }}
              >
                NITRO TYPER
              </motion.div>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14 }}>Divert the cars before they clash!</p>
              
              <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
                <button
                  onClick={startGame}
                  style={{
                    padding: '16px 32px', borderRadius: 16, background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
                    border: 'none', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0, 243, 255, 0.4)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  START ENGINE
                </button>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  High Score: {highScore.toString().padStart(6, '0')}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', zIndex: 100,
                background: 'rgba(255, 0, 102, 0.15)', backdropFilter: 'blur(15px)'
              }}
            >
              <Trophy size={64} color="#ffcc00" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', textAlign: 'center' }}>TOTAL CLASH!</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#00f3ff', marginTop: 8 }}>Score: {score}</div>
              
              <button
                onClick={startGame}
                style={{
                  marginTop: 32, padding: '16px 40px', borderRadius: 16, background: '#fff',
                  border: 'none', color: '#ff0066', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <RefreshCcw size={20} /> TRY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Input Bar --- */}
      <div style={{
        padding: '24px 32px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            disabled={gameState !== 'playing'}
            placeholder={gameState === 'playing' ? "TYPE TO DIVERT..." : "WAITING..."}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(0, 243, 255, 0.3)', color: '#fff', fontSize: 18,
              textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.2em', outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            width: '80%', height: 2, background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
            boxShadow: '0 0 15px #00f3ff'
          }} />
        </div>
      </div>
    </div>
  );
}
