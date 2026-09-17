import React, { useMemo } from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onToggleTask?: (taskIndex: number, completed: boolean) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  // Convert markdown to HTML safely using marked with GitHub Flavored Markdown
  const htmlContent = useMemo(() => {
    if (!content || !content.trim()) {
      return '<p class="text-neutral-400 italic">No content yet. Write something in the editor on the left.</p>';
    }

    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      const parsed = marked.parse(content);
      return typeof parsed === "string" ? parsed : "";
    } catch (e) {
      console.error("Markdown parse error:", e);
      return `<pre class="text-red-500 font-mono text-sm">${content}</pre>`;
    }
  }, [content]);

  return (
    <div
      className={`markdown-preview prose prose-neutral max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
