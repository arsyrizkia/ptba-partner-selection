// Helpers for HTML produced by the Quill rich-text editor

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/**
 * Plain text of rich-text HTML, for ids, labels and anywhere markup can't
 * render. Plain text (e.g. names saved before rich text) passes through.
 */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|li|h[1-6])>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, entity: string) => ENTITIES[entity])
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean editor HTML before saving: Quill's semantic HTML turns every space
 * into &nbsp; (which stops text wrapping), and an empty editor is "<p></p>".
 */
export function normalizeRichText(html: string | null | undefined): string {
  if (!richTextToPlain(html)) return "";
  return html!.replace(/&nbsp;/g, " ").replace(/ /g, " ").trim();
}
