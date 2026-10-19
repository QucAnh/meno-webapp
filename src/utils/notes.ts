import { Note, NoteFilter } from "../types/note";
import { ParsedSearchQuery, matchesSearchQuery } from "./searchUtils";

/** Title of the seeded welcome note, including copies stored without the emoji prefix. */
const WELCOME_TITLE = "Welcome to MemoFlow";

/** Id prefix used by welcome notes seeded in the browser-local workspace. */
const LOCAL_WELCOME_ID_PREFIX = "local_welcome_";

export function isWelcomeNote(note: Note): boolean {
  return (
    note.title === WELCOME_TITLE ||
    Boolean(note.id?.startsWith(LOCAL_WELCOME_ID_PREFIX))
  );
}

/**
 * Deduplicate by note id, and collapse twin notes that share a
 * title+content+folder signature. Repeated copies of the welcome template
 * collapse into one.
 */
export function deduplicateNotes(list: Note[]): Note[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const result: Note[] = [];

  for (const n of list) {
    if (!n || !n.id || seenIds.has(n.id)) {
      continue;
    }
    seenIds.add(n.id);

    const signature = `${(n.title || "").trim()}:::${(n.content || "").trim()}:::${(n.folder || "General").trim()}`;

    if (isWelcomeNote(n)) {
      if (seenSignatures.has("welcome_note_signature")) {
        continue;
      }
      seenSignatures.add("welcome_note_signature");
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

/** Pinned notes first, then most recently updated. */
export function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

/** Apply the active folder, tag, pin and search filters. Duplicates are collapsed first. */
export function filterNotes(
  notes: Note[],
  filter: NoteFilter,
  parsedSearch: ParsedSearchQuery,
): Note[] {
  return deduplicateNotes(notes).filter((n) => {
    if (
      filter.folder !== "all" &&
      n.folder.toLowerCase() !== filter.folder.toLowerCase()
    ) {
      return false;
    }

    if (
      filter.tag &&
      !n.tags.map((t) => t.toLowerCase()).includes(filter.tag.toLowerCase())
    ) {
      return false;
    }

    if (filter.onlyPinned && !n.isPinned) {
      return false;
    }

    if (parsedSearch.raw && !matchesSearchQuery(n, parsedSearch)) {
      return false;
    }

    return true;
  });
}
