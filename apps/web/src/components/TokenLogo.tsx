import Image from "next/image";

/** Official marks: Monad (monad.xyz) and USDC (Circle). Files in public/logos. */
export function TokenLogo({ symbol, size = 20, className = "" }: { symbol: "USDC" | "MON"; size?: number; className?: string }) {
  const src = symbol === "USDC" ? "/logos/usdc.svg" : "/logos/monad.png";
  return <Image src={src} alt={symbol} width={size} height={size} className={`shrink-0 rounded-full ${className}`} />;
}
