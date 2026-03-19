// Kultads logo — stacked ad layers with lightning bolt
export function KultLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="kg2" x1="12" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#kg1)" />
      <rect x="8" y="10" width="13" height="17" rx="3" fill="url(#kg2)" opacity="0.35" />
      <rect x="14" y="7" width="13" height="17" rx="3" fill="url(#kg2)" opacity="0.65" />
      <path d="M22 12l-3 5.5h4l-3 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
