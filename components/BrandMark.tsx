export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/copywrite_logo.png"
      alt="Copywrite Logo"
      className={`${className} rounded-full object-cover`}
    />
  );
}
