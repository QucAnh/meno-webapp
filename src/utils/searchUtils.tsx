import React from 'react';
import { Note } from '../types/note';

export interface ParsedSearchQuery {
  raw: string;
  tagTerms: string[];
  folderTerms: string[];
  keywordTerms: string[];
  allTerms: string[];
}

/**
 * Parses advanced search queries:
 * Examples:
 * - `hello world` -> keywords: ['hello', 'world']
 * - `#react #frontend` -> tags: ['react', 'frontend']
 * - `tag:ideas` or `tags:ideas` -> tags: ['ideas']
 * - `meeting:#work` or `keyword:#tags` -> keyword: ['meeting'], tag: ['work']
 * - `folder:study` or `@study` -> folders: ['study']
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      raw: '',
      tagTerms: [],
      folderTerms: [],
      keywordTerms: [],
      allTerms: [],
    };
  }

  const tagTerms: string[] = [];
  const folderTerms: string[] = [];
  const keywordTerms: string[] = [];

  // Match tokens handling quoted strings as well as unquoted
  const tokenRegex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  const tokens = trimmed.match(tokenRegex) || [];

  for (let token of tokens) {
    // Strip outer quotes if any
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      token = token.slice(1, -1).trim();
    }

    // Pattern: keyword:#tag (e.g. "keyword:#tags" or "summary:#work")
    const keywordWithTagMatch = token.match(/^([^#:]+):#(.+)$/i);
    if (keywordWithTagMatch) {
      const kw = keywordWithTagMatch[1].trim().toLowerCase();
      const tg = keywordWithTagMatch[2].trim().toLowerCase();
      if (kw) keywordTerms.push(kw);
      if (tg) tagTerms.push(tg);
      continue;
    }

    // Pattern: tag:value or tags:value
    if (/^tags?:/i.test(token)) {
      const val = token.replace(/^tags?:/i, '').trim().toLowerCase();
      if (val) tagTerms.push(val);
      continue;
    }

    // Pattern: #tagname
    if (token.startsWith('#') && token.length > 1) {
      const val = token.slice(1).trim().toLowerCase();
      if (val) tagTerms.push(val);
      continue;
    }

    // Pattern: folder:value
    if (/^folder:/i.test(token)) {
      const val = token.replace(/^folder:/i, '').trim().toLowerCase();
      if (val) folderTerms.push(val);
      continue;
    }

    // Pattern: @foldername
    if (token.startsWith('@') && token.length > 1) {
      const val = token.slice(1).trim().toLowerCase();
      if (val) folderTerms.push(val);
      continue;
    }

    // Otherwise standard keyword term
    const cleanWord = token.toLowerCase();
    if (cleanWord) {
      keywordTerms.push(cleanWord);
    }
  }

  // Deduplicate terms
  const uniqueTags = Array.from(new Set(tagTerms));
  const uniqueFolders = Array.from(new Set(folderTerms));
  const uniqueKeywords = Array.from(new Set(keywordTerms));
  const allTerms = Array.from(new Set([...uniqueTags, ...uniqueFolders, ...uniqueKeywords]));

  return {
    raw: trimmed,
    tagTerms: uniqueTags,
    folderTerms: uniqueFolders,
    keywordTerms: uniqueKeywords,
    allTerms,
  };
}

/**
 * Checks whether a note matches the parsed search query
 */
export function matchesSearchQuery(note: Note, parsed: ParsedSearchQuery): boolean {
  if (!parsed.raw) return true;

  const noteTagsLower = (note.tags || []).map((t) => t.toLowerCase());
  const noteTitleLower = (note.title || '').toLowerCase();
  const noteContentLower = (note.content || '').toLowerCase();
  const noteFolderLower = (note.folder || '').toLowerCase();

  // 1. Tag criteria: every required tag must match at least one note tag
  for (const requiredTag of parsed.tagTerms) {
    const hasMatch = noteTagsLower.some(
      (t) => t === requiredTag || t.includes(requiredTag)
    );
    if (!hasMatch) return false;
  }

  // 2. Folder criteria: if folder specified, must match note folder
  for (const requiredFolder of parsed.folderTerms) {
    if (!noteFolderLower.includes(requiredFolder)) {
      return false;
    }
  }

  // 3. Keyword criteria: every keyword must match title, content, folder, or tags
  for (const kw of parsed.keywordTerms) {
    const inTitle = noteTitleLower.includes(kw);
    const inContent = noteContentLower.includes(kw);
    const inFolder = noteFolderLower.includes(kw);
    const inTags = noteTagsLower.some((t) => t.includes(kw));

    if (!inTitle && !inContent && !inFolder && !inTags) {
      return false;
    }
  }

  return true;
}

/**
 * Escape regex special characters safely
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits text into matching and non-matching segments based on search terms
 */
export function getHighlightedSegments(
  text: string,
  terms: string[]
): Array<{ text: string; isMatch: boolean }> {
  if (!text) return [];
  const validTerms = terms
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length); // match longest first

  if (validTerms.length === 0) {
    return [{ text, isMatch: false }];
  }

  const pattern = new RegExp(`(${validTerms.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: validTerms.some((t) => t.toLowerCase() === part.toLowerCase()),
    }));
}

/**
 * Smart excerpt generator that centers around the first matching search term
 */
export function getSmartExcerpt(content: string, terms: string[], maxLength = 95): string {
  if (!content) return 'Empty note...';

  // Strip markdown formatting for excerpt
  const clean = content
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '')
    .replace(/>\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!clean) return 'Empty note...';

  // If no terms or short text, standard truncation
  if (!terms || terms.length === 0 || clean.length <= maxLength) {
    return clean.slice(0, maxLength) + (clean.length > maxLength ? '...' : '');
  }

  const cleanLower = clean.toLowerCase();
  let firstMatchIndex = -1;
  let matchedTermLength = 0;

  for (const term of terms) {
    if (!term) continue;
    const idx = cleanLower.indexOf(term.toLowerCase());
    if (idx !== -1 && (firstMatchIndex === -1 || idx < firstMatchIndex)) {
      firstMatchIndex = idx;
      matchedTermLength = term.length;
    }
  }

  // If match not in content or close to beginning, return start
  if (firstMatchIndex <= 30) {
    return clean.slice(0, maxLength) + (clean.length > maxLength ? '...' : '');
  }

  // Window centered around match
  const start = Math.max(0, firstMatchIndex - 30);
  const end = Math.min(clean.length, start + maxLength);
  let snippet = clean.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < clean.length) snippet = snippet + '...';

  return snippet;
}

/**
 * React component to render highlighted text segments
 */
export const HighlightText: React.FC<{
  text: string;
  terms: string[];
  className?: string;
}> = ({ text, terms, className = '' }) => {
  const segments = getHighlightedSegments(text, terms);

  if (segments.length === 1 && !segments[0].isMatch) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, idx) =>
        seg.isMatch ? (
          <mark
            key={idx}
            className="bg-amber-300 dark:bg-amber-500/40 text-neutral-950 dark:text-amber-100 rounded-2xs px-0.5 font-semibold"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </span>
  );
};
