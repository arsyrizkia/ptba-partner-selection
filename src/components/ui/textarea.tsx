import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-ptba-charcoal mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border border-ptba-light-gray px-3 py-2 text-sm text-ptba-charcoal",
            "placeholder:text-ptba-gray",
            "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue focus:border-transparent",
            "disabled:bg-ptba-off-white disabled:cursor-not-allowed",
            "min-h-[80px] resize-y",
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

Textarea.displayName = "Textarea";
