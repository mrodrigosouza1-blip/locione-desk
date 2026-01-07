import { brand } from "../../assets/brand";

type BrandLogoVariant = "horizontal" | "icon";
type BrandLogoSize = "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  style?: React.CSSProperties;
}

// Mapeamento de tamanhos por variante
const horizontalSizeMap: Record<BrandLogoSize, number> = {
  sm: 24,
  md: 34,
  lg: 42,
  xl: 52,
};

const iconSizeMap: Record<BrandLogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 48,
  xl: 56,
};

/**
 * Componente reutilizável para exibir o logo da marca.
 * Suporta variantes horizontal/icon e tamanhos sm/md/lg/xl.
 */
export default function BrandLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  style = {},
}: BrandLogoProps) {
  const src = variant === "horizontal" ? brand.logoHorizontal : brand.logoIcon;
  const sizeMap = variant === "horizontal" ? horizontalSizeMap : iconSizeMap;
  const dimension = sizeMap[size];

  return (
    <img
      src={src}
      alt="LociOne Desk"
      aria-label="LociOne Desk"
      className={className}
      loading="eager"
      style={{
        height: `${dimension}px`,
        width: variant === "horizontal" ? "auto" : `${dimension}px`,
        maxWidth: "100%",
        objectFit: "contain",
        ...style,
      }}
      draggable={false}
    />
  );
}

