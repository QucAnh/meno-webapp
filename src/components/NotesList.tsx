import React from "react";
import { Note, NoteFilter } from "../types/note";
import {
  Search,
  X,
  Star,
  Trash2,
  FileText,
  PanelLeftOpen,
  Folder,
  Tag as TagIcon,
} from "lucide-react";
import {
  ParsedSearchQuery,
  HighlightText,
  getSmartExcerpt,
} from "../utils/searchUtils";
import { getFolderStyle } from "../utils/folderStyles";

interface NotesListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onTogglePin: (noteId: string, e: React.MouseEvent) => void;
  onDeleteNote: (noteId: string, e: React.MouseEvent) => void;
  onCreateNote: () => void;
  filter: NoteFilter;
  setFilter: React.Dispatch<React.SetStateAction<NoteFilter>>;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  parsedSearch?: ParsedSearchQuery;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onTogglePin,
  onDeleteNote,
  onCreateNote,
  filter,
  setFilter,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  parsedSearch,
}) => {
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 86400 * 7)
      return `${Math.floor(diffSeconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const searchTerms = parsedSearch?.allTerms || [];

  return (
    <div
      id="memoflow-notes-list-panel"
      className="w-full md:w-80 lg:w-88 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col h-full shrink-0 transition-colors"
    >
      {/* Search Bar & Header with Sidebar expand button */}
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2 mb-2">
          {/* Expand sidebar button if collapsed (desktop) */}
          {isSidebarCollapsed && onToggleSidebarCollapse && (
            <button
              id="expand-sidebar-btn"
              onClick={onToggleSidebarCollapse}
              className="hidden md:flex p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" />
            <input
              id="notes-search-input"
              type="text"
              placeholder="Search notes, #tags, keyword:#tags..."
              value={filter.searchQuery}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
            />
            {filter.searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() =>
                  setFilter((prev) => ({ ...prev, searchQuery: "" }))
                }
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Syntax Hints & Active Parsed Tags */}
        {parsedSearch &&
          (parsedSearch.tagTerms.length > 0 ||
            parsedSearch.folderTerms.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap pb-1.5 text-[10px]">
              <span className="text-neutral-400 dark:text-neutral-500">
                Search filters:
              </span>
              {parsedSearch.tagTerms.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 font-medium"
                >
                  <TagIcon className="w-2.5 h-2.5" />#{tg}
                </span>
              ))}
              {parsedSearch.folderTerms.map((fd) => (
                <span
                  key={fd}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800/60 font-medium"
                >
                  <Folder className="w-2.5 h-2.5" />
                  {fd}
                </span>
              ))}
            </div>
          )}

        {/* Filter Badges Display */}
        {(filter.folder !== "all" || filter.tag || filter.onlyPinned) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px]">
            <span className="text-neutral-400 dark:text-neutral-500">
              Filtering:
            </span>
            {filter.folder !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                📁 {filter.folder}
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, folder: "all" }))
                  }
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filter.tag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                #{filter.tag}
                <button
                  onClick={() => setFilter((prev) => ({ ...prev, tag: null }))}
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filter.onlyPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ★ Pinned only
                <button
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, onlyPinned: false }))
                  }
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="px-3.5 py-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50">
        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">
          {filter.onlyPinned
            ? "Pinned Notes"
            : filter.folder !== "all"
              ? filter.folder
              : "All Notes"}
        </span>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {/* Notes List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-48">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 flex items-center justify-center mb-2.5">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              No notes found
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-[220px]">
              {filter.searchQuery
                ? "Try matching a #tag (e.g. #ideas), keyword, or reset filters."
                : "Create your first note to start capture."}
            </p>
            <button
              id="empty-state-create-btn"
              onClick={onCreateNote}
              className="mt-3 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Create Note
            </button>
          </div>
        ) : (
          notes.map((note) => {
            const isActive = note.id === activeNoteId;
            const folderStyle = getFolderStyle(note.folder);

            // Helper to check if a specific tag matches the current search query or active tag filter
            const isTagMatching = (t: string) => {
              const lower = t.toLowerCase();
              const matchesTagFilter =
                filter.tag && lower === filter.tag.toLowerCase();
              const matchesTagTerms = parsedSearch?.tagTerms.some((term) =>
                lower.includes(term.toLowerCase()),
              );
              const matchesSearchTerms = searchTerms.some((term) => {
                const clean = term.toLowerCase().replace(/^#/, "");
                return clean && lower.includes(clean);
              });
              return Boolean(
                matchesTagFilter || matchesTagTerms || matchesSearchTerms,
              );
            };

            // Display all tags, ordering matching tags first
            const sortedTags = [...(note.tags || [])].sort((a, b) => {
              const aMatches = isTagMatching(a);
              const bMatches = isTagMatching(b);
              if (aMatches && !bMatches) return -1;
              if (!aMatches && bMatches) return 1;
              return 0;
            });

            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                onClick={() => onSelectNote(note.id)}
                className={`
                  group p-3.5 cursor-pointer transition-all relative
                  ${
                    isActive
                      ? "bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-amber-500 pl-2.5"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border-l-4 border-l-transparent"
                  }
                `}
              >
                {/* Title & Pin & Delete buttons */}
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <h3
                    className={`text-xs font-semibold truncate flex-1 ${
                      isActive
                        ? "text-neutral-950 dark:text-white"
                        : "text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <HighlightText
                      text={note.title || "Untitled Note"}
                      terms={searchTerms}
                    />
                  </h3>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`pin-note-btn-${note.id}`}
                      onClick={(e) => onTogglePin(note.id, e)}
                      title={note.isPinned ? "Unpin note" : "Pin to top"}
                      className={`p-1 rounded-md transition-colors ${
                        note.isPinned
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 md:opacity-0 md:group-hover:opacity-100"
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${note.isPinned ? "fill-amber-400" : ""}`}
                      />
                    </button>

                    <button
                      id={`delete-note-btn-${note.id}`}
                      onClick={(e) => onDeleteNote(note.id, e)}
                      title="Delete note"
                      className="p-1 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Excerpt with search match highlighting & smart centering */}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                  <HighlightText
                    text={getSmartExcerpt(note.content, searchTerms, 95)}
                    terms={searchTerms}
                  />
                </p>

                {/* Meta: Folder (with icon and distinct background color) + Tags (horizontally scrollable, matching first) + Date */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    {/* Distinct Folder Span with Folder Icon & Colored Background Badge */}
                    <span
                      id={`note-folder-badge-${note.id}`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border shrink-0 transition-colors shadow-2xs ${folderStyle.badgeClass}`}
                      title={`Folder: ${note.folder}`}
                    >
                      <Folder
                        className={`w-3 h-3 shrink-0 ${folderStyle.iconClass}`}
                      />
                      <span className="truncate max-w-[85px]">
                        {note.folder}
                      </span>
                    </span>

                    {/* All Tags: Horizontal Scroll & Matching Tags First */}
                    {sortedTags.length > 0 && (
                      <div
                        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0"
                        title="Tags (scroll horizontally to view all)"
                      >
                        {sortedTags.map((tag) => {
                          const isMatch = isTagMatching(tag);
                          return (
                            <span
                              key={tag}
                              id={`note-tag-${note.id}-${tag}`}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] shrink-0 border transition-colors whitespace-nowrap ${
                                isMatch
                                  ? "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300/90 dark:border-amber-700/80 font-semibold ring-1 ring-amber-400/40"
                                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-700/60"
                              }`}
                            >
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-neutral-400 dark:text-neutral-500 shrink-0 text-[10px]">
                    {formatTimestamp(note.updatedAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
