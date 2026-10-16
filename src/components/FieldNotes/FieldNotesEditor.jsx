import React, { useCallback, useMemo, useState } from 'react';
import { createEditor, Editor, Element as SlateElement, Transforms } from 'slate';
import { Editable, Slate, useSlate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import {
  EMPTY_FIELD_NOTES,
  FIELD_NOTES_WORD_CAP,
  MEDIA_VOID_TYPES,
  countFieldNoteWords,
  normalizeFieldNotes,
} from '../../helpers/fieldNotesHelpers';

const withMedia = (editor) => {
  const { isVoid } = editor;
  editor.isVoid = (element) =>
    (element?.type && MEDIA_VOID_TYPES.includes(element.type)) || isVoid(element);
  return editor;
};

const toggleMark = (editor, format) => {
  const marks = Editor.marks(editor);
  if (marks?.[format]) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const MarkButton = ({ format, label }) => {
  const editor = useSlate();
  const active = Boolean(Editor.marks(editor)?.[format]);
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
      className={`rounded-xl px-2 py-1 text-xs ${
        active ? 'bg-accent text-white' : 'border border-border bg-surface text-ink'
      }`}
    >
      {label}
    </button>
  );
};

const LIST_TYPES = ['bulleted-list', 'numbered-list'];

const isBlockActive = (editor, format) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (node) =>
      !Editor.isEditor(node) && SlateElement.isElement(node) && node.type === format,
  });
  return Boolean(match);
};

const toggleList = (editor, format) => {
  const active = isBlockActive(editor, format);
  Transforms.unwrapNodes(editor, {
    match: (node) =>
      !Editor.isEditor(node) && SlateElement.isElement(node) && LIST_TYPES.includes(node.type),
    split: true,
  });
  Transforms.setNodes(editor, {
    type: active ? 'paragraph' : 'list-item',
  });
  if (!active) {
    Transforms.wrapNodes(editor, { type: format, children: [] });
  }
};

const ListButton = ({ format, label }) => {
  const editor = useSlate();
  const active = isBlockActive(editor, format);
  return (
    <button
      type="button"
      aria-pressed={active}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleList(editor, format);
      }}
      className={`rounded-xl px-2 py-1 text-xs ${
        active ? 'bg-accent text-white' : 'border border-border bg-surface text-ink'
      }`}
    >
      {label}
    </button>
  );
};

const insertHeading = (editor) => {
  Transforms.insertNodes(editor, {
    type: 'heading',
    children: [{ text: 'Heading' }],
  });
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'heading':
      return (
        <h3 {...attributes} className="mb-2 font-display text-lg font-semibold text-ink">
          {children}
        </h3>
      );
    case 'bulleted-list':
      return (
        <ul {...attributes} className="mb-2 list-disc pl-5 text-base text-ink">
          {children}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol {...attributes} className="mb-2 list-decimal pl-5 text-base text-ink">
          {children}
        </ol>
      );
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'image':
      return (
        <div {...attributes} contentEditable={false} className="my-3">
          {children}
          <img src={element.url} alt={element.caption || ''} className="max-h-72 rounded-2xl" />
          {element.caption ? <p className="mt-1 text-xs text-muted">{element.caption}</p> : null}
        </div>
      );
    case 'video':
      return (
        <div {...attributes} contentEditable={false} className="my-3">
          {children}
          <video src={element.url} controls className="max-h-72 w-full rounded-2xl" />
        </div>
      );
    case 'audio':
      return (
        <div {...attributes} contentEditable={false} className="my-3">
          {children}
          <audio src={element.url} controls className="w-full" />
        </div>
      );
    case 'data':
    case 'attachment':
    case 'graph':
      return (
        <div
          {...attributes}
          contentEditable={false}
          className="my-3 rounded-2xl border border-border bg-background px-3 py-2 text-base text-ink"
        >
          {children}
          <a
            href={element.url}
            className="text-accent underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {element.caption ||
              (element.type === 'data' ? 'Data resource' : 'Attachment')}
          </a>
        </div>
      );
    default:
      return (
        <p {...attributes} className="mb-2 text-base leading-relaxed text-ink">
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  let content = children;
  if (leaf.bold) content = <strong>{content}</strong>;
  if (leaf.italic) content = <em>{content}</em>;
  return <span {...attributes}>{content}</span>;
};

const FieldNotesEditor = ({ value, onChange, wordCap = FIELD_NOTES_WORD_CAP }) => {
  const editor = useMemo(() => withMedia(withHistory(withReact(createEditor()))), []);
  const initial = normalizeFieldNotes(value);
  const [wordCount, setWordCount] = useState(() => countFieldNoteWords(initial));
  const [writing, setWriting] = useState(() => countFieldNoteWords(initial) > 0);

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <Slate
        editor={editor}
        initialValue={initial.length ? initial : EMPTY_FIELD_NOTES}
        onChange={(next) => {
          const count = countFieldNoteWords(next);
          if (count > wordCap) {
            editor.undo();
            return;
          }
          setWordCount(count);
          if (count > 0) setWriting(true);
          onChange(next);
        }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <MarkButton format="bold" label="Bold" />
          <MarkButton format="italic" label="Italic" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertHeading(editor);
            }}
            className="rounded-xl border border-border bg-surface px-2 py-1 text-xs text-ink"
          >
            Heading
          </button>
          <ListButton format="bulleted-list" label="Bulleted list" />
          <ListButton format="numbered-list" label="Numbered list" />
          <span className="ml-auto text-xs text-muted" data-testid="field-notes-count">
            {wordCount} / {wordCap}
          </span>
        </div>
        <div
          data-testid="field-notes-body"
          className={writing ? 'min-h-64' : 'min-h-24'}
          onFocus={() => setWriting(true)}
        >
          <Editable
            className="min-h-full px-3 py-3 text-base outline-none"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Write field notes…"
          />
        </div>
      </Slate>
    </div>
  );
};

export default FieldNotesEditor;
