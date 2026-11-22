import React from 'react';

/**
 * KavachLogo - Precision Geometric Brand Mark
 * 
 * Inspired by ourkavach.com brand heritage:
 * - Geometric faceted armor shield ("Kavach")
 * - Dynamic interlocking plates outlining the letter "K"
 * - Safety Saffron (#FF7A00) accent with Obsidian & Pure White geometry
 */
export const KavachLogo = ({
  size = 32,
  className = '',
  variant = 'full', // 'mark' | 'full' | 'monochrome'
  accentColor = '#FF7A00',
  textColor = 'currentColor',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric SVG Shield Mark */}
      <svg
        width={size}
        height={Math.round(size * 1.12)}
        viewBox="0 0 100 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="kavachOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA14D" />
            <stop offset="45%" stopColor={accentColor} />
            <stop offset="100%" stopColor="#D95F00" />
          </linearGradient>
        </defs>

        {/* Left Protective Pillar Plate (Shield Flank & Stem of 'K') */}
        <path
          d="M16 28 L32 25 L32 76 L16 63 Z"
          fill="currentColor"
          className="transition-colors"
        />

        {/* Upper Center Crest Facet */}
        <path
          d="M37 24 L50 19 L63 24 L37 49 Z"
          fill="currentColor"
          fillOpacity="0.95"
        />

        {/* Dynamic Saffron Diagonal Blade (Spine of 'K') */}
        <path
          d="M18 69 L67 24 L82 30 L32 81 Z"
          fill={variant === 'monochrome' ? 'currentColor' : 'url(#kavachOrangeGrad)'}
        />

        {/* Lower Saffron Kick (Lower Leg of 'K') */}
        <path
          d="M48 67 L59 57 L76 75 L65 85 Z"
          fill={variant === 'monochrome' ? 'currentColor' : 'url(#kavachOrangeGrad)'}
        />

        {/* Right Shield Flank Plate */}
        <path
          d="M68 44 L84 32 L84 68 L70 81 Z"
          fill="currentColor"
          fillOpacity="0.95"
        />

        {/* Bottom Shield Apex Plate */}
        <path
          d="M28 85 L50 105 L66 90 L48 76 Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
      </svg>

      {/* Optional Wordmark */}
      {variant === 'full' && (
        <span
          className="text-lg font-black tracking-tight uppercase"
          style={{ color: textColor }}
        >
          Kavach
        </span>
      )}
    </div>
  );
};

export default KavachLogo;
