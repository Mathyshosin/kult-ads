// Kultads logo — modern infinity with 3D depth effect
export function KultLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kl-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="kl-left" x1="8" y1="14" x2="20" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="kl-right" x1="20" y1="14" x2="32" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9E3FF" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {/* Smooth rounded square */}
      <rect width="40" height="40" rx="11" fill="url(#kl-bg)" />

      {/* Back loop (right side) — drawn first, goes behind */}
      <path
        d="M20 17.5C21.5 15 23.5 13.5 26 13.5C29 13.5 31.5 16 31.5 20C31.5 24 29 26.5 26 26.5C23.5 26.5 21.5 25 20 22.5"
        stroke="url(#kl-right)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Front loop (left side) — drawn on top with crossing effect */}
      <path
        d="M20 22.5C18.5 25 16.5 26.5 14 26.5C11 26.5 8.5 24 8.5 20C8.5 16 11 13.5 14 13.5C16.5 13.5 18.5 15 20 17.5"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Center crossing — white line on top for depth */}
      <line x1="18.5" y1="22" x2="21.5" y2="18" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
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
