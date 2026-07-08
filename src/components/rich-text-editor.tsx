"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";

/**
 * 轻量富文本编辑器 —— 基于 TipTap。
 * 对外暴露 value(string) + onChange(string),兼容原 textarea 用法。
 * 输出 HTML,内部用 contenteditable 渲染。
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Typography,
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content outline-none",
        style: `min-height: ${rows * 1.5}rem`,
      },
    },
  });

  // 外部 value 变化时同步(如 AI 润色采用、重置)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Tiptap v3：emitUpdate 从布尔位参数改为 options 对象，避免同步时回触 onChange
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={`group/editor relative rounded-md border border-line bg-white px-2.5 py-1.5 transition focus-within:border-brand ${className ?? ""}`}
    >
      {/* 工具栏 — hover/focus 时浮现 */}
      <div className="mb-1 flex items-center gap-0.5 border-b border-line pb-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/editor:opacity-100">
        <ToolbarBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          className="font-bold"
        />
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          className="italic"
        />
        <ToolbarBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="•"
        />
        <ToolbarBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="1."
        />
        <span className="ml-auto text-[0.6rem] text-faint">富文本</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  label,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`grid h-5 w-5 place-items-center rounded text-[0.7rem] transition ${
        active
          ? "bg-brand-soft text-brand-deep"
          : "text-muted hover:bg-bg-2 hover:text-ink"
      } ${className ?? ""}`}
    >
      {label}
    </button>
  );
}
