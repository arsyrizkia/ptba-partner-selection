"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || label;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-ptba-light-gray px-3 py-2 text-sm",
          "bg-white text-ptba-charcoal transition-colors",
          "hover:bg-ptba-off-white focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue",
          value && "border-ptba-steel-blue"
        )}
      >
        <span className="text-ptba-gray">{label}:</span>
        <span className="font-medium">{selectedLabel}</span>
        <svg
          className={cn(
            "h-4 w-4 text-ptba-gray transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full min-w-[180px] rounded-lg border border-ptba-light-gray bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-ptba-section-bg",
                option.value === value
                  ? "text-ptba-navy font-medium bg-ptba-section-bg"
                  : "text-ptba-charcoal"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
