"use client";

import { cn } from "@/lib/utils/cn";
import { sanitizeHtml, sanitizeInlineHtml } from "@/lib/utils/sanitize";

interface RichTextProps {
  /** HTML from the rich-text editor; plain text renders as-is */
  html: string | null | undefined;
  /** Keep only bold/italic/underline/strike on one line, e.g. for names */
  inline?: boolean;
  className?: string;
}

// Renders saved rich text (sanitized). Block mode keeps lists and links.
export function RichText({ html, inline = false, className }: RichTextProps) {
  const source = (html || "").replace(/&nbsp;/g, " ").replace(/ /g, " ");
  if (inline) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(source) }} />;
  }
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: sanitizeHtml(source) }} />;
}
