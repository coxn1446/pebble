import React from 'react';
import { render, screen } from '@testing-library/react';
import FieldNotesViewer from '../components/FieldNotes/FieldNotesViewer';

describe('FieldNotesViewer', () => {
  test('renders paragraph and heading content', () => {
    render(
      <FieldNotesViewer
        value={[
          { type: 'heading', children: [{ text: 'Title' }] },
          { type: 'paragraph', children: [{ text: 'Body note' }] },
        ]}
      />
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body note')).toBeInTheDocument();
  });

  test('renders bulleted and numbered lists', () => {
    render(
      <FieldNotesViewer
        value={[
          {
            type: 'bulleted-list',
            children: [{ type: 'list-item', children: [{ text: 'First finding' }] }],
          },
          {
            type: 'numbered-list',
            children: [{ type: 'list-item', children: [{ text: 'Second finding' }] }],
          },
        ]}
      />
    );
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText('First finding')).toBeInTheDocument();
    expect(screen.getByText('Second finding')).toBeInTheDocument();
  });

  test('renders media resource links', () => {
    render(
      <FieldNotesViewer
        value={[
          {
            type: 'data',
            url: '/uploads/data.json',
            caption: 'Dataset',
            children: [{ text: '' }],
          },
        ]}
      />
    );
    expect(screen.getByRole('link', { name: 'Dataset' })).toHaveAttribute(
      'href',
      '/uploads/data.json'
    );
  });

  test('makes urls inside notes clickable', () => {
    render(
      <FieldNotesViewer
        value={[{ type: 'paragraph', children: [{ text: 'See https://example.edu/paper today' }] }]}
      />
    );
    expect(screen.getByRole('link', { name: 'https://example.edu/paper' })).toHaveAttribute(
      'href',
      'https://example.edu/paper'
    );
  });
});
