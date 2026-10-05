import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleEdit from '../routes/PebbleEdit';
import { deletePebble, fetchPebble, updatePebble } from '../helpers/pebbleHelpers';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('../helpers/pebbleHelpers', () => ({
  ...jest.requireActual('../helpers/pebbleHelpers'),
  fetchPebble: jest.fn(),
  updatePebble: jest.fn(),
  deletePebble: jest.fn(),
}));

jest.mock('../helpers/taxonomyHelpers', () => ({
  fetchFields: jest.fn().mockResolvedValue([]),
  fetchPhenomena: jest.fn().mockResolvedValue([]),
}));

jest.mock('../helpers/placesHelpers', () => {
  const actual = jest.requireActual('../helpers/placesHelpers');
  return {
    ...actual,
    fetchPlacesApiKey: jest.fn().mockResolvedValue({ key: null, configured: false }),
    loadGoogleMapsApi: jest.fn(),
    loadGooglePlacesApi: jest.fn(),
  };
});

describe('PebbleEdit', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    updatePebble.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  const renderEdit = () =>
    render(
      <MemoryRouter initialEntries={['/pebbles/3/edit']}>
        <Routes>
          <Route path="/pebbles/:id/edit" element={<PebbleEdit />} />
        </Routes>
      </MemoryRouter>
    );

  test('offers Publish on a saved draft', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 3,
      status: 'draft',
      title: 'Shelf draft',
      field_notes: [],
    });

    renderEdit();

    expect(await screen.findAllByRole('button', { name: 'Save progress' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Publish' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  test('offers Save changes on a published pebble', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 3,
      status: 'published',
      title: 'Shelf',
      field_notes: [],
    });

    renderEdit();

    expect(await screen.findAllByRole('button', { name: 'Save changes' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  test('publishing a draft stores published and does not save it back as a draft', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 3,
      status: 'draft',
      title: 'Shelf draft',
      field_notes: [],
      media: [],
    });
    updatePebble.mockImplementation(async (id, body) => ({
      pebble_id: Number(id),
      status: body.status,
      title: body.title,
    }));

    const view = renderEdit();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Publish' }))[0]);

    await waitFor(() => {
      expect(updatePebble.mock.calls.some((call) => call[1].status === 'published')).toBe(true);
    });
    expect(updatePebble.mock.calls.at(-1)[1].status).toBe('published');
    expect(mockNavigate).toHaveBeenCalledWith('/?mine=1&pebble=3');
    const writes = updatePebble.mock.calls.length;

    view.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(updatePebble).toHaveBeenCalledTimes(writes);
    expect(updatePebble.mock.calls.at(-1)[1].status).toBe('published');
  });

  test('stays on the form and explains a failed publish', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 3,
      status: 'draft',
      title: 'Shelf draft',
      field_notes: [],
      media: [],
    });
    updatePebble.mockImplementation(async (id, body) => {
      if (body.status === 'published') throw new Error('Database is unavailable');
      return { pebble_id: Number(id), status: body.status, title: body.title };
    });

    renderEdit();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Publish' }))[0]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Database is unavailable'));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveValue('Shelf draft');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf draft revised' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[0]);
    await waitFor(() => {
      expect(updatePebble.mock.calls.at(-1)[1]).toMatchObject({
        status: 'draft',
        title: 'Shelf draft revised',
      });
    });
  });

  test('deleting a draft asks before the deletion becomes permanent', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 3,
      status: 'draft',
      title: 'Shelf draft',
      field_notes: [],
    });
    deletePebble.mockResolvedValue({ success: true });

    renderEdit();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete pebble' }));
    expect(screen.getByTestId('delete-pebble-modal')).toHaveTextContent(
      'Are you sure? Deletion is permanent.'
    );
    expect(deletePebble).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deletePebble).toHaveBeenCalledWith('3'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
