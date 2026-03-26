// Kultads logo — infinity symbol (∞) = infinite ad generation
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
      {/* Infinity symbol ∞ — thick, rounded, slightly tilted for dynamism */}
      <path
        d="M11.5 18c0-2.5 2-4.5 4.5-4.5 1.8 0 3.2 1 4 2.5l0.5 0.9 0.5-0.9c0.8-1.5 2.2-2.5 4-2.5 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5c-1.8 0-3.2-1-4-2.5l-0.5-0.9-0.5 0.9c-0.8 1.5-2.2 2.5-4 2.5-2.5 0-4.5-2-4.5-4.5z"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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
