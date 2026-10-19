import { describe, expect, it } from "vitest";
import { matchesSearchQuery, parseSearchQuery } from "./searchUtils";
import { makeNote } from "../test/factories";

describe("parseSearchQuery", () => {
  it("returns no terms for an empty query", () => {
    const parsed = parseSearchQuery("   ");

    expect(parsed.raw).toBe("");
    expect(parsed.allTerms).toEqual([]);
  });

  it("splits plain keywords", () => {
    expect(parseSearchQuery("hello world").keywordTerms).toEqual([
      "hello",
      "world",
    ]);
  });

  it("reads #tags", () => {
    expect(parseSearchQuery("#react #frontend").tagTerms).toEqual([
      "react",
      "frontend",
    ]);
  });

  it("reads tag: and tags:", () => {
    expect(parseSearchQuery("tags:Ideas").tagTerms).toEqual(["ideas"]);
  });

  it("reads keyword:#tag pairs", () => {
    const parsed = parseSearchQuery("meeting:#work");

    expect(parsed.keywordTerms).toEqual(["meeting"]);
    expect(parsed.tagTerms).toEqual(["work"]);
  });

  it("reads folder: and @folder", () => {
    expect(parseSearchQuery("folder:Study").folderTerms).toEqual(["study"]);
    expect(parseSearchQuery("@work").folderTerms).toEqual(["work"]);
  });

  it("keeps a quoted phrase together", () => {
    const parsed = parseSearchQuery('"hello world" more');

    expect(parsed.keywordTerms).toEqual(["hello world", "more"]);
  });

  it("de-duplicates terms", () => {
    expect(parseSearchQuery("react react #react").keywordTerms).toEqual([
      "react",
    ]);
    expect(parseSearchQuery("react react #react").tagTerms).toEqual(["react"]);
  });
});

describe("matchesSearchQuery", () => {
  it("matches everything when the query is empty", () => {
    expect(matchesSearchQuery(makeNote(), parseSearchQuery(""))).toBe(true);
  });

  it("matches a keyword in the body", () => {
    const note = makeNote({ content: "Remember the milk" });

    expect(matchesSearchQuery(note, parseSearchQuery("milk"))).toBe(true);
    expect(matchesSearchQuery(note, parseSearchQuery("bread"))).toBe(false);
  });

  it("matches a keyword in the folder", () => {
    const note = makeNote({ folder: "Study", content: "x" });

    expect(matchesSearchQuery(note, parseSearchQuery("study"))).toBe(true);
  });

  it("requires every #tag to match", () => {
    const note = makeNote({ tags: ["Ideas", "Work"] });

    expect(matchesSearchQuery(note, parseSearchQuery("#ideas"))).toBe(true);
    expect(matchesSearchQuery(note, parseSearchQuery("#ideas #work"))).toBe(true);
    expect(matchesSearchQuery(note, parseSearchQuery("#holiday"))).toBe(false);
  });

  it("matches the folder term", () => {
    const note = makeNote({ folder: "Study" });

    expect(matchesSearchQuery(note, parseSearchQuery("@study"))).toBe(true);
    expect(matchesSearchQuery(note, parseSearchQuery("@work"))).toBe(false);
  });
});
