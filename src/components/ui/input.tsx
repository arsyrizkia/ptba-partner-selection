import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ptba-charcoal mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm text-ptba-charcoal",
            "placeholder:text-ptba-gray",
            "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent",
            "disabled:bg-ptba-off-white disabled:cursor-not-allowed",
            error && "border-ptba-red focus:ring-ptba-red",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-ptba-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
