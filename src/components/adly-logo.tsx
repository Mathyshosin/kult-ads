import Image from "next/image";

// Klonr logo — custom designed logo
export function KlonrLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Klonr."
      width={36}
      height={36}
      className={`rounded-lg ${className || ""}`}
      priority
    />
  );
}

export function KlonrLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]", dark = false }: { iconSize?: string; textSize?: string; dark?: boolean }) {
  const textColor = dark ? "text-white" : "text-gray-900";
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Klonr."
        width={36}
        height={36}
        className={`rounded-lg ${iconSize}`}
        priority
      />
      <div className="flex items-baseline">
        <span className={`${textSize} font-black tracking-tight ${textColor}`}>Klonr</span>
        <span className={`${textSize} font-black tracking-tight ${dark ? "text-violet-400" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent"}`}>.</span>
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const LoopadLogoIcon = KlonrLogoIcon;
export const LoopadLogoFull = KlonrLogoFull;
export const AdlyLogoIcon = KlonrLogoIcon;
export const AdlyLogoFull = KlonrLogoFull;
export const KultadsLogoIcon = KlonrLogoIcon;
export const KultadsLogoFull = KlonrLogoFull;
