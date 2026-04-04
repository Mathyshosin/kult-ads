import Image from "next/image";

// Loopad logo — custom designed logo
export function LoopadLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Loopad"
      width={36}
      height={36}
      className={`rounded-lg ${className || ""}`}
      priority
    />
  );
}

export function LoopadLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]" }: { iconSize?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Loopad"
        width={36}
        height={36}
        className={`rounded-lg ${iconSize}`}
        priority
      />
      <div className="flex items-baseline">
        <span className={`${textSize} font-black tracking-tight text-gray-900`}>L</span>
        <span className={`${textSize} font-black tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent`}>∞</span>
        <span className={`${textSize} font-black tracking-tight text-gray-900`}>p</span>
        <span className={`${textSize} font-black tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent`}>ad</span>
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const AdlyLogoIcon = LoopadLogoIcon;
export const AdlyLogoFull = LoopadLogoFull;
export const KultadsLogoIcon = LoopadLogoIcon;
export const KultadsLogoFull = LoopadLogoFull;
