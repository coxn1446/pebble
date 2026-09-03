import React, { useCallback, useMemo, useState } from 'react';
import { createEditor, Editor, Transforms } from 'slate';
import { Editable, Slate, useSlate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import toast from 'react-hot-toast';
import { uploadFile } from '../../helpers/uploadHelpers';
import {
  EMPTY_FIELD_NOTES,
  MEDIA_VOID_TYPES,
  createMediaNode,
  normalizeFieldNotes,
} from '../../helpers/fieldNotesHelpers';
import {
  AttachmentIcon,
  AudioIcon,
  DataIcon,
  IconLabel,
  PhotoIcon,
  VideoIcon,
} from '../Icons/Icons';

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

const insertHeading = (editor) => {
  Transforms.insertNodes(editor, {
    type: 'heading',
    children: [{ text: 'Heading' }],
  });
};

const MediaToolbarButton = ({ label, icon, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="rounded-xl border border-border bg-surface px-2 py-1 text-xs text-ink disabled:opacity-60"
  >
    <IconLabel icon={icon} label={label} />
  </button>
);

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'heading':
      return (
        <h3 {...attributes} className="mb-2 font-display text-lg font-semibold text-ink">
          {children}
        </h3>
      );
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
          className="my-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-ink"
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
        <p {...attributes} className="mb-2 text-sm leading-relaxed text-ink">
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

const FieldNotesEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withMedia(withHistory(withReact(createEditor()))), []);
  const [uploading, setUploading] = useState(false);
  const initial = normalizeFieldNotes(value);

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const handleUpload = async (mediaType, accept) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const media = await uploadFile(file, mediaType);
        const node = createMediaNode({
          mediaType: media.media_type || mediaType,
          url: media.media_url,
          mediaId: media.media_id,
          caption: media.filename || '',
        });
        Transforms.insertNodes(editor, node);
        Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <Slate
        editor={editor}
        initialValue={initial.length ? initial : EMPTY_FIELD_NOTES}
        onChange={(next) => onChange(next)}
      >
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
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
          <MediaToolbarButton
            label="Photo"
            icon={PhotoIcon}
            disabled={uploading}
            onClick={() => handleUpload('image', 'image/*')}
          />
          <MediaToolbarButton
            label="Video"
            icon={VideoIcon}
            disabled={uploading}
            onClick={() => handleUpload('video', 'video/*')}
          />
          <MediaToolbarButton
            label="Audio"
            icon={AudioIcon}
            disabled={uploading}
            onClick={() => handleUpload('audio', 'audio/*')}
          />
          <MediaToolbarButton
            label="Data"
            icon={DataIcon}
            disabled={uploading}
            onClick={() => handleUpload('data', '.json,.csv,.tsv,.txt')}
          />
          <MediaToolbarButton
            label="Attachment"
            icon={AttachmentIcon}
            disabled={uploading}
            onClick={() => handleUpload('attachment', '*/*')}
          />
        </div>
        <Editable
          className="min-h-40 px-3 py-3 outline-none"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Write field notes…"
        />
      </Slate>
    </div>
  );
};

export default FieldNotesEditor;
