import { Note } from "../types/note";
import { deduplicateNotes, isWelcomeNote } from "./notes";

export type LocalNotesRead =
  | { kind: "none" }
  | { kind: "unreadable" }
  | { kind: "notes"; notes: Note[] };

/**
 * Read the browser-local note payload.
 *
 * `none` means nothing was stored, `unreadable` means the payload cannot be
 * used at all, and `notes` holds the notes that are worth migrating —
 * duplicates collapsed and the welcome template removed.
 */
export function readMigratableNotes(raw: string | null): LocalNotesRead {
  if (!raw) {
    return { kind: "none" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "unreadable" };
  }

  if (!Array.isArray(parsed)) {
    return { kind: "unreadable" };
  }

  const notes = deduplicateNotes(parsed as Note[]).filter(
    (note) => !isWelcomeNote(note),
  );
  return { kind: "notes", notes };
}

export interface MigrationResult {
  /** Notes handed to `writeNote` before the loop finished. */
  migrated: number;
  /** True when a write failed and the local copy was kept as the only copy. */
  keptLocalCopy: boolean;
  /** True when the stored payload was unusable and was discarded. */
  discardedUnreadable: boolean;
}

export interface MigrationDeps {
  raw: string | null;
  writeNote: (note: Note) => Promise<void>;
  removeLocalCopy: () => void;
}

/**
 * Move browser-local notes into the signed-in account.
 *
 * The local copy is removed only after every write succeeds, so a failure
 * returns `keptLocalCopy: true` and the notes stay in the browser for a retry
 * on the next sign-in.
 */
export async function migrateLocalNotes({
  raw,
  writeNote,
  removeLocalCopy,
}: MigrationDeps): Promise<MigrationResult> {
  const read = readMigratableNotes(raw);

  if (read.kind === "none") {
    return { migrated: 0, keptLocalCopy: false, discardedUnreadable: false };
  }

  if (read.kind === "unreadable") {
    removeLocalCopy();
    return { migrated: 0, keptLocalCopy: false, discardedUnreadable: true };
  }

  if (read.notes.length === 0) {
    removeLocalCopy();
    return { migrated: 0, keptLocalCopy: false, discardedUnreadable: false };
  }

  let migrated = 0;
  try {
    for (const note of read.notes) {
      await writeNote(note);
      migrated += 1;
    }
  } catch (err) {
    console.warn("Local notes migration failed; local copy kept:", err);
    return { migrated, keptLocalCopy: true, discardedUnreadable: false };
  }

  removeLocalCopy();
  return { migrated, keptLocalCopy: false, discardedUnreadable: false };
}
