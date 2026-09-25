import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";

function RichTextEditor({ label, value, onChange, error }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],

    content: value || "",

    editorProps: {
      attributes: {
        class: "min-h-[300px] px-4 py-4 focus:outline-none max-w-none",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  // Add / edit link
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;

    const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url,
      })
      .run();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-cm-text">{label}</label>
      )}

      {/* Editor Container */}
      <div
        className={`overflow-hidden rounded-cm-lg border bg-cm-card ${
          error ? "border-red-500" : "border-cm-border"
        }`}
      >
        {/* ================= TOOLBAR ================= */}
        <div className="flex flex-wrap items-center gap-1 border-b border-cm-border bg-gray-50 p-2">
          {/* Bold */}
          <button
            type="button"
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors hover:bg-gray-200 ${
              editor.isActive("bold")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            B
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded px-3 py-1.5 text-sm italic transition-colors hover:bg-gray-200 ${
              editor.isActive("italic")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            I
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`rounded px-3 py-1.5 text-sm underline transition-colors hover:bg-gray-200 ${
              editor.isActive("underline")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            U
          </button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          {/* H2 */}
          <button
            type="button"
            title="Heading 2"
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({
                  level: 2,
                })
                .run()
            }
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors hover:bg-gray-200 ${
              editor.isActive("heading", {
                level: 2,
              })
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            H2
          </button>

          {/* H3 */}
          <button
            type="button"
            title="Heading 3"
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({
                  level: 3,
                })
                .run()
            }
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors hover:bg-gray-200 ${
              editor.isActive("heading", {
                level: 3,
              })
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            H3
          </button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 ${
              editor.isActive("bulletList")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            • List
          </button>

          {/* Ordered List */}
          <button
            type="button"
            title="Numbered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rounded px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 ${
              editor.isActive("orderedList")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            1. List
          </button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          {/* Link */}
          <button
            type="button"
            title="Add Link"
            onClick={addLink}
            className={`rounded px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 ${
              editor.isActive("link")
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700"
            }`}
          >
            🔗 Link
          </button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          {/* Undo */}
          <button
            type="button"
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="rounded px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↶
          </button>

          {/* Redo */}
          <button
            type="button"
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="rounded px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↷
          </button>
        </div>

        {/* ================= EDITOR ================= */}
        <div className="bg-white">
          <EditorContent
            editor={editor}
            className="
              min-h-[300px]
              px-4
              py-4

              [&_.ProseMirror]:min-h-[300px]
              [&_.ProseMirror]:outline-none

              [&_.ProseMirror_h2]:mb-3
              [&_.ProseMirror_h2]:mt-6
              [&_.ProseMirror_h2]:text-2xl
              [&_.ProseMirror_h2]:font-bold
              [&_.ProseMirror_h2]:leading-tight
              [&_.ProseMirror_h2]:text-gray-900

              [&_.ProseMirror_h3]:mb-2
              [&_.ProseMirror_h3]:mt-5
              [&_.ProseMirror_h3]:text-xl
              [&_.ProseMirror_h3]:font-semibold
              [&_.ProseMirror_h3]:leading-tight
              [&_.ProseMirror_h3]:text-gray-900

              [&_.ProseMirror_p]:mb-3
              [&_.ProseMirror_p]:leading-7
              [&_.ProseMirror_p]:text-gray-700

              [&_.ProseMirror_ul]:mb-4
              [&_.ProseMirror_ul]:list-disc
              [&_.ProseMirror_ul]:pl-6

              [&_.ProseMirror_ol]:mb-4
              [&_.ProseMirror_ol]:list-decimal
              [&_.ProseMirror_ol]:pl-6

              [&_.ProseMirror_li]:mb-1

              [&_.ProseMirror_a]:text-indigo-600
              [&_.ProseMirror_a]:underline
              [&_.ProseMirror_a]:cursor-pointer
            "
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default RichTextEditor;
