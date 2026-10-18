import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureRequestModal from '../components/FeatureRequests/FeatureRequestModal';
import {
  addFeatureLogEntry,
  fetchFeatureLog,
  submitFeatureRequest,
  uploadFeatureFile,
} from '../helpers/featureRequestHelpers';

jest.mock('../helpers/featureRequestHelpers', () => ({
  fetchFeatureLog: jest.fn(async () => []),
  uploadFeatureFile: jest.fn(),
  submitFeatureRequest: jest.fn(),
  addFeatureLogEntry: jest.fn(),
}));

describe('FeatureRequestModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchFeatureLog.mockResolvedValue([]);
  });

  test('submits the request text and uploaded files', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const notes = new File(['notes'], 'notes.pdf', { type: 'application/pdf' });
    uploadFeatureFile.mockResolvedValue({
      file_url: '/uploads/notes.pdf',
      file_name: 'notes.pdf',
      content_type: 'application/pdf',
      storage_key: 'feature-requests/11111111-1111-4111-8111-111111111111.pdf',
    });
    submitFeatureRequest.mockResolvedValue({ emailed: true, request: { feature_request_id: 3 } });

    render(<FeatureRequestModal canManageLog={false} onClose={onClose} />);
    await user.upload(screen.getByLabelText('Add files'), notes);
    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(uploadFeatureFile).toHaveBeenCalledWith(notes);
    expect(submitFeatureRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [
          expect.objectContaining({
            file_name: 'notes.pdf',
            storage_key: 'feature-requests/11111111-1111-4111-8111-111111111111.pdf',
          }),
        ],
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('keeps the modal open when the email is not sent', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const notes = new File(['notes'], 'notes.pdf', { type: 'application/pdf' });
    uploadFeatureFile.mockResolvedValue({
      file_url: '/uploads/notes.pdf',
      file_name: 'notes.pdf',
      content_type: 'application/pdf',
      storage_key: 'feature-requests/11111111-1111-4111-8111-111111111111.pdf',
    });
    submitFeatureRequest.mockResolvedValue({ emailed: false, request: { feature_request_id: 3 } });

    render(<FeatureRequestModal onClose={onClose} />);
    await user.upload(screen.getByLabelText('Add files'), notes);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('feature-request-modal')).toBeInTheDocument();
  });

  test('does not submit an empty request', async () => {
    const user = userEvent.setup();
    render(<FeatureRequestModal onClose={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(uploadFeatureFile).not.toHaveBeenCalled();
    expect(submitFeatureRequest).not.toHaveBeenCalled();
  });

  test('shows the log and hides add for a submitter who cannot manage it', async () => {
    const user = userEvent.setup();
    fetchFeatureLog.mockResolvedValue([
      {
        feature_request_log_id: 1,
        description: 'Map filters',
        release_date: '2026-11-01',
        status: 'wip',
      },
    ]);
    render(<FeatureRequestModal canManageLog={false} onClose={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Log' }));
    expect(await screen.findByText('Map filters')).toBeInTheDocument();
    expect(screen.getByText('2026-11-01')).toBeInTheDocument();
    expect(screen.getByText('WIP')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  test('adds a log row for the account that can manage it', async () => {
    const user = userEvent.setup();
    addFeatureLogEntry.mockResolvedValue({
      feature_request_log_id: 8,
      description: 'Offline maps',
      release_date: '2026-12-01',
      status: 'not_started',
    });
    render(<FeatureRequestModal canManageLog onClose={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Log' }));
    expect(await screen.findByText('No requests')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Description'), 'Offline maps');
    await user.type(screen.getByLabelText('Release date'), '2026-12-01');
    await user.selectOptions(screen.getByLabelText('Status'), 'not_started');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(addFeatureLogEntry).toHaveBeenCalledWith({
      description: 'Offline maps',
      releaseDate: '2026-12-01',
      status: 'not_started',
    });
    const row = (await screen.findByText('Offline maps')).closest('tr');
    expect(row).toHaveTextContent('2026-12-01');
    expect(row).toHaveTextContent('Not Started');
  });
});
