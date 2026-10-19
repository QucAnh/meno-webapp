import { describe, expect, it } from "vitest";
import {
  addFolderToList,
  buildFolderList,
  hasFolder,
  removeFolderFromList,
  selectNotesInFolder,
} from "./folders";
import { makeNote } from "../test/factories";

describe("buildFolderList", () => {
  it("starts with General when nothing is stored", () => {
    expect(buildFolderList([], [])).toEqual(["General"]);
  });

  it("keeps General first and sorts the rest", () => {
    const notes = [makeNote({ folder: "Reading" })];

    expect(buildFolderList(["Study"], notes)).toEqual([
      "General",
      "Reading",
      "Study",
    ]);
  });

  it("treats a stored folder and a note folder as the same folder", () => {
    const notes = [makeNote({ folder: "ideas" })];

    expect(buildFolderList(["Ideas"], notes)).toEqual(["General", "Ideas"]);
  });

  it("normalises a stored general entry", () => {
    expect(buildFolderList(["general"], [])).toEqual(["General"]);
  });

  it("keeps the first spelling when stored names differ only by case", () => {
    expect(buildFolderList(["Study", "study"], [])).toEqual([
      "General",
      "Study",
    ]);
  });
});

describe("hasFolder", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(hasFolder(["Study"], "  study ")).toBe(true);
  });

  it("rejects blank names", () => {
    expect(hasFolder(["Study"], "   ")).toBe(false);
  });

  it("rejects unknown names", () => {
    expect(hasFolder(["Study"], "Math")).toBe(false);
  });
});

describe("addFolderToList", () => {
  it("appends a trimmed name", () => {
    expect(addFolderToList(["Study"], "  Math  ")).toEqual(["Study", "Math"]);
  });

  it("returns the list unchanged when the name already exists", () => {
    const folders = ["Study"];

    expect(addFolderToList(folders, "study")).toBe(folders);
  });

  it("returns the list unchanged when the name is blank", () => {
    const folders = ["Study"];

    expect(addFolderToList(folders, "  ")).toBe(folders);
  });
});

describe("removeFolderFromList", () => {
  it("removes case-insensitively and keeps the rest", () => {
    expect(removeFolderFromList(["General", "Study", "Work"], " study ")).toEqual(
      ["General", "Work"],
    );
  });
});

describe("selectNotesInFolder", () => {
  it("matches case-insensitively", () => {
    const notes = [
      makeNote({ id: "a", folder: "Study" }),
      makeNote({ id: "b", folder: "study" }),
      makeNote({ id: "c", folder: "Work" }),
    ];

    expect(selectNotesInFolder(notes, "STUDY").map((n) => n.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("ignores notes without a folder", () => {
    expect(selectNotesInFolder([makeNote({ folder: "" })], "Study")).toEqual([]);
  });
});
