import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; lang?: string; text: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.substring(lastIndex, match.index)
      });
    }

    parts.push({
      type: 'code',
      lang: match[1]?.trim() || 'code',
      text: match[2]?.trimEnd() || ''
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      text: content.substring(lastIndex)
    });
  }

  return (
    <div className="space-y-3 leading-relaxed text-slate-200">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          const isCopied = copiedIndex === pIdx;
          return (
            <div
              key={pIdx}
              className="my-3 rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-lg font-mono text-xs"
            >
              {/* Code Block Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    {part.lang || 'code'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(part.text, pIdx)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Copy code to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Block Content */}
              <pre className="p-4 overflow-x-auto text-[11.5px] sm:text-xs leading-relaxed text-slate-200 selection:bg-blue-600/40">
                <code>{part.text}</code>
              </pre>
            </div>
          );
        }

        // Render formatted text content
        return (
          <div key={pIdx} className="space-y-2">
            {renderFormattedText(part.text)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Format markdown lines: headings, tables, blockquotes, lists, bold, inline code
 */
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (inTable && tableHeader.length > 0) {
      elements.push(
        <div key={key} className="overflow-x-auto my-3 rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-900/80 text-white font-bold">
              <tr>
                {tableHeader.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 text-left font-semibold">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 bg-slate-950/60 text-slate-300">
              {tableRows.map((row, rI) => (
                <tr key={rI} className="hover:bg-slate-900/40 transition-colors">
                  {row.map((cell, cI) => (
                    <td key={cI} className="px-3.5 py-2">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table detection: starts and ends with |
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (line.includes('---')) {
        // Table separator line, continue
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    if (!line) {
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      elements.push(<hr key={i} className="my-3 border-slate-800" />);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-white tracking-tight pt-2 pb-0.5 text-amber-300">
          {formatInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-white tracking-tight pt-2.5 pb-1 border-b border-slate-800/60">
          {formatInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white tracking-tight pt-3 pb-1 border-b border-slate-800">
          {formatInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="pl-3.5 border-l-2 border-amber-500/80 italic text-slate-300 my-1.5 py-0.5 bg-amber-950/10 rounded-r-lg">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Numbered step: 1. , 2.
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2.5 my-1">
          <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold">
            {numberedMatch[1]}
          </span>
          <div className="flex-1 text-slate-200">
            {formatInline(numberedMatch[2])}
          </div>
        </div>
      );
      continue;
    }

    // Bullet item: - or *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
          <div className="flex-1 text-slate-200">
            {formatInline(line.slice(2))}
          </div>
        </div>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-xs sm:text-[13px] text-slate-200 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  flushTable('final-table');
  return elements;
}

/**
 * Parses inline formatting: **bold**, `code`, *italic*
 */
function formatInline(text: string): React.ReactNode {
  // Regex to match **bold** or `code` or *italic*
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono text-[11px] border border-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
