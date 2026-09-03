import React from 'react';
import { normalizeFieldNotes } from '../../helpers/fieldNotesHelpers';

const renderLeafText = (leaf, index) => {
  let content = leaf.text || '';
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
