// Kultads logo — stylized infinity ∞ with inner spark
export function KultLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#kg1)" />
      {/* Clean centered infinity ∞ */}
      <path
        d="M13 18c0-1.65 1.35-3 3-3 1.2 0 2.1.7 2.5 1.5L18 18l.5 1.5c.4.8 1.3 1.5 2.5 1.5 1.65 0 3-1.35 3-3s-1.35-3-3-3c-1.2 0-2.1.7-2.5 1.5L18 18l-.5-1.5C17.1 15.7 16.2 15 15 15c-1.65 0-3 1.35-3 3s1.35 3 3 3c1.2 0 2.1-.7 2.5-1.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small spark dot at center crossing */}
      <circle cx="18" cy="18" r="1.2" fill="white" opacity="0.9" />
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
