import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  Star,
  Plus,
  User as UserIcon,
  Layers,
  ChevronRight,
  ChevronDown,
  Trash2,
  PanelLeftClose,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Note, NoteFilter } from "../types/note";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getFolderStyle } from "../utils/folderStyles";

interface SidebarProps {
  notes: Note[];
  filter: NoteFilter;
  setFilter: React.Dispatch<React.SetStateAction<NoteFilter>>;
  allTags: string[];
  allFolders: string[];
  onCreateNote: () => void;
  onOpenAuth: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddFolder?: (folderName: string) => boolean;
  onRequestDeleteFolder?: (folderName: string, count: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  filter,
  setFilter,
  allTags,
  allFolders,
  onCreateNote,
  onOpenAuth,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onAddFolder,
  onRequestDeleteFolder,
}) => {
  const { user } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const [newFolderName, setNewFolderName] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);

  // Collapsible section state (persisted in localStorage)
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("memoflow_section_overview_open");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [isFoldersOpen, setIsFoldersOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("memoflow_section_folders_open");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [isTagsOpen, setIsTagsOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("memoflow_section_tags_open");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const toggleOverview = () => {
    setIsOverviewOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("memoflow_section_overview_open", String(next));
      } catch {}
      return next;
    });
  };

  const toggleFolders = () => {
    setIsFoldersOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("memoflow_section_folders_open", String(next));
      } catch {}
      return next;
    });
  };

  const toggleTags = () => {
    setIsTagsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("memoflow_section_tags_open", String(next));
      } catch {}
      return next;
    });
  };

  // Compute counts
  const totalNotes = notes.length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;

  const getFolderCount = (folderName: string) => {
    return notes.filter(
      (n) => n.folder && n.folder.toLowerCase() === folderName.toLowerCase(),
    ).length;
  };

  const getTagCount = (tagName: string) => {
    return notes.filter(
      (n) =>
        Array.isArray(n.tags) &&
        n.tags.map((t) => t.toLowerCase()).includes(tagName.toLowerCase()),
    ).length;
  };

  const handleSelectFolder = (folder: string) => {
    setFilter((prev) => ({ ...prev, folder }));
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectTag = (tag: string | null) => {
    setFilter((prev) => ({ ...prev, tag: prev.tag === tag ? null : tag }));
    if (onCloseMobile) onCloseMobile();
  };

  const handleTogglePinnedOnly = () => {
    setFilter((prev) => ({ ...prev, onlyPinned: !prev.onlyPinned }));
  };

  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (trimmed) {
      if (onAddFolder) {
        onAddFolder(trimmed);
      }
      setFilter((prev) => ({ ...prev, folder: trimmed }));
      setNewFolderName("");
      setShowAddFolder(false);
    }
  };

  return (
    <aside
      id="memoflow-sidebar"
      className={`
        bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex flex-col h-full shrink-0 select-none border-r border-neutral-200 dark:border-neutral-800
        fixed md:relative inset-y-0 left-0 z-30 transition-all duration-200 ease-in-out
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "md:hidden" : "md:w-64"}
      `}
    >
      {/* Brand Header with Collapse Controls */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="./public/asset/MEMO.png" alt="memo" className="w-10 h-10" />
          <div className="min-w-0">
            <span className="font-bold text-neutral-900 dark:text-white text-base tracking-tight font-sans block leading-none truncate">
              MemoFlow
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block truncate">
              Real-time Markdown
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse sidebar button (desktop) */}
          {onToggleCollapse && (
            <button
              id="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Close drawer (mobile) */}
          {onCloseMobile && (
            <button
              id="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          id="sidebar-create-note-btn"
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Note</span>
          <span className="text-[10px] font-mono opacity-60 ml-auto bg-amber-500/30 px-1.5 py-0.5 rounded">
            ⌘N
          </span>
        </button>
      </div>

      {/* Navigation Sections (All Collapsible) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs custom-scrollbar">
        {/* Section 1: Overview (Collapsible) */}
        <div
          id="sidebar-section-overview"
          className="border-b border-neutral-100 dark:border-neutral-800/40 pb-3"
        >
          <button
            id="toggle-section-overview-btn"
            onClick={toggleOverview}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase tracking-wider rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
            title={isOverviewOpen ? "Collapse Overview" : "Expand Overview"}
          >
            <div className="flex items-center gap-1.5">
              {isOverviewOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>Overview</span>
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              {totalNotes}
            </span>
          </button>

          {isOverviewOpen && (
            <div className="mt-1 space-y-0.5">
              <button
                id="filter-all-notes-btn"
                onClick={() => handleSelectFolder("all")}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  filter.folder === "all" && !filter.onlyPinned && !filter.tag
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-neutral-400" />
                  <span>All Notes</span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800/60">
                  {totalNotes}
                </span>
              </button>

              <button
                id="filter-pinned-notes-btn"
                onClick={handleTogglePinnedOnly}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  filter.onlyPinned
                    ? "bg-amber-100/80 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-medium border border-amber-300 dark:border-amber-400/30"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star
                    className={`w-4 h-4 ${
                      filter.onlyPinned
                        ? "fill-amber-400 text-amber-500 dark:text-amber-400"
                        : "text-neutral-400"
                    }`}
                  />
                  <span>Pinned</span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800/60">
                  {pinnedCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Folders (Collapsible with delete & add options) */}
        <div
          id="sidebar-section-folders"
          className="border-b border-neutral-100 dark:border-neutral-800/40 pb-3"
        >
          <div className="flex items-center justify-between">
            <button
              id="toggle-section-folders-btn"
              onClick={toggleFolders}
              className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase tracking-wider rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors text-left"
              title={isFoldersOpen ? "Collapse Folders" : "Expand Folders"}
            >
              {isFoldersOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>Folders</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono ml-auto mr-1">
                ({allFolders.length})
              </span>
            </button>

            <button
              id="add-folder-toggle-btn"
              onClick={() => {
                if (!isFoldersOpen) setIsFoldersOpen(true);
                setShowAddFolder(!showAddFolder);
              }}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Add new folder"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isFoldersOpen && (
            <div className="mt-1 space-y-1">
              {showAddFolder && (
                <form
                  onSubmit={handleAddFolderSubmit}
                  className="px-1 py-1 mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      id="new-folder-input"
                      type="text"
                      autoFocus
                      placeholder="New folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="px-2 py-1.5 text-[11px] font-medium bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-md disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-0.5">
                {allFolders.map((folder) => {
                  const isSelected =
                    filter.folder.toLowerCase() === folder.toLowerCase() &&
                    !filter.onlyPinned;
                  const count = getFolderCount(folder);
                  const isGeneral = folder.toLowerCase() === "general";
                  const folderStyle = getFolderStyle(folder);

                  return (
                    <div
                      key={folder}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                          : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <button
                        id={`folder-btn-${folder.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => handleSelectFolder(folder)}
                        className="flex items-center gap-2.5 truncate flex-1 text-left min-w-0 py-0.5"
                      >
                        {isSelected ? (
                          <FolderOpen
                            className={`w-4 h-4 shrink-0 ${folderStyle.iconClass}`}
                          />
                        ) : (
                          <Folder
                            className={`w-4 h-4 shrink-0 ${folderStyle.iconClass}`}
                          />
                        )}
                        <span className="truncate">{folder}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono px-1 py-0.5 rounded">
                          {count}
                        </span>

                        {/* Delete folder button (for non-General folders) */}
                        {!isGeneral && onRequestDeleteFolder && (
                          <button
                            id={`delete-folder-btn-${folder.toLowerCase().replace(/\s+/g, "-")}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestDeleteFolder(folder, count);
                            }}
                            title={`Delete folder "${folder}"`}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Tags (Collapsible) */}
        <div id="sidebar-section-tags">
          <button
            id="toggle-section-tags-btn"
            onClick={toggleTags}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white uppercase tracking-wider rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
            title={isTagsOpen ? "Collapse Tags" : "Expand Tags"}
          >
            <div className="flex items-center gap-1.5">
              {isTagsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>Tags</span>
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              ({allTags.length})
            </span>
          </button>

          {isTagsOpen && (
            <div className="mt-1.5">
              {allTags.length === 0 ? (
                <p className="px-2 py-1 text-neutral-400 italic text-[11px]">
                  No tags yet. Add tags in the note editor.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
                  {allTags.map((tag) => {
                    const isSelected =
                      filter.tag?.toLowerCase() === tag.toLowerCase();
                    const count = getTagCount(tag);
                    return (
                      <button
                        key={tag}
                        id={`tag-chip-${tag.replace(/\s+/g, "-")}`}
                        onClick={() => handleSelectTag(tag)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                          isSelected
                            ? "bg-amber-400 text-neutral-950 font-medium"
                            : "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/60 dark:border-transparent"
                        }`}
                      >
                        <span>#{tag}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User / Session Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/40 shrink-0">

      {/* Theme Mode Selector Pill */}
        <div
          id="sidebar-theme-switch-container"
          className="relative flex items-center p-0.5 mb-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 transition-colors"
        >
          {/* Sliding indicator */}
          <div
            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200/80 dark:border-neutral-700/60 transition-transform duration-200 ease-out ${
              isDark ? "translate-x-full" : "translate-x-0"
            }`}
          />

          <button
            id="theme-switch-light-btn"
            type="button"
            onClick={() => setTheme("light")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              !isDark
                ? "text-neutral-900"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
            title="Switch to Light Theme"
          >
            <Sun className={`w-3 h-3 ${!isDark ? "text-amber-500" : ""}`} />
            <span>Light</span>
          </button>

          <button
            id="theme-switch-dark-btn"
            type="button"
            onClick={() => setTheme("dark")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              isDark
                ? "text-amber-300"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className={`w-3 h-3 ${isDark ? "text-amber-300" : ""}`} />
            <span>Dark</span>
          </button>
        </div>

        <button
          id="user-profile-trigger-btn"
          onClick={onOpenAuth}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors border border-neutral-200 dark:border-neutral-700/50 shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-neutral-200 dark:border-transparent">
              {user?.email ? (
                user.email[0].toUpperCase()
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-800 dark:text-white truncate">
                {user?.email
                  ? user.email
                  : user?.isAnonymous
                    ? "Guest User"
                    : "Local Workspace"}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {user
                  ? user.isAnonymous
                    ? "Temporary session"
                    : "Cloud synchronized"
                  : "Sign in to sync cloud"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
        </button>
      </div>
    </aside>
  );
};
