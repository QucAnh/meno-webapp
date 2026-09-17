import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useNotes } from './hooks/useNotes';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { EditorSplitView } from './components/EditorSplitView';
import { AuthModal } from './components/AuthModal';
import { ConfirmDeleteModal, DeleteTarget } from './components/ConfirmDeleteModal';
import { Menu, Plus, WifiOff, AlertCircle } from 'lucide-react';

const INITIAL_WELCOME_NOTE = {
  title: '🚀 Welcome to MemoFlow',
  content: `# Welcome to MemoFlow!

MemoFlow is your fast, minimal Markdown note-taking workspace with **instant real-time syncing** powered by Firebase Firestore.

---

### ✨ Key Features:
- **Auto-Save with 500ms Debounce**: Never lose a thought. Every keystroke syncs automatically in the background.
- **Real-Time onSnapshot**: Live synchronization across desktop and mobile tabs.
- **Split Markdown Layout**: Live preview rendered in real-time as you write.
- **Organization**: Categorize notes into notebook folders and filter by #tags.
- **Pinning**: Star important notes to keep them pinned at the top.

---

### 📝 Markdown Cheat Sheet:
- **Bold text**: \`**bold**\`
- *Italic text*: \`*italic*\`
- > Blockquote: Start line with \`> \`
- \`inline code\`: Wrap in single backticks
- Code blocks:
\`\`\`typescript
const sync = async (note: Note) => {
  await updateDoc(doc(db, 'notes', note.id), note);
};
\`\`\`

- [x] Create first note
- [ ] Try keyboard shortcut **⌘ + N** for a new note
- [ ] Try **⌘ + S** to force immediate save

Happy writing!`,
  tags: ['getting-started', 'guide'],
  folder: 'General',
  isPinned: true,
};

function MemoFlowWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const {
    notes,
    filteredNotes,
    parsedSearch,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    loading: notesLoading,
    error: notesError,
    syncStatus,
    isOnline,
    filter,
    setFilter,
    allTags,
    allFolders,
    addFolder,
    deleteFolder,
    createNote,
    updateNote,
    saveNoteImmediate,
    deleteNote,
    togglePin,
    clearError,
  } = useNotes();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const welcomeSeededRef = React.useRef(false);

  // Sidebar collapse state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('memoflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('memoflow_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seed initial welcome note if signed-in user has zero notes and both auth and notes have finished loading
  useEffect(() => {
    if (!notesLoading && !authLoading && user && notes.length === 0 && !welcomeSeededRef.current) {
      welcomeSeededRef.current = true;
      createNote(INITIAL_WELCOME_NOTE);
    }
  }, [notesLoading, authLoading, user, notes.length, createNote]);

  // Global keyboard shortcuts (Cmd+N, Cmd+\ to toggle sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      } else if (isCmdOrCtrl && e.key === '\\') {
        e.preventDefault();
        handleToggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, handleToggleSidebarCollapse]);

  const handleCreateNewNote = async () => {
    const newId = await createNote();
    if (newId) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Open note delete confirmation modal
  const handleRequestDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = notes.find((n) => n.id === noteId);
    setDeleteTarget({
      type: 'note',
      id: noteId,
      title: target?.title || 'Untitled Note',
    });
  };

  // Open folder delete confirmation modal
  const handleRequestDeleteFolder = (folderName: string, notesCount: number) => {
    setDeleteTarget({
      type: 'folder',
      name: folderName,
      notesCount,
    });
  };

  // Confirm delete handler (works for both note and folder)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'note') {
        await deleteNote(deleteTarget.id);
      } else if (deleteTarget.type === 'folder') {
        await deleteFolder(deleteTarget.name);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to complete delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePinNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePin(noteId);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 font-sans text-neutral-900">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div
          id="offline-banner"
          className="bg-neutral-900 text-amber-300 text-xs px-4 py-1.5 flex items-center justify-center gap-2 border-b border-neutral-800 shrink-0"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline. Edits are safely stored locally and will sync once reconnected.</span>
        </div>
      )}

      {/* Error Alert Strip */}
      {notesError && (
        <div
          id="notes-error-banner"
          className="bg-rose-600 text-white text-xs px-4 py-1.5 flex items-center justify-between gap-2 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{notesError}</span>
          </div>
          <button
            onClick={clearError}
            className="text-white/80 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Top Navbar */}
      <header className="md:hidden h-12 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-4 flex items-center justify-between shrink-0 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white rounded-md"
            title="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-tight">MemoFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="mobile-create-note-btn"
            onClick={handleCreateNewNote}
            className="p-1.5 bg-amber-400 text-neutral-950 rounded-lg text-xs font-semibold flex items-center gap-1"
            title="New note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar + NotesList + Split Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          notes={notes}
          filter={filter}
          setFilter={setFilter}
          allTags={allTags}
          allFolders={allFolders}
          onCreateNote={handleCreateNewNote}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          onAddFolder={addFolder}
          onRequestDeleteFolder={handleRequestDeleteFolder}
        />

        {/* Mobile backdrop for sidebar drawer */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-20 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Middle Column: Notes List */}
        <NotesList
          notes={filteredNotes}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => setActiveNoteId(id)}
          onTogglePin={handleTogglePinNote}
          onDeleteNote={(id, e) => handleRequestDeleteNote(id, e)}
          onCreateNote={handleCreateNewNote}
          filter={filter}
          setFilter={setFilter}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          parsedSearch={parsedSearch}
        />

        {/* Right Area: Markdown Editor + Live Rendered Preview */}
        <EditorSplitView
          note={activeNote}
          onUpdateNote={updateNote}
          onSaveImmediate={saveNoteImmediate}
          onTogglePin={togglePin}
          onDeleteNote={(id) => handleRequestDeleteNote(id)}
          syncStatus={syncStatus}
          allFolders={allFolders}
          errorMessage={notesError}
        />
      </div>

      {/* Custom Confirmation Modal for Deleting Notes & Folders */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        target={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MemoFlowWorkspace />
      </ThemeProvider>
    </AuthProvider>
  );
}
