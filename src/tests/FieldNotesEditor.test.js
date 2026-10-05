import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FieldNotesEditor from '../components/FieldNotes/FieldNotesEditor';
import { EMPTY_FIELD_NOTES } from '../helpers/fieldNotesHelpers';

describe('FieldNotesEditor', () => {
  test('renders toolbar with icon labels and editor', () => {
    const onChange = jest.fn();
    render(<FieldNotesEditor value={EMPTY_FIELD_NOTES} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bulleted list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Photo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Video/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('field-notes-count')).toHaveTextContent('0 / 250');
    expect(screen.getByTestId('field-notes-body')).toHaveClass('min-h-24');
  });

  test('grows the editor once typing starts', async () => {
    const user = userEvent.setup();
    render(<FieldNotesEditor value={EMPTY_FIELD_NOTES} onChange={jest.fn()} />);
    await user.click(screen.getByRole('textbox'));
    expect(screen.getByTestId('field-notes-body')).toHaveClass('min-h-64');
  });
});
