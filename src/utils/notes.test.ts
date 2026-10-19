import { describe, expect, it } from "vitest";
import {
  deduplicateNotes,
  filterNotes,
  isWelcomeNote,
  sortNotes,
} from "./notes";
import { parseSearchQuery } from "./searchUtils";
import { makeNote } from "../test/factories";
import { NoteFilter } from "../types/note";

const noFilter: NoteFilter = {
  folder: "all",
  tag: null,
  onlyPinned: false,
  searchQuery: "",
};

describe("deduplicateNotes", () => {
  it("drops repeated ids", () => {
    const notes = [
      makeNote({ id: "a", title: "First", content: "One" }),
      makeNote({ id: "b", title: "Second", content: "Two" }),
      makeNote({ id: "a", title: "First", content: "One" }),
    ];

    expect(deduplicateNotes(notes).map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("collapses twin notes that share title, content and folder", () => {
    const notes = [
      makeNote({ id: "a", title: "Twin", content: "Same body" }),
      makeNote({ id: "b", title: "Twin", content: "Same body" }),
    ];

    expect(deduplicateNotes(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("keeps a single copy of the welcome template", () => {
    const notes = [
      makeNote({ id: "local_welcome_1", title: "🚀 Welcome to MemoFlow" }),
      makeNote({ id: "local_welcome_2", title: "🚀 Welcome to MemoFlow" }),
    ];

    expect(deduplicateNotes(notes).map((n) => n.id)).toEqual([
      "local_welcome_1",
    ]);
  });

  it("drops entries without an id", () => {
    const notes = [makeNote({ id: "" }), makeNote({ id: "kept" })];

    expect(deduplicateNotes(notes).map((n) => n.id)).toEqual(["kept"]);
  });

  it("keeps distinct notes", () => {
    const notes = [
      makeNote({ id: "a", title: "Alpha", content: "Alpha body" }),
      makeNote({ id: "b", title: "Beta", content: "Beta body" }),
    ];

    expect(deduplicateNotes(notes)).toHaveLength(2);
  });
});

describe("sortNotes", () => {
  it("puts pinned notes first, then most recently updated", () => {
    const notes = [
      makeNote({ id: "recent", updatedAt: 50 }),
      makeNote({ id: "older", updatedAt: 10 }),
      makeNote({ id: "pinned", isPinned: true, updatedAt: 1 }),
    ];

    expect(sortNotes(notes).map((n) => n.id)).toEqual([
      "pinned",
      "recent",
      "older",
    ]);
  });

  it("leaves the input array untouched", () => {
    const notes = [makeNote({ id: "a", updatedAt: 1 }), makeNote({ id: "b", updatedAt: 2 })];
    sortNotes(notes);

    expect(notes.map((n) => n.id)).toEqual(["a", "b"]);
  });
});

describe("filterNotes", () => {
  const studyIdeas = makeNote({
    id: "study",
    folder: "Study",
    tags: ["Ideas"],
  });
  const workIdeas = makeNote({
    id: "work",
    folder: "Work",
    tags: ["ideas"],
    isPinned: true,
  });
  const general = makeNote({ id: "general", folder: "General" });
  const notes = [studyIdeas, workIdeas, general];

  it("returns everything for the default filter", () => {
    expect(filterNotes(notes, noFilter, parseSearchQuery(""))).toHaveLength(3);
  });

  it("matches the folder filter case-insensitively", () => {
    const filter = { ...noFilter, folder: "study" };

    expect(
      filterNotes(notes, filter, parseSearchQuery("")).map((n) => n.id),
    ).toEqual(["study"]);
  });

  it("matches the tag filter case-insensitively", () => {
    const filter = { ...noFilter, tag: "IDEAS" };

    expect(
      filterNotes(notes, filter, parseSearchQuery("")).map((n) => n.id),
    ).toEqual(["study", "work"]);
  });

  it("filters to pinned notes only", () => {
    const filter = { ...noFilter, onlyPinned: true };

    expect(
      filterNotes(notes, filter, parseSearchQuery("")).map((n) => n.id),
    ).toEqual(["work"]);
  });

  it("applies a #tag search term", () => {
    expect(
      filterNotes(notes, noFilter, parseSearchQuery("#ideas")).map((n) => n.id),
    ).toEqual(["study", "work"]);
  });

  it("applies a keyword search term", () => {
    expect(
      filterNotes(notes, noFilter, parseSearchQuery("work")).map((n) => n.id),
    ).toEqual(["work"]);
  });

  it("collapses duplicates before filtering", () => {
    expect(
      filterNotes([studyIdeas, studyIdeas], noFilter, parseSearchQuery("")),
    ).toHaveLength(1);
  });
});

describe("isWelcomeNote", () => {
  it("recognises the locally seeded welcome id", () => {
    expect(isWelcomeNote(makeNote({ id: "local_welcome_abc" }))).toBe(true);
  });

  it("recognises the plain welcome title used by older copies", () => {
    expect(isWelcomeNote(makeNote({ title: "Welcome to MemoFlow" }))).toBe(true);
  });

  it("does not match the current emoji title on its own", () => {
    expect(isWelcomeNote(makeNote({ title: "🚀 Welcome to MemoFlow" }))).toBe(
      false,
    );
  });
});
