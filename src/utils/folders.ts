import { Note } from "../types/note";

export const DEFAULT_FOLDERS = [
  "General",
  "Study",
  "Work",
  "Ideas",
  "Projects",
];

/**
 * Folder list for the sidebar: General first, then the user's stored folders
 * and any folder a note already uses, sorted and de-duplicated
 * case-insensitively.
 */
export function buildFolderList(storedFolders: string[], notes: Note[]): string[] {
  const folderMap = new Map<string, string>();
  folderMap.set("general", "General");

  storedFolders.forEach((f) => {
    if (f && typeof f === "string" && f.trim()) {
      const trimmed = f.trim();
      const lower = trimmed.toLowerCase();
      // First spelling wins, so the canonical "General" is never replaced by a
      // lower-case copy of the same name.
      if (!folderMap.has(lower)) {
        folderMap.set(lower, trimmed);
      }
    }
  });

  notes.forEach((n) => {
    if (n.folder && typeof n.folder === "string" && n.folder.trim()) {
      const trimmed = n.folder.trim();
      const lower = trimmed.toLowerCase();
      if (!folderMap.has(lower)) {
        folderMap.set(lower, trimmed);
      }
    }
  });

  const general = folderMap.get("general") || "General";
  const rest = Array.from(folderMap.values())
    .filter((f) => f.toLowerCase() !== "general")
    .sort((a, b) => a.localeCompare(b));

  return [general, ...rest];
}

export function hasFolder(folders: string[], name: string): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return false;
  return folders.some((f) => f.toLowerCase() === lower);
}

/** Returns the list unchanged when the name is blank or already present. */
export function addFolderToList(folders: string[], name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed || hasFolder(folders, trimmed)) {
    return folders;
  }
  return [...folders, trimmed];
}

export function removeFolderFromList(folders: string[], name: string): string[] {
  const lower = name.trim().toLowerCase();
  return folders.filter((f) => f.trim().toLowerCase() !== lower);
}

export function selectNotesInFolder(notes: Note[], name: string): Note[] {
  const lower = name.trim().toLowerCase();
  return notes.filter(
    (n) => n.folder && n.folder.trim().toLowerCase() === lower,
  );
}
