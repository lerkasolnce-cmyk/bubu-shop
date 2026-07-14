"use client";

const MIN_QTY = 1;
const MAX_QTY = 99;

export default function QuantityStepper({
  value,
  onChange,
  disabled,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  decreaseLabel?: string;
  increaseLabel?: string;
}) {
  const clamp = (n: number) => Math.min(MAX_QTY, Math.max(MIN_QTY, n));

  return (
    <div className="inline-flex items-center rounded-full border border-blush/60 bg-white text-ink">
      <button
        type="button"
        aria-label={decreaseLabel ?? "Decrease quantity"}
        disabled={disabled || value <= MIN_QTY}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-ink/70 transition hover:bg-blush/30 disabled:cursor-not-allowed disabled:opacity-30"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel ?? "Increase quantity"}
        disabled={disabled || value >= MAX_QTY}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-ink/70 transition hover:bg-blush/30 disabled:cursor-not-allowed disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
