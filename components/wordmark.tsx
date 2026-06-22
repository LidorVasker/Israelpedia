import Link from "next/link";

export default function Wordmark({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-baseline gap-2 font-display ${className}`}
      aria-label="IsraelPedia — home"
    >
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-brass transition-transform duration-200 group-hover:rotate-[135deg]"
      />
      <span className="text-[1.5rem] font-bold leading-none tracking-tight">
        <span className="text-techelet">Israel</span>
        <span className="text-ink">Pedia</span>
      </span>
    </Link>
  );
}
