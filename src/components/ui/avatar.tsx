import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  src?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, size = "md", src }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeStyles[size]
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-ptba-navy text-white flex items-center justify-center font-medium flex-shrink-0",
        sizeStyles[size]
      )}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
