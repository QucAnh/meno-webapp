import { describe, expect, it, vi } from "vitest";
import { migrateLocalNotes, readMigratableNotes } from "./migration";
import { makeNote } from "../test/factories";

const storedNote = makeNote({ id: "local_1", title: "Groceries", content: "Milk" });
const welcomeNote = makeNote({
  id: "local_welcome_1",
  title: "🚀 Welcome to MemoFlow",
});

describe("readMigratableNotes", () => {
  it("reports nothing stored", () => {
    expect(readMigratableNotes(null)).toEqual({ kind: "none" });
  });

  it("reports an unparseable payload", () => {
    expect(readMigratableNotes("{not json")).toEqual({ kind: "unreadable" });
  });

  it("reports a payload that is not an array", () => {
    expect(readMigratableNotes('{"id":"a"}')).toEqual({ kind: "unreadable" });
  });

  it("returns an empty list for an empty array", () => {
    expect(readMigratableNotes("[]")).toEqual({ kind: "notes", notes: [] });
  });

  it("skips the welcome template", () => {
    const read = readMigratableNotes(JSON.stringify([welcomeNote, storedNote]));

    expect(read.kind).toBe("notes");
    if (read.kind === "notes") {
      expect(read.notes.map((n) => n.id)).toEqual(["local_1"]);
    }
  });

  it("collapses duplicates", () => {
    const read = readMigratableNotes(JSON.stringify([storedNote, storedNote]));

    expect(read.kind).toBe("notes");
    if (read.kind === "notes") {
      expect(read.notes).toHaveLength(1);
    }
  });
});

describe("migrateLocalNotes", () => {
  it("writes every note and then clears the local copy", async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const removeLocalCopy = vi.fn();
    const notes = [
      storedNote,
      makeNote({ id: "local_2", title: "Notes", content: "Bread" }),
    ];

    const result = await migrateLocalNotes({
      raw: JSON.stringify(notes),
      writeNote,
      removeLocalCopy,
    });

    expect(writeNote).toHaveBeenCalledTimes(2);
    expect(removeLocalCopy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      migrated: 2,
      keptLocalCopy: false,
      discardedUnreadable: false,
    });
  });

  it("keeps the local copy when a write fails", async () => {
    const writeNote = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));
    const removeLocalCopy = vi.fn();
    const notes = [
      storedNote,
      makeNote({ id: "local_2", title: "Notes", content: "Bread" }),
    ];

    const result = await migrateLocalNotes({
      raw: JSON.stringify(notes),
      writeNote,
      removeLocalCopy,
    });

    expect(writeNote).toHaveBeenCalledTimes(2);
    expect(removeLocalCopy).not.toHaveBeenCalled();
    expect(result).toEqual({
      migrated: 1,
      keptLocalCopy: true,
      discardedUnreadable: false,
    });
  });

  it("does nothing when there is no stored payload", async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const removeLocalCopy = vi.fn();

    const result = await migrateLocalNotes({
      raw: null,
      writeNote,
      removeLocalCopy,
    });

    expect(writeNote).not.toHaveBeenCalled();
    expect(removeLocalCopy).not.toHaveBeenCalled();
    expect(result).toEqual({
      migrated: 0,
      keptLocalCopy: false,
      discardedUnreadable: false,
    });
  });

  it("discards an unreadable payload", async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const removeLocalCopy = vi.fn();

    const result = await migrateLocalNotes({
      raw: "{not json",
      writeNote,
      removeLocalCopy,
    });

    expect(writeNote).not.toHaveBeenCalled();
    expect(removeLocalCopy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      migrated: 0,
      keptLocalCopy: false,
      discardedUnreadable: true,
    });
  });

  it("clears the local copy when only the welcome template is stored", async () => {
    const writeNote = vi.fn().mockResolvedValue(undefined);
    const removeLocalCopy = vi.fn();

    const result = await migrateLocalNotes({
      raw: JSON.stringify([welcomeNote]),
      writeNote,
      removeLocalCopy,
    });

    expect(writeNote).not.toHaveBeenCalled();
    expect(removeLocalCopy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      migrated: 0,
      keptLocalCopy: false,
      discardedUnreadable: false,
    });
  });
});
