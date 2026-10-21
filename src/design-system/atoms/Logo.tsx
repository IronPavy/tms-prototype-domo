import edtimeLogo from "../assets/logos/edtime.svg";
import tmsLogo from "../assets/logos/tms_logo.svg";

/** "Product Logo" (Figma 18:742) — edtime wordmark, for dark backgrounds. */
export function ProductLogo({ className = "" }: { className?: string }) {
  return <img src={edtimeLogo} alt="edtime" width={91} height={27} className={`block shrink-0 ${className}`} />;
}

/** "LogoTMS" (Figma 19:1246) — 28px round TMS mark. */
export function TmsLogo({ className = "" }: { className?: string }) {
  return <img src={tmsLogo} alt="TMS" width={28} height={28} className={`block shrink-0 ${className}`} />;
}
