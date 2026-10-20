import DOMPurify from "dompurify";

/**
 * Sanitize HTML before rendering with dangerouslySetInnerHTML.
 * Used for evaluator comments coming from the rich-text editor (Quill).
 *
 * Quill HTML output is generally safe but can contain XSS vectors via
 * `<img onerror>`, `javascript:` URLs, and similar. DOMPurify strips
 * these while preserving safe formatting.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  // Server-side rendering: DOMPurify needs a window. Return raw on SSR;
  // it will be sanitized once the component hydrates on the client.
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Sanitize rich text to inline formatting only (bold/italic/underline/strike),
 * for one-line labels such as custom document names. Paragraphs become spaces.
 */
export function sanitizeInlineHtml(html: string | null | undefined): string {
  if (!html) return "";
  const flat = html.replace(/<\/p>\s*<p[^>]*>/gi, " ");
  if (typeof window === "undefined") return flat;
  return DOMPurify.sanitize(flat, {
    ALLOWED_TAGS: ["strong", "b", "em", "i", "u", "s"],
    ALLOWED_ATTR: [],
  });
}
