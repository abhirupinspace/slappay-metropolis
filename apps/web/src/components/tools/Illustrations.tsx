"use client";

import { motion } from "motion/react";

/** Flat, two-tone marks in the brand palette. Each one animates on parent hover (group). */

export function SwapArrows() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <motion.g className="transition-transform duration-500 group-hover:-translate-x-1">
        <path d="M18 44h78V22l44 32-44 32V64H18z" fill="#c9f76b" />
        <path d="M18 44h78V22l44 32H18z" fill="#a9e04e" />
      </motion.g>
      <g className="transition-transform duration-500 group-hover:translate-x-1">
        <path d="M142 78H64v22L20 68l44-32v22h78z" fill="#c9f76b" opacity="0.9" />
        <path d="M142 78H64v22L20 68h122z" fill="#a9e04e" opacity="0.9" />
      </g>
    </svg>
  );
}

export function CoinStack() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="transition-transform duration-500 group-hover:-translate-y-1" style={{ transitionDelay: `${i * 40}ms` }}>
          <ellipse cx="80" cy={96 - i * 16} rx="46" ry="12" fill="#1b4d2c" />
          <path d={`M34 ${84 - i * 16}c0 6.6 20.6 12 46 12s46-5.4 46-12v8c0 6.6-20.6 12-46 12s-46-5.4-46-12z`} fill="#143a21" />
          <ellipse cx="80" cy={84 - i * 16} rx="46" ry="12" fill="#2a6a3d" />
        </g>
      ))}
      <ellipse cx="80" cy="36" rx="46" ry="12" fill="#c9f76b" />
      <text x="80" y="41" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1b4d2c">USDC</text>
    </svg>
  );
}

export function Candles() {
  const bars = [
    { x: 24, o: 70, c: 50, h: 44, l: 78, up: true },
    { x: 48, o: 50, c: 62, h: 46, l: 70, up: false },
    { x: 72, o: 62, c: 36, h: 30, l: 66, up: true },
    { x: 96, o: 36, c: 44, h: 30, l: 52, up: false },
    { x: 120, o: 44, c: 22, h: 16, l: 48, up: true },
  ];
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <path d="M12 100h136" stroke="#121412" strokeOpacity="0.1" />
      {bars.map((b, i) => (
        <g key={b.x} className="origin-bottom transition-transform duration-500 group-hover:scale-y-105" style={{ transitionDelay: `${i * 40}ms` }}>
          <path d={`M${b.x + 6} ${b.h}v${b.l - b.h}`} stroke={b.up ? "#1b4d2c" : "#ff6a1f"} strokeWidth="2" />
          <rect x={b.x} y={Math.min(b.o, b.c)} width="12" height={Math.abs(b.o - b.c)} rx="2" fill={b.up ? "#1b4d2c" : "#ff6a1f"} />
        </g>
      ))}
    </svg>
  );
}

export function StatusPills() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <g className="transition-transform duration-500 group-hover:-translate-y-1">
        <rect x="22" y="26" width="116" height="34" rx="17" fill="#ff6a1f" />
        <rect x="22" y="20" width="116" height="34" rx="17" fill="#ffb088" />
        <text x="80" y="42" textAnchor="middle" fontSize="15" fontWeight="800" fill="#121412">402 Payment</text>
      </g>
      <g className="transition-transform duration-500 group-hover:translate-y-1">
        <rect x="22" y="76" width="116" height="34" rx="17" fill="#1b4d2c" />
        <rect x="22" y="70" width="116" height="34" rx="17" fill="#c9f76b" />
        <text x="80" y="92" textAnchor="middle" fontSize="15" fontWeight="800" fill="#121412">200 OK</text>
      </g>
    </svg>
  );
}
