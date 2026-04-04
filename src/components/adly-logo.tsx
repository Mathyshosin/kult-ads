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

export function LoopadLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]", dark = false }: { iconSize?: string; textSize?: string; dark?: boolean }) {
  const textColor = dark ? "text-white" : "text-gray-900";
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
        <span className={`${textSize} font-black tracking-tight ${textColor}`}>L</span>
        <span className={`font-black tracking-tight ${dark ? "text-violet-400" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent"}`} style={{ fontSize: "1.3em", lineHeight: "1" }}>∞</span>
        <span className={`${textSize} font-black tracking-tight ${textColor}`}>p</span>
        <span className={`${textSize} font-black tracking-tight ${dark ? "text-violet-400" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent"}`}>ad</span>
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const AdlyLogoIcon = LoopadLogoIcon;
export const AdlyLogoFull = LoopadLogoFull;
export const KultadsLogoIcon = LoopadLogoIcon;
export const KultadsLogoFull = LoopadLogoFull;
