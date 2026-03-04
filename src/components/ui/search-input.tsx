"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-ptba-gray" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-ptba-light-gray py-2 pl-10 pr-3 text-sm text-ptba-charcoal",
          "placeholder:text-ptba-gray",
          "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent",
          "transition-all"
        )}
      />
    </div>
  );
}
