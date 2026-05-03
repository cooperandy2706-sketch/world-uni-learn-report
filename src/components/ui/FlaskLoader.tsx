// src/components/ui/FlaskLoader.tsx
import React from 'react';

interface FlaskLoaderProps {
  fullScreen?: boolean;
  label?: string;
}

export default function FlaskLoader({ fullScreen = true, label }: FlaskLoaderProps) {
  const wrapper: React.CSSProperties = fullScreen
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f7ff', gap: 24 }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 20 };

  return (
    <div style={wrapper}>
      <style>{`
        /*
         * FIX: liquid fill groups now use translateY to move the entire
         * liquid rectangle UP inside the clipped flask shape.
         * translateY(0)  = liquid at very bottom (flask empty)
         * translateY(-N) = liquid risen by N px (flask filling up)
         *
         * The wave-front / wave-back only scroll horizontally to create
         * the wavy surface — they do NOT move the fill up/down.
         * The vertical movement is ONLY on the liquid group wrappers.
         */

        /* Left flask: starts low (translateY 0 = bottom), fills up to -50px */
        @keyframes left-fill {
          0%, 10%   { transform: translateY(0px); }
          45%, 55%  { transform: translateY(-50px); }
          90%, 100% { transform: translateY(0px); }
        }

        /* Right beaker: starts low, fills a bit */
        @keyframes right-fill {
          0%, 10%   { transform: translateY(0px); }
          45%, 55%  { transform: translateY(-40px); }
          90%, 100% { transform: translateY(0px); }
        }

        /* Horizontal wave scrolling — surface texture only, no vertical movement */
        @keyframes wave-front {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-80px); }
        }
        @keyframes wave-back {
          0%   { transform: translateX(-40px); }
          100% { transform: translateX(-120px); }
        }

        @keyframes boil {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
        }
        @keyframes gentle-bubble {
          0%   { transform: translateY(0); opacity: 0; }
          50%  { opacity: 0.6; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes tube-flow {
          0%, 10%   { opacity: 0; }
          15%, 45%  { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes fast-flow {
          to { stroke-dashoffset: -32; }
        }
        @keyframes flicker {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          50%      { transform: scaleY(1.2); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 8px 16px rgba(139, 92, 246, 0.15)); }
          50%      { filter: drop-shadow(0 12px 24px rgba(139, 92, 246, 0.4)); }
        }

        /* Apply fill animations to the liquid group wrappers */
        .left-liquid-group  { animation: left-fill  4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .right-liquid-group { animation: right-fill 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

        /* Wave animations applied only to the wave path elements */
        .wula-wave-front { animation: wave-front 1.5s linear infinite; }
        .wula-wave-back  { animation: wave-back  2s   linear infinite; }

        .b-fast-1 { animation: boil 0.6s ease-in         infinite; }
        .b-fast-2 { animation: boil 0.8s ease-in 0.2s    infinite; }
        .b-fast-3 { animation: boil 0.5s ease-in 0.4s    infinite; }
        .b-fast-4 { animation: boil 0.7s ease-in 0.1s    infinite; }

        .b-slow-1 { animation: gentle-bubble 2s   ease-in      infinite; }
        .b-slow-2 { animation: gentle-bubble 2.5s ease-in 1s   infinite; }

        .tube-drops-wrap { animation: tube-flow  4s   ease    infinite; }
        .tube-drops      { stroke-dasharray: 6 10; animation: fast-flow 0.4s linear infinite; }

        .flame           { animation: flicker    0.15s ease-in-out infinite alternate; transform-origin: center bottom; }
        .wula-loader-svg { animation: glow-pulse 3s   ease-in-out   infinite; overflow: visible; }
      `}</style>

      <svg
        className="wula-loader-svg"
        width="160"
        height="130"
        viewBox="0 0 160 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Flask and beaker outlines — used for clipping AND border drawing */}
          <path id="app-l" d="M 35,25 L 35,55 L 10,100 Q 5,105 15,105 L 75,105 Q 85,105 80,100 L 55,55 L 55,25 Z" />
          <path id="app-r" d="M 95,55 L 95,100 Q 95,105 100,105 L 130,105 Q 135,105 135,100 L 135,55 Z" />

          <clipPath id="clip-l"><use href="#app-l" /></clipPath>
          <clipPath id="clip-r"><use href="#app-r" /></clipPath>

          {/* Green liquid gradients for left flask */}
          <linearGradient id="grad-l-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="grad-l-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bef264" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.8" />
          </linearGradient>

          {/* Blue liquid gradients for right beaker */}
          <linearGradient id="grad-r-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="grad-r-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* ── CONNECTING TUBE ── */}
        <path d="M 45,45 L 45,10 Q 45,0 55,0 L 105,0 Q 115,0 115,10 L 115,50"
          fill="none" stroke="#cbd5e1" strokeWidth="6" />
        <path d="M 45,45 L 45,10 Q 45,0 55,0 L 105,0 Q 115,0 115,10 L 115,50"
          fill="none" stroke="#f8fafc" strokeWidth="2" />

        {/* Animated flow drops through tube */}
        <g className="tube-drops-wrap">
          <path d="M 45,45 L 45,10 Q 45,0 55,0 L 105,0 Q 115,0 115,10 L 115,50"
            fill="none" stroke="#0ea5e9" strokeWidth="2" className="tube-drops" />
        </g>

        {/* ── LEFT FLASK STOPPER ── */}
        <path d="M 31,20 L 59,20 L 57,28 L 33,28 Z" fill="#64748b" />
        <path d="M 31,20 L 59,20 L 59,23 L 31,23 Z" fill="#475569" />

        {/* ── LEFT FLASK LIQUID ──
             The group starts at translateY(0) so the liquid rect sits
             at the BOTTOM of the flask. The keyframe moves it upward
             (negative Y = up) to simulate the flask filling.
             The rect must be tall enough so translateY(-50) still fills
             the bottom — rect starts at y=55 with height=60 → bottom at 115,
             well below the flask bottom (105). When we translate up by 50px
             the rect top moves to y=5, still covering the full flask interior.
        -->*/}
        <g clipPath="url(#clip-l)">
          <g className="left-liquid-group">
            {/*
              The liquid body: a tall rect anchored at the flask bottom.
              The wavy surface sits at the top of this rect.
              We translate the whole group UP to fill the flask.
            */}
            {/* Back (lighter) wave surface */}
            <g className="wula-wave-back">
              <path
                d="M -40,0 Q -20,-5 0,0 T 40,0 T 80,0 T 120,0 T 160,0 L 160,60 L -40,60 Z"
                fill="url(#grad-l-back)"
                transform="translate(0, 55)"
              />
            </g>
            {/* Front (darker) wave surface — scrolls at different speed */}
            <g className="wula-wave-front">
              <path
                d="M -40,0 Q -20,5 0,0 T 40,0 T 80,0 T 120,0 T 160,0 L 160,60 L -40,60 Z"
                fill="url(#grad-l-front)"
                transform="translate(0, 55)"
              />
            </g>
            {/* Solid fill block below the waves so there's no gap at the bottom */}
            <rect x="-40" y="60" width="200" height="60" fill="url(#grad-l-front)" transform="translate(0, 55)" />
            {/* Boiling bubbles — positioned relative to the liquid surface */}
            <circle cx="35" cy="70" r="2" fill="#fff" className="b-fast-1" />
            <circle cx="45" cy="80" r="3" fill="#fff" className="b-fast-2" />
            <circle cx="55" cy="65" r="1.5" fill="#fff" className="b-fast-3" />
            <circle cx="25" cy="75" r="2.5" fill="#fff" className="b-fast-4" />
          </g>
        </g>

        {/* Left flask glass outline + markings */}
        <use href="#app-l" fill="rgba(255,255,255,0.1)" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="45" cy="25" rx="12.5" ry="3.5" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
        {/* Shine highlight */}
        <path d="M 16,95 L 38,58 L 38,34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        {/* Measurement lines */}
        <line x1="55" y1="45" x2="60" y2="45" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="55" y1="53" x2="58" y2="53" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="68" y1="65" x2="71" y2="65" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── RIGHT BEAKER LIQUID ──
             Same principle: rect anchored at beaker bottom (y=55, height=55 → bottom at 110),
             translated upward by the keyframe to simulate filling.
        */}
        <g clipPath="url(#clip-r)">
          <g className="right-liquid-group">
            <g className="wula-wave-back">
              <path
                d="M -40,0 Q -20,-5 0,0 T 40,0 T 80,0 T 120,0 T 160,0 L 160,55 L -40,55 Z"
                fill="url(#grad-r-back)"
                transform="translate(0, 55)"
              />
            </g>
            <g className="wula-wave-front">
              <path
                d="M -40,0 Q -20,5 0,0 T 40,0 T 80,0 T 120,0 T 160,0 L 160,55 L -40,55 Z"
                fill="url(#grad-r-front)"
                transform="translate(0, 55)"
              />
            </g>
            {/* Solid fill below the wave surface */}
            <rect x="-40" y="60" width="200" height="55" fill="url(#grad-r-front)" transform="translate(0, 55)" />
            {/* Gentle bubbles in the receiving beaker */}
            <circle cx="110" cy="70" r="1.5" fill="#fff" className="b-slow-1" />
            <circle cx="120" cy="75" r="2" fill="#fff" className="b-slow-2" />
          </g>
        </g>

        {/* Right beaker glass outline + markings */}
        <use href="#app-r" fill="rgba(255,255,255,0.1)" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="115" cy="55" rx="20" ry="4" fill="rgba(255,255,255,0.4)" stroke="#a78bfa" strokeWidth="2.5" />
        {/* Shine highlight */}
        <path d="M 100,98 L 100,65" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        {/* Measurement lines */}
        <line x1="135" y1="65" x2="140" y2="65" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="135" y1="75" x2="138" y2="75" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="135" y1="85" x2="140" y2="85" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="135" y1="95" x2="138" y2="95" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── TABLE LINE & BUNSEN BURNER ── */}
        <line x1="0" y1="106" x2="160" y2="106" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

        <g transform="translate(45, 110)">
          <rect x="-8" y="2" width="16" height="4" rx="2" fill="#94a3b8" />
          <rect x="-3" y="-2" width="6" height="4" fill="#cbd5e1" />
          <g className="flame">
            <path d="M 0,-2 Q 5,-8 0,-14 Q -5,-8 0,-2 Z" fill="#0ea5e9" opacity="0.8" />
            <path d="M 0,-2 Q 2.5,-5 0,-8 Q -2.5,-5 0,-2 Z" fill="#fff" opacity="0.9" />
          </g>
        </g>
      </svg>

      <p style={{
        fontSize: 14, fontWeight: 700, color: '#6d28d9',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        opacity: 0.8, margin: 0
      }}>
        {label ?? 'Loading...'}
      </p>
    </div>
  );
}