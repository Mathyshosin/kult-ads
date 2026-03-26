// Kultads logo — elegant infinity ribbon
export function KultLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kg-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="kg-inf" x1="8" y1="14" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#E0D4FF" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#kg-bg)" />
      {/* Elegant thick infinity — two perfect loops */}
      <g transform="translate(18, 18)">
        <path
          d="M-5.5 0C-5.5-3 -3.5-5 -1-5C1.2-5 2.8-3.5 3.5-2L4.5 0L3.5 2C2.8 3.5 1.2 5 -1 5C-3.5 5 -5.5 3 -5.5 0Z"
          fill="url(#kg-inf)"
          opacity="0.95"
        />
        <path
          d="M5.5 0C5.5 3 3.5 5 1 5C-1.2 5 -2.8 3.5 -3.5 2L-4.5 0L-3.5-2C-2.8-3.5 -1.2-5 1-5C3.5-5 5.5-3 5.5 0Z"
          fill="white"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

export function KultLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]" }: { iconSize?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <KultLogoIcon className={iconSize} />
      <div className="flex items-baseline">
        <span className={`${textSize} font-black tracking-tight text-gray-900`}>kult</span>
        <span className={`${textSize} font-black tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent`}>ads</span>
      </div>
    </div>
  );
}
