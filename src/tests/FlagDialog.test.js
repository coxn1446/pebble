import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FlagDialog from '../components/Moderation/FlagDialog';

jest.mock('../helpers/moderationHelpers', () => ({
  createFlag: jest.fn(),
}));

import { createFlag } from '../helpers/moderationHelpers';

describe('FlagDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits a report', async () => {
    createFlag.mockResolvedValue({ flag_id: 1 });
    const onClose = jest.fn();

    render(<FlagDialog targetType="pebble" targetId={10} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Details/i), {
      target: { value: 'Contains harassment' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit report/i }));

    await waitFor(() =>
      expect(createFlag).toHaveBeenCalledWith({
        targetType: 'pebble',
        targetId: 10,
        reason: 'Offensive content',
        details: 'Contains harassment',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('closes without submitting', () => {
    const onClose = jest.fn();
    render(<FlagDialog targetType="user" targetId={2} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
    expect(createFlag).not.toHaveBeenCalled();
  });
});
