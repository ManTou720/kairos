interface LogoProps {
  /** 邊長(px),維持正方形呈現 */
  size?: number;
  className?: string;
}

/**
 * 全站統一的 Kairos logo:圓角方形、等比縮放不變形。
 * 所有頁面務必使用此元件,避免圓形/方形混用。
 */
export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.png"
      alt="Kairos"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-xl object-cover ${className}`}
    />
  );
}
