"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "link",
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES}
        formats={FORMATS}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .ql-container { min-height: 120px; font-size: 14px; border-color: var(--ptba-light-gray, #e5e7eb) !important; border-radius: 0 0 8px 8px; }
        .ql-toolbar { border-color: var(--ptba-light-gray, #e5e7eb) !important; border-radius: 8px 8px 0 0; background: #f9fafb; }
        .ql-editor { min-height: 100px; }
        .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; }
      `}</style>
    </div>
  );
}
