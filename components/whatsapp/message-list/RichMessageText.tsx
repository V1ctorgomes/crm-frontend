import React, { Fragment } from 'react';
import { escapeRegExp } from './message-list-utils';

export function RichMessageText({
  text,
  chatSearchTerm,
  invert,
}: {
  text: string;
  chatSearchTerm: string;
  invert: boolean;
}) {
  if (!text.trim()) return null;
  const linkCls = invert
    ? 'text-white underline font-medium break-all decoration-white/80'
    : 'text-brand-700 underline font-medium break-all';
  const lines = text.split('\n');
  return (
    <span className="text-[14px] leading-relaxed whitespace-pre-wrap">
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 ? <br /> : null}
          {/^https?:\/\//i.test(line.trim()) ? (
            <a href={line.trim()} target="_blank" rel="noopener noreferrer" className={linkCls}>
              {line.trim()}
            </a>
          ) : chatSearchTerm.trim() ? (
            line.split(new RegExp(`(${escapeRegExp(chatSearchTerm)})`, 'gi')).map((part, i) =>
              part.toLowerCase() === chatSearchTerm.toLowerCase() ? (
                <mark key={i} className="bg-highlight text-brand-950 px-0.5 rounded">
                  {part}
                </mark>
              ) : (
                part
              ),
            )
          ) : (
            line
          )}
        </Fragment>
      ))}
    </span>
  );
}
