import Image from "next/image";

export default function BrandMark({
  width = 280,
  className = "",
  priority = false
}: {
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const height = Math.round(width * 0.446);

  return (
    <Image
      src="/logo-full-web.png"
      alt="Logo de Soluciones Informaticas"
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className={className}
    />
  );
}
