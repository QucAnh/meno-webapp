import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Note, SyncStatus, NoteFilter } from '../types/note';
import { useAuth } from '../context/AuthContext';
import { parseSearchQuery, matchesSearchQuery } from '../utils/searchUtils';

const DEFAULT_FOLDERS = ['General', 'Study', 'Work', 'Ideas', 'Projects'];
const LOCAL_STORAGE_KEY = 'memoflow_local_notes_v1';
const FOLDERS_STORAGE_KEY = 'memoflow_custom_folders_v1';

function getStoredFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load folders from storage:', e);
  }
  return DEFAULT_FOLDERS;
}

const INITIAL_WELCOME_NOTE: Omit<Note, 'id' | 'userId'> = {
  title: '🚀 Welcome to MemoFlow',
  content: `# Welcome to MemoFlow!

MemoFlow is your fast, minimal Markdown note-taking workspace with **instant real-time syncing** powered by Firebase Firestore.

---

### ✨ Key Features:
- **Auto-Save with 500ms Debounce**: Never lose a thought. Keystrokes sync automatically in the background.
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Helper: deduplicate notes array strictly by unique note.id and eliminate duplicate twin notes
function deduplicateNotes(list: Note[]): Note[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const result: Note[] = [];

  for (const n of list) {
    if (!n || !n.id || seenIds.has(n.id)) {
      continue;
    }
    seenIds.add(n.id);

    // Filter out duplicate default welcome notes or identical twin notes
    const isWelcome = n.title === 'Welcome to MemoFlow' || n.id.startsWith('local_welcome_');
    const signature = `${(n.title || '').trim()}:::${(n.content || '').trim()}:::${(n.folder || 'General').trim()}`;

    if (isWelcome) {
      if (seenSignatures.has('welcome_note_signature')) {
        continue;
      }
      seenSignatures.add('welcome_note_signature');
    } else if (signature.length > 10) {
      if (seenSignatures.has(signature)) {
        continue;
      }
      seenSignatures.add(signature);
    }

    result.push(n);
  }
  return result;
}

// Helper: load guest notes from localStorage
function getLocalGuestNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateNotes(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to parse local notes:', err);
  }

  // Seed default guest note
  const initialNote: Note = {
    ...INITIAL_WELCOME_NOTE,
    id: 'local_welcome_' + Date.now().toString(36),
    userId: 'guest',
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([initialNote]));
  } catch (e) {
    // Ignore localStorage quota errors
  }
  return [initialNote];
}

function saveLocalGuestNotes(notesList: Note[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deduplicateNotes(notesList)));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function useNotes() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('saved');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter state
  const [filter, setFilter] = useState<NoteFilter>({
    folder: 'all',
    tag: null,
    onlyPinned: false,
    searchQuery: '',
  });

  // Track folders list with persistent storage
  const [folderList, setFolderList] = useState<string[]>(getStoredFolders);

  // Debounce timer and pending save ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ noteId: string; updates: Partial<Note> } | null>(null);
  const isMigratingRef = useRef<boolean>(false);

  // Synchronize with Firestore (if user signed in) OR localStorage (if guest)
  useEffect(() => {
    // Wait until Firebase Auth finishes loading to avoid accidental guest seeding
    if (authLoading) {
      return;
    }

    if (!user) {
      // Guest / Local mode
      const localNotes = getLocalGuestNotes();
      setNotes(localNotes);
      setActiveNoteId((prev) => {
        if (prev && localNotes.some((n) => n.id === prev)) {
          return prev;
        }
        return localNotes.length > 0 ? localNotes[0].id : null;
      });
      setLoading(false);
      setSyncStatus('saved');
      return;
    }

    // Authenticated user with Firestore
    setLoading(true);
    setError(null);

    // If there were local guest notes, migrate them to Firestore once
    const migrateGuestNotes = async () => {
      if (isMigratingRef.current) return;
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          // Immediately remove to prevent repeat migrations
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            isMigratingRef.current = true;
            for (const note of parsed) {
              // Avoid migrating default welcome templates if user is already registered
              const isDefaultWelcome = note.id?.startsWith('local_welcome_') || note.title === 'Welcome to MemoFlow';
              if (isDefaultWelcome) {
                continue;
              }
              const notesCol = collection(db, 'notes');
              const newRef = doc(notesCol);
              const migratedNote: Note = {
                ...note,
                id: newRef.id,
                userId: user.uid,
                updatedAt: Date.now(),
              };
              await setDoc(newRef, migratedNote);
            }
          }
        }
      } catch (migrationErr) {
        console.warn('Guest notes migration note:', migrationErr);
      } finally {
        isMigratingRef.current = false;
      }
    };

    migrateGuestNotes();

    const notesColRef = collection(db, 'notes');
    const q = query(notesColRef, where('userId', '==', user.uid));

    // Real-time onSnapshot listener with automatic deduplication
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotes: Note[] = [];
        const seenIds = new Set<string>();

        snapshot.forEach((docSnapshot) => {
          if (seenIds.has(docSnapshot.id)) return;
          seenIds.add(docSnapshot.id);

          const data = docSnapshot.data();
          fetchedNotes.push({
            id: docSnapshot.id,
            title: data.title || 'Untitled Note',
            content: data.content ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            folder: data.folder || 'General',
            isPinned: Boolean(data.isPinned),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            userId: data.userId || user.uid,
          });
        });

        // Sort: Pinned first, then updatedAt descending
        fetchedNotes.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return b.updatedAt - a.updatedAt;
        });

        const deduped = deduplicateNotes(fetchedNotes);
        setNotes(deduped);
        setLoading(false);

        // If no active note is selected, or active note was deleted, select first available
        setActiveNoteId((prev) => {
          if (prev && deduped.some((n) => n.id === prev)) {
            return prev;
          }
          return deduped.length > 0 ? deduped[0].id : null;
        });

        if (!navigator.onLine) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('saved');
        }
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err);
        setError(err.message || 'Failed to fetch notes in real-time.');
        setSyncStatus('error');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [user, authLoading]);

  // Execute actual persistence (Firestore or localStorage)
  const executeSave = useCallback(
    async (noteId: string, updates: Partial<Note>) => {
      try {
        if (!navigator.onLine) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('saving');
        }

        const dataToSave = {
          ...updates,
          updatedAt: Date.now(),
        };

        // Always update React state optimistically
        setNotes((prevNotes) =>
          deduplicateNotes(
            prevNotes.map((n) => (n.id === noteId ? { ...n, ...dataToSave } : n))
          )
        );

        if (user) {
          // Cloud Firestore update using setDoc with merge: true to avoid document missing errors
          const noteDocRef = doc(db, 'notes', noteId);
          await setDoc(noteDocRef, dataToSave, { merge: true });
        } else {
          // Local storage update
          setNotes((curr) => {
            const updated = curr.map((n) => (n.id === noteId ? { ...n, ...dataToSave } : n));
            saveLocalGuestNotes(updated);
            return updated;
          });
        }

        if (navigator.onLine) {
          setSyncStatus('saved');
        } else {
          setSyncStatus('offline');
        }
      } catch (err: any) {
        console.error('Error saving note:', err);
        setError(err.message || 'Error saving note');
        setSyncStatus('error');
      }
    },
    [user]
  );

  // Auto-save with 500ms debounce
  const updateNote = useCallback(
    (noteId: string, updates: Partial<Note>, debounceMs: number = 500) => {
      // Immediately reflect changes in local state for instantaneous typing responsiveness
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );

      setSyncStatus(navigator.onLine ? 'saving' : 'offline');

      // Stash pending updates
      pendingUpdatesRef.current = {
        noteId,
        updates: {
          ...(pendingUpdatesRef.current?.noteId === noteId
            ? pendingUpdatesRef.current.updates
            : {}),
          ...updates,
        },
      };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingUpdatesRef.current) {
          const { noteId: idToSave, updates: dataToSave } = pendingUpdatesRef.current;
          pendingUpdatesRef.current = null;
          executeSave(idToSave, dataToSave);
        }
      }, debounceMs);
    },
    [executeSave]
  );

  // Immediate save (e.g. on Cmd+S or note switch)
  const saveNoteImmediate = useCallback(
    async (noteId: string, updates?: Partial<Note>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      const dataToSave = updates || pendingUpdatesRef.current?.updates || {};
      pendingUpdatesRef.current = null;
      await executeSave(noteId, dataToSave);
    },
    [executeSave]
  );

  // Create a new note
  const createNote = useCallback(
    async (initialData?: Partial<Note>): Promise<string | null> => {
      try {
        setSyncStatus('saving');

        if (user) {
          // Cloud Firestore create
          const notesColRef = collection(db, 'notes');
          const newDocRef = doc(notesColRef); // unique ID

          const newNote: Note = {
            id: newDocRef.id,
            title: initialData?.title?.trim() || 'Untitled Note',
            content:
              initialData?.content ??
              '# Welcome to MemoFlow\n\nStart typing Markdown here...',
            tags: initialData?.tags || ['general'],
            folder:
              initialData?.folder ||
              (filter.folder !== 'all' ? filter.folder : 'General'),
            isPinned: initialData?.isPinned ?? false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId: user.uid,
          };

          await setDoc(newDocRef, newNote);

          // Optimistically add while guarding against duplicate insertion
          setNotes((prev) => {
            if (prev.some((n) => n.id === newNote.id)) {
              return prev;
            }
            return [newNote, ...prev];
          });
          setActiveNoteId(newNote.id);
          setSyncStatus('saved');
          return newNote.id;
        } else {
          // Guest / Local create
          const localId = 'note_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
          const newNote: Note = {
            id: localId,
            title: initialData?.title?.trim() || 'Untitled Note',
            content:
              initialData?.content ??
              '# Welcome to MemoFlow\n\nStart typing Markdown here...',
            tags: initialData?.tags || ['general'],
            folder:
              initialData?.folder ||
              (filter.folder !== 'all' ? filter.folder : 'General'),
            isPinned: initialData?.isPinned ?? false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId: 'guest',
          };

          setNotes((prev) => {
            const nextList = [newNote, ...prev.filter((n) => n.id !== newNote.id)];
            saveLocalGuestNotes(nextList);
            return nextList;
          });
          setActiveNoteId(newNote.id);
          setSyncStatus('saved');
          return newNote.id;
        }
      } catch (err: any) {
        console.error('Error creating note:', err);
        setError(err.message || 'Failed to create note.');
        setSyncStatus('error');
        return null;
      }
    },
    [user, filter.folder]
  );

  // Delete note
  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        setSyncStatus('saving');

        if (user) {
          const noteDocRef = doc(db, 'notes', noteId);
          await deleteDoc(noteDocRef);
        }

        setNotes((prev) => {
          const remaining = prev.filter((n) => n.id !== noteId);
          if (!user) {
            saveLocalGuestNotes(remaining);
          }
          if (activeNoteId === noteId) {
            setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
          }
          return remaining;
        });

        setSyncStatus('saved');
      } catch (err: any) {
        console.error('Error deleting note:', err);
        setError(err.message || 'Failed to delete note.');
        setSyncStatus('error');
      }
    },
    [user, activeNoteId]
  );

  // Toggle pinned status
  const togglePin = useCallback(
    async (noteId: string) => {
      const targetNote = notes.find((n) => n.id === noteId);
      if (!targetNote) return;

      const newPinned = !targetNote.isPinned;
      await executeSave(noteId, { isPinned: newPinned });
    },
    [notes, executeSave]
  );

  // Aggregate tags from all existing notes (case-normalized, unique)
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => {
          if (typeof t === 'string' && t.trim()) {
            tagSet.add(t.trim().toLowerCase());
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Aggregate folders with General guaranteed first, user's folders, plus notes folders
  const allFolders = useMemo(() => {
    const folderMap = new Map<string, string>();
    // Always start with General
    folderMap.set('general', 'General');

    // Add persistent folder list
    folderList.forEach((f) => {
      if (f && typeof f === 'string' && f.trim()) {
        const trimmed = f.trim();
        folderMap.set(trimmed.toLowerCase(), trimmed);
      }
    });

    // Add folders from notes
    notes.forEach((n) => {
      if (n.folder && typeof n.folder === 'string' && n.folder.trim()) {
        const trimmed = n.folder.trim();
        const lower = trimmed.toLowerCase();
        if (!folderMap.has(lower)) {
          folderMap.set(lower, trimmed);
        }
      }
    });

    const general = folderMap.get('general') || 'General';
    const rest = Array.from(folderMap.values())
      .filter((f) => f.toLowerCase() !== 'general')
      .sort((a, b) => a.localeCompare(b));

    return [general, ...rest];
  }, [folderList, notes]);

  // Add custom folder
  const addFolder = useCallback(
    (folderName: string): boolean => {
      const trimmed = folderName.trim();
      if (!trimmed) return false;

      const lower = trimmed.toLowerCase();
      if (allFolders.some((f) => f.toLowerCase() === lower)) {
        return false;
      }

      setFolderList((prev) => {
        const next = [...prev, trimmed];
        try {
          localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save folders list:', e);
        }
        return next;
      });
      return true;
    },
    [allFolders]
  );

  // Delete folder & safely migrate notes to 'General'
  const deleteFolder = useCallback(
    async (folderToDelete: string): Promise<number> => {
      const targetLower = folderToDelete.trim().toLowerCase();
      if (targetLower === 'general') {
        // Prevent deleting root fallback folder
        return 0;
      }

      // Find affected notes
      const affected = notes.filter(
        (n) => n.folder && n.folder.trim().toLowerCase() === targetLower
      );

      // Reassign affected notes to 'General'
      if (affected.length > 0) {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.folder.trim().toLowerCase() === targetLower
              ? { ...n, folder: 'General', updatedAt: Date.now() }
              : n
          )
        );

        if (user) {
          try {
            await Promise.all(
              affected.map((n) =>
                updateDoc(doc(db, 'notes', n.id), {
                  folder: 'General',
                  updatedAt: Date.now(),
                })
              )
            );
          } catch (err) {
            console.error('Failed to move notes to General in Firestore:', err);
          }
        } else {
          const updated = notes.map((n) =>
            n.folder.trim().toLowerCase() === targetLower
              ? { ...n, folder: 'General', updatedAt: Date.now() }
              : n
          );
          saveLocalGuestNotes(updated);
        }
      }

      // Remove from folderList
      setFolderList((prev) => {
        const next = prev.filter((f) => f.trim().toLowerCase() !== targetLower);
        try {
          localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save folders after delete:', e);
        }
        return next;
      });

      // If active filter was this folder, reset to 'all'
      setFilter((prev) => {
        if (prev.folder.trim().toLowerCase() === targetLower) {
          return { ...prev, folder: 'all' };
        }
        return prev;
      });

      return affected.length;
    },
    [notes, user]
  );

  // Parse search query into structured tags, folders, and keyword terms
  const parsedSearch = useMemo(() => {
    return parseSearchQuery(filter.searchQuery);
  }, [filter.searchQuery]);

  // Filtered notes according to folder, tags, pinned status, search query with strict deduplication
  const filteredNotes = useMemo(() => {
    const dedupedList = deduplicateNotes(notes);
    return dedupedList.filter((n) => {
      // Folder filter
      if (filter.folder !== 'all' && n.folder.toLowerCase() !== filter.folder.toLowerCase()) {
        return false;
      }

      // Tag filter
      if (filter.tag && !n.tags.map((t) => t.toLowerCase()).includes(filter.tag.toLowerCase())) {
        return false;
      }

      // Only pinned filter
      if (filter.onlyPinned && !n.isPinned) {
        return false;
      }

      // Advanced search query filter (supports keyword, #tags, keyword:#tags, tag:name, folder:name)
      if (parsedSearch.raw) {
        if (!matchesSearchQuery(n, parsedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [notes, filter.folder, filter.tag, filter.onlyPinned, parsedSearch]);

  // Active note object
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  return {
    notes,
    filteredNotes,
    parsedSearch,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    loading,
    error,
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
    clearError: () => setError(null),
  };
}
