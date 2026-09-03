import React from 'react';
import { render, screen } from '@testing-library/react';
import FieldNotesEditor from '../components/FieldNotes/FieldNotesEditor';
import { EMPTY_FIELD_NOTES } from '../helpers/fieldNotesHelpers';

describe('FieldNotesEditor', () => {
  test('renders toolbar with icon labels and editor', () => {
    const onChange = jest.fn();
    render(<FieldNotesEditor value={EMPTY_FIELD_NOTES} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Audio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attachment/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Graph/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
