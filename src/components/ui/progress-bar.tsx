import { cn } from "@/lib/utils/cn";

type ProgressColor = "navy" | "gold" | "green" | "red";

interface ProgressBarProps {
  value: number;
  color?: ProgressColor;
  label?: string;
  showPercent?: boolean;
}

const colorStyles: Record<ProgressColor, string> = {
  navy: "bg-ptba-navy",
  gold: "bg-ptba-gold",
  green: "bg-ptba-green",
  red: "bg-ptba-red",
};

export function ProgressBar({
  value,
  color = "navy",
  label,
  showPercent = false,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-sm text-ptba-charcoal">{label}</span>
          )}
          {showPercent && (
            <span className="text-sm font-medium text-ptba-charcoal">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-ptba-light-gray rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[color]
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
