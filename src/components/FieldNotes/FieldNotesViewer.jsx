import React from 'react';
import { normalizeFieldNotes } from '../../helpers/fieldNotesHelpers';

const URL_RE = /https?:\/\/[^\s]+/g;

const linkify = (text) => {
  const value = String(text || '');
  const nodes = [];
  let last = 0;
  let match;
  let i = 0;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(value))) {
    if (match.index > last) nodes.push(value.slice(last, match.index));
    const href = match[0];
    nodes.push(
      <a
        key={`${href}-${i}`}
        href={href}
        className="text-accent underline-offset-2 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        {href}
      </a>
    );
    last = match.index + href.length;
    i += 1;
  }
  if (last < value.length) nodes.push(value.slice(last));
  return nodes.length ? nodes : value;
};

const renderLeafText = (leaf, index) => {
  let content = linkify(leaf.text || '');
  if (leaf.bold) content = <strong key={`b-${index}`}>{content}</strong>;
  if (leaf.italic) content = <em key={`i-${index}`}>{content}</em>;
  return <React.Fragment key={index}>{content}</React.Fragment>;
};

const NodeView = ({ node, index }) => {
  if (node.text !== undefined) return renderLeafText(node, index);

  const children = (node.children || []).map((child, i) => (
    <NodeView key={i} node={child} index={i} />
  ));

  switch (node.type) {
    case 'heading':
      return (
        <h3 className="mb-2 font-display text-lg font-semibold text-ink">{children}</h3>
      );
    case 'bulleted-list':
      return <ul className="mb-2 list-disc pl-5 text-sm text-ink">{children}</ul>;
    case 'numbered-list':
      return <ol className="mb-2 list-decimal pl-5 text-sm text-ink">{children}</ol>;
    case 'list-item':
      return <li>{children}</li>;
    case 'image':
      return (
        <div className="my-3">
          <img src={node.url} alt={node.caption || ''} className="max-h-72 rounded-2xl" />
          {node.caption ? <p className="mt-1 text-xs text-muted">{node.caption}</p> : null}
        </div>
      );
    case 'video':
      return <video src={node.url} controls className="my-3 max-h-72 w-full rounded-2xl" />;
    case 'audio':
      return <audio src={node.url} controls className="my-3 w-full" />;
    case 'data':
    case 'attachment':
    case 'graph':
      return (
        <div className="my-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm">
          <a href={node.url} className="text-accent underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
            {node.caption || (node.type === 'data' ? 'Data resource' : 'Attachment')}
          </a>
        </div>
      );
    default:
      return <p className="mb-2 text-sm leading-relaxed text-ink">{children}</p>;
  }
};

const FieldNotesViewer = ({ value }) => {
  const notes = normalizeFieldNotes(value);
  return (
    <div className="space-y-1">
      {notes.map((node, index) => (
        <NodeView key={index} node={node} index={index} />
      ))}
    </div>
  );
};

export default FieldNotesViewer;
