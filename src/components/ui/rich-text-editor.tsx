"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

/**
 * full   — everything (project description, evaluation notes)
 * basic  — bold/italic/underline, lists and links (short descriptions)
 * inline — one line of bold/italic/underline, toolbar beside the text (names)
 */
type EditorVariant = "full" | "basic" | "inline";

const MODULES: Record<EditorVariant, Record<string, unknown>> = {
  full: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  },
  basic: {
    toolbar: [["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["link"], ["clean"]],
  },
  inline: {
    toolbar: [["bold", "italic", "underline"]],
    // Runs before Quill's own Enter handling, so no new paragraph is added
    keyboard: { bindings: { singleLine: { key: "Enter", shiftKey: null, handler: () => false } } },
  },
};

const FORMATS: Record<EditorVariant, string[]> = {
  full: ["header", "size", "bold", "italic", "underline", "strike", "color", "background", "align", "list", "link", "image"],
  basic: ["bold", "italic", "underline", "list", "link"],
  inline: ["bold", "italic", "underline"],
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: EditorVariant;
}

export function RichTextEditor({ value, onChange, placeholder, className, variant = "full" }: RichTextEditorProps) {
  return (
    <div className={`rte-${variant} ${className ?? ""}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES[variant]}
        formats={FORMATS[variant]}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .ql-container { min-height: 120px; font-size: 14px; border-color: var(--ptba-light-gray, #e5e7eb) !important; border-radius: 0 0 8px 8px; }
        .ql-toolbar { border-color: var(--ptba-light-gray, #e5e7eb) !important; border-radius: 8px 8px 0 0; background: #f9fafb; }
        .ql-editor { min-height: 100px; }
        .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; }

        .rte-basic .ql-toolbar.ql-snow { padding: 4px 6px; }
        .rte-basic .ql-container { min-height: 0; font-size: 12px; background: #fff; }
        .rte-basic .ql-editor { min-height: 56px; padding: 8px 12px; }

        .rte-inline .quill { display: flex; align-items: stretch; }
        .rte-inline .ql-toolbar.ql-snow { display: flex; align-items: center; padding: 2px 4px; border-radius: 8px 0 0 8px; border-right: 0; }
        .rte-inline .ql-toolbar.ql-snow + .ql-container.ql-snow { border-top: 1px solid; }
        .rte-inline .ql-container { flex: 1; min-width: 0; min-height: 0; border-radius: 0 8px 8px 0; background: #fff; }
        .rte-inline .ql-toolbar.ql-snow .ql-formats { margin-right: 0; }
        .rte-inline .ql-editor { min-height: 0; padding: 9px 12px; }
      `}</style>
    </div>
  );
}
