// Custom Kultads logo — stylized "K" with accent dots
export function KultLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kult-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#kult-grad)" />
      <path d="M10 8v16M10 16l8-8M10 16l8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="1.5" fill="white" opacity="0.9" />
      <circle cx="26" cy="12" r="1" fill="white" opacity="0.5" />
    </svg>
  );
}

export function KultLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]" }: { iconSize?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <KultLogoIcon className={`${iconSize}`} />
      <div className="flex items-baseline gap-0.5">
        <span className={`${textSize} font-extrabold tracking-tight text-gray-900`}>Kult</span>
        <span className={`${textSize} font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent`}>ads</span>
      </div>
    </div>
  );
}
