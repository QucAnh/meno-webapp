import React, { useState, useEffect, useRef } from "react";
import { Note, SyncStatus } from "../types/note";
import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Table,
  Columns,
  Eye,
  Edit3,
  Copy,
  Download,
  Star,
  Check,
  Folder,
  Tag as TagIcon,
  X,
  Plus,
  Trash2,
} from "lucide-react";

interface EditorSplitViewProps {
  note: Note | null;
  onUpdateNote: (
    noteId: string,
    updates: Partial<Note>,
    debounceMs?: number,
  ) => void;
  onSaveImmediate: (noteId: string, updates?: Partial<Note>) => void;
  onTogglePin: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  syncStatus: SyncStatus;
  allFolders: string[];
  errorMessage?: string | null;
}

type ViewMode = "split" | "editor" | "preview";

export const EditorSplitView: React.FC<EditorSplitViewProps> = ({
  note,
  onUpdateNote,
  onSaveImmediate,
  onTogglePin,
  onDeleteNote,
  syncStatus,
  allFolders,
  errorMessage,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Local mirror state for super-smooth typing
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localFolder, setLocalFolder] = useState("General");
  const [localTags, setLocalTags] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  // Synchronize local state whenever active note changes
  useEffect(() => {
    if (note) {
      if (currentNoteIdRef.current !== note.id) {
        currentNoteIdRef.current = note.id;
        setLocalTitle(note.title);
        setLocalContent(note.content);
        setLocalFolder(note.folder);
        setLocalTags(note.tags);
        setShowTagInput(false);
        setTagInput("");
      } else {
        // If note updated externally, only update if not dirty
        if (
          note.title !== localTitle &&
          document.activeElement?.id !== "active-note-title-input"
        ) {
          setLocalTitle(note.title);
        }
        if (
          note.content !== localContent &&
          document.activeElement?.id !== "markdown-textarea-editor"
        ) {
          setLocalContent(note.content);
        }
        setLocalFolder(note.folder);
        setLocalTags(note.tags);
      }
    } else {
      currentNoteIdRef.current = null;
    }
  }, [note]);

  // Adjust viewMode automatically for mobile viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === "split") {
        setViewMode("editor");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Keyboard shortcut: Cmd+S to save immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (note) {
          onSaveImmediate(note.id, {
            title: localTitle,
            content: localContent,
            folder: localFolder,
            tags: localTags,
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [note, localTitle, localContent, localFolder, localTags, onSaveImmediate]);

  if (!note) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-50/50 dark:bg-neutral-900/50 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
          <Edit3 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Select or create a note
        </h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-sm">
          Pick a note from the list on the left, or press the "+ New Note"
          button to start typing immediately.
        </p>
      </div>
    );
  }

  const handleTitleChange = (val: string) => {
    setLocalTitle(val);
    onUpdateNote(note.id, { title: val }, 500);
  };

  const handleContentChange = (val: string) => {
    setLocalContent(val);
    onUpdateNote(note.id, { content: val }, 500);
  };

  const handleFolderChange = (folder: string) => {
    setLocalFolder(folder);
    onUpdateNote(note.id, { folder }, 200);
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (cleanTag && !localTags.includes(cleanTag)) {
      const updatedTags = [...localTags, cleanTag];
      setLocalTags(updatedTags);
      onUpdateNote(note.id, { tags: updatedTags }, 200);
      setTagInput("");
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = localTags.filter((t) => t !== tagToRemove);
    setLocalTags(updatedTags);
    onUpdateNote(note.id, { tags: updatedTags }, 200);
  };

  // Markdown Formatting insertions
  const insertFormatting = (
    prefix: string,
    suffix: string = "",
    defaultText: string = "",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent =
      localContent.substring(0, start) +
      replacement +
      localContent.substring(end);

    setLocalContent(newContent);
    onUpdateNote(note.id, { content: newContent }, 500);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 10);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([localContent], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(localTitle || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Stats
  const wordCount = localContent.trim()
    ? localContent.trim().split(/\s+/).length
    : 0;
  const charCount = localContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      id="memoflow-editor-container"
      className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden transition-colors"
    >
      {/* Top Editor Bar */}
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/70">
        {/* Left: Metadata controls (Folder & Pin) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Folder selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 shadow-2xs">
            <Folder className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <select
              id="note-folder-select"
              value={localFolder}
              onChange={(e) => handleFolderChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-hidden cursor-pointer"
            >
              {allFolders.map((f) => (
                <option
                  key={f}
                  value={f}
                  className="dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Pin Toggle */}
          <button
            id="editor-pin-toggle-btn"
            onClick={() => onTogglePin(note.id)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              note.isPinned
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-medium"
                : "bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
            title={note.isPinned ? "Unpin note" : "Pin note to top"}
          >
            <Star
              className={`w-3.5 h-3.5 ${note.isPinned ? "fill-amber-400 text-amber-500" : ""}`}
            />
            <span className="hidden sm:inline">
              {note.isPinned ? "Pinned" : "Pin"}
            </span>
          </button>
          
          {/* Center: Live Sync Status */}
          <div className="flex items-center gap-2">
            <SyncStatusIndicator
              status={syncStatus}
              errorMessage={errorMessage}
              onRetry={() => onSaveImmediate(note.id)}
            />
          </div>
        </div>

        {/* Right: View Mode + Export actions */}
        <div className="flex items-center gap-1.5">
          {/* Copy Markdown */}
          <button
            id="copy-markdown-btn"
            onClick={handleCopyMarkdown}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Copy Raw Markdown"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Download as .md */}
          <button
            id="download-markdown-btn"
            onClick={handleDownloadMarkdown}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Export as Markdown (.md)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete active note */}
          {onDeleteNote && (
            <button
              id="editor-delete-note-btn"
              onClick={() => onDeleteNote(note.id)}
              className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

          {/* Split Mode Toggle Group */}
          <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              id="view-mode-editor-btn"
              onClick={() => setViewMode("editor")}
              className={`p-1 rounded-md transition-all ${
                viewMode === "editor"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-medium"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Editor only"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-split-btn"
              onClick={() => setViewMode("split")}
              className={`p-1 rounded-md transition-all ${
                viewMode === "split"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-medium"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Split side-by-side"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              id="view-mode-preview-btn"
              onClick={() => setViewMode("preview")}
              className={`p-1 rounded-md transition-all ${
                viewMode === "preview"
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-medium"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Rendered preview only"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Note Header: Title & Tags Bar */}
      <div className="px-6 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <input
          id="active-note-title-input"
          type="text"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="w-full text-xl md:text-2xl font-bold text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 border-none outline-hidden bg-transparent tracking-tight font-sans"
        />

        {/* Tags Bar */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          <TagIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
          {localTags.map((tag) => (
            <span
              key={tag}
              id={`note-tag-pill-${tag}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-neutral-200 dark:border-neutral-700"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-neutral-400 hover:text-rose-500 transition-colors ml-0.5"
                title="Remove tag"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="inline-flex items-center gap-1">
              <input
                id="add-tag-inline-input"
                type="text"
                autoFocus
                placeholder="tag name + enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="text-xs px-2 py-0.5 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-amber-300 dark:border-amber-600 text-neutral-800 dark:text-neutral-200 outline-hidden w-28"
              />
              <button
                onClick={() => setShowTagInput(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="add-tag-chip-btn"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-dashed border-neutral-200 dark:border-neutral-700"
            >
              <Plus className="w-3 h-3" />
              <span>Add tag</span>
            </button>
          )}
        </div>
      </div>

      {/* Markdown Formatting Toolbar (Visible in Split or Editor Mode) */}
      {viewMode !== "preview" && (
        <div
          id="markdown-formatting-toolbar"
          className="px-4 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center gap-1 overflow-x-auto custom-scrollbar text-neutral-600 dark:text-neutral-400"
        >
          <button
            onClick={() => insertFormatting("**", "**", "bold text")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("*", "*", "italic text")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("~~", "~~", "strikethrough")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            onClick={() => insertFormatting("# ", "", "Heading 1")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("## ", "", "Heading 2")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("### ", "", "Heading 3")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            onClick={() => insertFormatting("> ", "", "Quote")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Quote (> text)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("`", "`", "inline code")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("```\n", "\n```", "code block")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md text-xs font-mono font-medium transition-colors"
            title="Code Block"
          >
            {"{}"}
          </button>

          <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            onClick={() => insertFormatting("- ", "", "List item")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Bullet List (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("1. ", "", "Numbered item")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("- [ ] ", "", "Task item")}
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Task List (- [ ] item)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            onClick={() =>
              insertFormatting("[", "](https://example.com)", "Link text")
            }
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Insert Link ([text](url))"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                "| Column 1 | Column 2 |\n| -------- | -------- |\n| Item 1   | Item 2   |\n",
                "",
                "",
              )
            }
            className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            title="Insert Table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Area (Split or Single) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Markdown Raw Textarea */}
        {viewMode !== "preview" && (
          <div
            className={`
              h-full flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900
              ${viewMode === "split" ? "w-1/2" : "w-full"}
            `}
          >
            <div className="px-4 py-1.5 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between select-none bg-neutral-50/30 dark:bg-neutral-900/40">
              <span>MARKDOWN SOURCE</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Auto-saves every 500ms
              </span>
            </div>

            <textarea
              id="markdown-textarea-editor"
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write Markdown here... Use headers (#), lists (-), quotes (>), or code (```)..."
              className="flex-1 p-6 text-sm font-mono leading-relaxed resize-none outline-hidden border-none text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-900 selection:bg-amber-100 dark:selection:bg-amber-900/50 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 overflow-y-auto custom-scrollbar"
              spellCheck={false}
            />
          </div>
        )}

        {/* Right Side: Rendered Markdown Preview */}
        {viewMode !== "editor" && (
          <div
            className={`
              h-full flex flex-col bg-neutral-50/40 dark:bg-neutral-950/40 overflow-hidden
              ${viewMode === "split" ? "w-1/2" : "w-full"}
            `}
          >
            <div className="px-4 py-1.5 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between select-none bg-neutral-50/30 dark:bg-neutral-900/40">
              <span>RENDERED PREVIEW</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                GitHub Flavored Markdown
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-neutral-900">
              <MarkdownRenderer content={localContent} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Info Bar */}
      <div className="px-4 py-1.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{readTimeMin} min read</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
            Updated {new Date(note.updatedAt).toLocaleTimeString()}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500 hidden sm:inline">
            ⌘S to save immediately
          </span>
        </div>
      </div>
    </div>
  );
};
