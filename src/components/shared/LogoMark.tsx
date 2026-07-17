type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 42 42"
      fill="none"
    >
      <path d="M6 5h12v15H6z" fill="#F2F0E8" />
      <path d="M20 5h4c7.18 0 13 5.82 13 13v2H20z" fill="#7456FF" />
      <path d="M6 22h12v15H6z" fill="#169C92" />
      <path d="M20 22h17v2c0 7.18-5.82 13-13 13h-4z" fill="#D6A13A" />
    </svg>
  );
}
