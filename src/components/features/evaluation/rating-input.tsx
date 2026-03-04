"use client";

import { cn } from "@/lib/utils/cn";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
}

export function RatingInput({ value, onChange, maxRating = 5 }: RatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => {
        const isSelected = rating <= value;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              "w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-ptba-gold focus:ring-offset-1",
              isSelected
                ? "bg-ptba-gold border-ptba-gold text-ptba-charcoal"
                : "bg-white border-gray-300 text-gray-400 hover:border-ptba-gold hover:text-ptba-gold"
            )}
          >
            {rating}
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-ptba-charcoal">
        {value}/{maxRating}
      </span>
    </div>
  );
}
