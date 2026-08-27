import React from 'react';
import { Sparkles, CheckCircle2, TrendingUp, AlertTriangle, Info, Table as TableIcon } from 'lucide-react';

interface FormattedAiResponseProps {
  content: string;
}

export const FormattedAiResponse: React.FC<FormattedAiResponseProps> = ({ content }) => {
  if (!content) return null;

  // Split raw text into sections / blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3.5 text-slate-200 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return (
            <div key={idx} className="flex items-center space-x-2 pt-2 first:pt-0 pb-1 border-b border-indigo-500/20">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {renderInlineStyles(block.content)}
              </h3>
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead className="bg-slate-800/90 text-indigo-300 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    {block.tableHeaders?.map((h, hIdx) => (
                      <th key={hIdx} className="px-4 py-3 font-semibold text-slate-200 border-r border-slate-700/50 last:border-r-0">
                        {renderInlineStyles(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {block.tableRows?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-indigo-950/30 transition duration-150">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 text-slate-300 border-r border-slate-800/60 last:border-r-0">
                          {formatTableCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={idx} className="space-y-2 my-2">
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start space-x-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 shadow-sm shadow-indigo-400/50" />
                  <div className="flex-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {renderInlineStyles(item)}
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'callout') {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 flex items-start space-x-3 my-2.5 shadow-sm"
            >
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                {renderInlineStyles(block.content)}
              </div>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {renderInlineStyles(block.content)}
          </p>
        );
      })}
    </div>
  );
};

interface ParsedBlock {
  type: 'heading' | 'table' | 'list' | 'callout' | 'paragraph';
  content: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  items?: string[];
}

function parseMarkdownBlocks(rawText: string): ParsedBlock[] {
  const lines = rawText.split('\n');
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Heading
    if (line.startsWith('#') || (line.startsWith('**') && line.endsWith('**') && !line.includes('|') && line.length < 80)) {
      const headingText = line.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
      blocks.push({ type: 'heading', content: headingText });
      i++;
      continue;
    }

    // 2. Blockquote / Callout
    if (line.startsWith('>')) {
      const calloutText = line.replace(/^>\s*/, '');
      blocks.push({ type: 'callout', content: calloutText });
      i++;
      continue;
    }

    // 3. Table Detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());

        // Skip separator row (e.g. |---|---|)
        const rowStartIndex = tableLines[1].includes('---') ? 2 : 1;
        const rows: string[][] = [];

        for (let r = rowStartIndex; r < tableLines.length; r++) {
          const rowCells = tableLines[r]
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());
          if (rowCells.length > 0) {
            rows.push(rowCells);
          }
        }

        blocks.push({
          type: 'table',
          content: '',
          tableHeaders: rawHeaders,
          tableRows: rows
        });
        continue;
      }
    }

    // 4. Bullet List Detection
    if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))
      ) {
        items.push(lines[i].trim().replace(/^[\*\-\•]\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        content: '',
        items
      });
      continue;
    }

    // 5. Italic Note / Standalone Italic
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      blocks.push({
        type: 'callout',
        content: line.slice(1, -1)
      });
      i++;
      continue;
    }

    // 6. Default Paragraph
    blocks.push({
      type: 'paragraph',
      content: line
    });
    i++;
  }

  return blocks;
}

/**
 * Format table cell values (e.g., highlighting surplus, numbers, bold, badges)
 */
function formatTableCell(cell: string): React.ReactNode {
  const clean = cell.replace(/^\*\*|\*\*$/g, '').trim();

  // Surplus highlight: +364 units
  if (clean.startsWith('+') || clean.toLowerCase().includes('surplus')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        {clean}
      </span>
    );
  }

  // Stock counts: 424 units
  if (/^\d+\s*units?$/i.test(clean)) {
    return <span className="font-semibold text-white font-mono">{clean}</span>;
  }

  // Currency: $123.45
  if (/^\$[\d,]+(?:\.\d{2})?$/.test(clean)) {
    return <span className="font-bold text-emerald-400 font-mono">{clean}</span>;
  }

  return renderInlineStyles(cell);
}

/**
 * Renders bold, code, highlights, links in markdown inline text
 */
function renderInlineStyles(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**text**), code (`code`), or highlight
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
