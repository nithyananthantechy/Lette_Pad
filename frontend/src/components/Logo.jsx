// src/components/Logo.jsx — Unique LeadPad AI / மடலகம் AI Emblem Logo
import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 32 : 40;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Insignia SVG */}
      <div className="relative flex-shrink-0">
        <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className="drop-shadow-md">
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a"/>
              <stop offset="50%" stopColor="#1e1b4b"/>
              <stop offset="100%" stopColor="#090d16"/>
            </linearGradient>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a"/>
              <stop offset="50%" stopColor="#eab308"/>
              <stop offset="100%" stopColor="#ca8a04"/>
            </linearGradient>
            <linearGradient id="logoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="100%" stopColor="#2563eb"/>
            </linearGradient>
          </defs>

          {/* Shield Base */}
          <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoBg)" stroke="url(#logoGold)" strokeWidth="2"/>
          
          {/* Temple Gopuram & Pillar Geometric Line */}
          <path d="M22 46 L24 24 L32 14 L40 24 L42 46 Z" fill="none" stroke="url(#logoGold)" strokeWidth="1.8" strokeLinejoin="round" opacity="0.65"/>
          <path d="M20 46 L44 46" stroke="url(#logoGold)" strokeWidth="2" strokeLinecap="round"/>
          
          {/* AI Quill / Leadership Star Crest */}
          <path d="M32 12 L35 22 L45 25 L37 32 L39 42 L32 37 L25 42 L27 32 L19 25 L29 22 Z" fill="url(#logoGold)" opacity="0.95"/>
          <circle cx="32" cy="27" r="4.5" fill="url(#logoCyan)"/>
          <circle cx="16" cy="18" r="1.5" fill="#38bdf8"/>
          <circle cx="48" cy="18" r="1.5" fill="#38bdf8"/>
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-white text-base leading-tight font-sans">
            LeadPad <span className="text-amber-400">AI</span>
          </span>
          <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-md tracking-wider">
            மடலகம்
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400 font-tamil leading-tight tracking-normal">
          அரசியல் &amp; மக்கள் பிரதிநிதிகளுக்கான AI தளம்
        </span>
      </div>
    </div>
  );
};

export default Logo;
