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
});
