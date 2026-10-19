import { Note } from "../types/note";

/** Build a Note for tests. Every field can be overridden. */
export function makeNote(overrides: Partial<Note> = {}): Note {
  const id = overrides.id ?? "note-1";
  return {
    id,
    title: `Note ${id}`,
    content: `Body of ${id}`,
    tags: [],
    folder: "General",
    isPinned: false,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    userId: "user-1",
    ...overrides,
  };
}
