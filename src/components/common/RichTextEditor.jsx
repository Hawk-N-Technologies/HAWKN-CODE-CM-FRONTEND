import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Highlighter,
  Palette,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors
        ${
          active
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        }
        disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-300" />;
}

function RichTextEditor({
  label,
  value,
  onChange,
  error,
  placeholder = "Start writing…",
  maxLength,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "rte-heading",
          },
        },
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "rte-editor min-h-[300px] px-4 py-4 focus:outline-none max-w-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const textColor = () => {
    const color = window.prompt("Text color (hex, e.g. #ff6600)", "#000000");
    if (color) editor.chain().focus().setColor(color).run();
  };

  const highlight = () => {
    const color = window.prompt("Highlight color (hex)", "#fef08a");
    if (color) editor.chain().focus().toggleHighlight({ color }).run();
  };

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-cm-text">{label}</label>
      )}

      <style>{`
        .rte-editor h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 1.5rem 0 0.75rem; color: #111827; }
        .rte-editor h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 1.25rem 0 0.6rem; color: #111827; }
        .rte-editor h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; margin: 1rem 0 0.5rem; color: #111827; }
        .rte-editor p { margin: 0 0 0.75rem; line-height: 1.7; color: #374151; }
        .rte-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
        .rte-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
        .rte-editor li { margin-bottom: 0.25rem; }
        .rte-editor blockquote { border-left: 4px solid #c7d2fe; padding-left: 1rem; margin: 1rem 0; color: #4b5563; font-style: italic; }
        .rte-editor code { background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.35rem; font-family: ui-monospace, monospace; font-size: 0.875em; }
        .rte-editor pre { background: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .rte-editor pre code { background: transparent; color: inherit; padding: 0; }
        .rte-editor a { color: #4f46e5; text-decoration: underline; cursor: pointer; }
        .rte-editor img { max-width: 100%; height: auto; border-radius: 6px; margin: 1rem 0; }
        .rte-editor hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
        .rte-editor mark { border-radius: 2px; padding: 0 2px; background-color: #fef08a; }
        .rte-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div
        className={`overflow-hidden rounded-cm-lg border bg-cm-card ${
          error ? "border-red-500" : "border-cm-border"
        }`}
      >
        {/* ============ TOOLBAR ============ */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-cm-border bg-gray-50 p-1.5">
          <ToolbarButton
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Text color"
            active={editor.isActive("textStyle")}
            onClick={textColor}
          >
            <Palette size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Highlight"
            active={editor.isActive("highlight")}
            onClick={highlight}
          >
            <Highlighter size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Justify"
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Add link"
            active={editor.isActive("link")}
            onClick={addLink}
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            title="Remove link"
            disabled={!editor.isActive("link")}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink size={16} />
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={addImage}>
            <ImageIcon size={16} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            title="Clear formatting"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <RemoveFormatting size={16} />
          </ToolbarButton>
        </div>

        {/* ============ EDITOR ============ */}
        <div className="bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* ============ FOOTER ============ */}
        <div className="flex items-center justify-between border-t border-cm-border bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <span>
            {words} words · {chars} characters
            {maxLength ? ` / ${maxLength}` : ""}
          </span>
          {maxLength && chars >= maxLength && (
            <span className="font-medium text-red-500">Limit reached</span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default RichTextEditor;
