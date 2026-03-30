import Image from "next/image";

// Adly logo — custom designed logo
export function AdlyLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Adly"
      width={36}
      height={36}
      className={`rounded-lg ${className || ""}`}
      priority
    />
  );
}

export function AdlyLogoFull({ iconSize = "w-9 h-9", textSize = "text-[17px]" }: { iconSize?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Adly"
        width={36}
        height={36}
        className={`rounded-lg ${iconSize}`}
        priority
      />
      <div className="flex items-baseline">
        <span className={`${textSize} font-black tracking-tight text-gray-900`}>ad</span>
        <span className={`${textSize} font-black tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent`}>ly</span>
      </div>
    </div>
  );
}
