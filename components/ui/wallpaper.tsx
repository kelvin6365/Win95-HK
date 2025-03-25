export function Wallpaper({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-[#00787f] ${className || ""}`}>{children}</div>;
}
