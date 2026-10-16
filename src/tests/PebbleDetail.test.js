import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PebbleDetail from '../routes/PebbleDetail';
import authReducer from '../store/auth.reducer';
import { deletePebble, fetchPebble } from '../helpers/pebbleHelpers';

jest.mock('../helpers/pebbleHelpers', () => ({
  ...jest.requireActual('../helpers/pebbleHelpers'),
  fetchPebble: jest.fn(),
  deletePebble: jest.fn(),
  likePebble: jest.fn(),
  unlikePebble: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderDetail = (user = null) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user,
        isAuthenticated: Boolean(user),
        isLoading: false,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/pebbles/4']}>
        <Routes>
          <Route path="/pebbles/:id" element={<PebbleDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('PebbleDetail', () => {
  test('renders field icon, tags, media, links, and questions', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      description: 'A short look',
      author_username: 'ada',
      author_display_name: 'Ada',
      place_name: 'Antarctica',
      fields: [{ field_id: 1, name: 'Climate Science' }],
      phenomena: [{ phenomenon_id: 2, name: 'sea ice', field_name: 'Climate Science' }],
      other_tags: [{ other_tag_id: 3, name: 'fast ice' }],
      hero_image_url: 'https://example.com/ice.jpg',
      media: [{ media_id: 9, media_url: 'https://example.com/clip.mp4', media_type: 'video', filename: 'clip.mp4' }],
      resources: [{ resource_id: 1, url: 'https://example.edu/paper' }],
      questions: [{ question_id: 1, prompt: 'What changed?' }],
      field_notes: [{ type: 'paragraph', children: [{ text: 'Notes' }] }],
      like_count: 0,
    });

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Shelf ice' })).toBeInTheDocument();
    expect(screen.getByLabelText('Climate Science')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Antarctica')).toBeInTheDocument();
    expect(screen.getByText('sea ice')).toHaveClass('bg-accent');
    expect(screen.getByText('fast ice')).toBeInTheDocument();
    const gallery = screen.getByTestId('pebble-media-gallery');
    expect(gallery).toHaveClass('grid-cols-5', 'w-full', 'min-w-0');
    expect(gallery.querySelector('video')).toHaveAttribute('src', 'https://example.com/clip.mp4');
    expect(gallery.querySelector('video').controls).toBe(true);
    expect(gallery.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.edu/paper' })).toBeInTheDocument();
    expect(screen.getByText('What changed?')).toBeInTheDocument();

    const notes = screen.getByRole('heading', { name: 'Field notes' });
    const reading = screen.getByRole('heading', { name: 'Further reading' });
    const questions = screen.getByRole('heading', { name: 'Questions to consider' });
    expect(notes.compareDocumentPosition(reading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reading.compareDocumentPosition(questions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows a date alone and a 24-hour time when one was entered', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      author_username: 'ada',
      observed_on: '2021-07-27',
      observed_time: null,
      observed_at: null,
      field_notes: [],
    });
    const { unmount } = renderDetail();
    expect(await screen.findByText('2021-07-27')).toBeInTheDocument();
    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    unmount();

    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      author_username: 'ada',
      observed_on: '2021-07-27',
      observed_time: '15:00:00',
      field_notes: [],
    });
    renderDetail();
    expect(await screen.findByText('2021-07-27 15:00')).toBeInTheDocument();
  });

  test('fits five media thumbnails and opens the larger view', async () => {
    const media = [
      { media_id: 1, media_url: 'https://example.com/one.jpg', media_type: 'image', filename: 'one.jpg' },
      { media_id: 2, media_url: 'https://example.com/two.jpg', media_type: 'image', filename: 'two.jpg' },
      { media_id: 3, media_url: 'https://example.com/three.jpg', media_type: 'image', filename: 'three.jpg' },
      { media_id: 4, media_url: 'https://example.com/four.jpg', media_type: 'image', filename: 'four.jpg' },
      { media_id: 5, media_url: 'https://example.com/clip.mp4', media_type: 'video', filename: 'clip.mp4' },
    ];
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      author_username: 'ada',
      media,
      field_notes: [],
    });

    renderDetail();

    const gallery = await screen.findByTestId('pebble-media-gallery');
    expect(gallery).toHaveClass('grid-cols-5');
    expect(gallery.querySelectorAll('button')).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: 'one.jpg' }));
    const viewer = screen.getByRole('dialog', { name: 'Media' });
    expect(viewer.querySelector('img')).toHaveAttribute('src', 'https://example.com/one.jpg');
    expect(within(viewer).getByRole('button', { name: 'Slide 1 of 5' })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(within(viewer).getByRole('button', { name: 'Slide 2 of 5' }));
    expect(within(viewer).getByRole('button', { name: 'Slide 2 of 5' })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'clip.mp4' }));
    const video = screen.getByRole('dialog', { name: 'Media' }).querySelector('video');
    expect(video).toHaveAttribute('src', 'https://example.com/clip.mp4');
    expect(video.controls).toBe(true);
  });

  test('shows an optional image title above the caption', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      author_username: 'ada',
      media: [
        {
          media_id: 1,
          media_url: 'https://example.com/one.jpg',
          media_type: 'image',
          filename: 'one.jpg',
          title: 'Face',
          caption: 'Noon light',
        },
      ],
      field_notes: [],
    });
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'one.jpg' }));
    const viewer = screen.getByRole('dialog', { name: 'Media' });
    const photo = viewer.querySelector('img');
    const imageTitle = within(viewer).getByRole('heading', { name: 'Face' });
    const caption = within(viewer).getByText('Noon light');
    expect(photo.compareDocumentPosition(imageTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(imageTitle.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(viewer).queryByRole('button', { name: /Slide/ })).not.toBeInTheDocument();
  });

  test('replaces a media file that fails to load', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      title: 'Shelf ice',
      author_username: 'ada',
      media: [
        { media_id: 8, media_url: 'https://example.com/missing.jpg', media_type: 'image', filename: 'missing.jpg' },
      ],
      field_notes: [],
    });

    renderDetail();

    const gallery = await screen.findByTestId('pebble-media-gallery');
    fireEvent.error(gallery.querySelector('img'));
    expect(gallery.querySelector('img')).not.toBeInTheDocument();
    expect(gallery.querySelector('video')).not.toBeInTheDocument();
    expect(screen.getByText('missing.jpg')).toBeInTheDocument();
  });

  test('shows a saved photosynthesis chip and an other tag on the pebble page', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 21,
      title: 'Scorpion',
      author_username: 'ada',
      phenomena: [{ phenomenon_id: 40, name: 'photosynthesis', field_name: 'Biology' }],
      other_tags: [{ other_tag_id: 8, name: 'nocturnal hunter' }],
      field_notes: [],
    });

    renderDetail();

    const saved = await screen.findByText('photosynthesis');
    const other = screen.getByText('nocturnal hunter');
    expect(saved).toHaveClass('rounded-xl', 'bg-accent');
    expect(other).toHaveClass('rounded-xl', 'bg-accent', 'text-xs', 'text-white');
  });

  test('the author confirms that deletion is permanent', async () => {
    const user = userEvent.setup();
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      author_id: 1,
      title: 'Shelf ice',
      author_username: 'ada',
      status: 'published',
      field_notes: [],
    });
    deletePebble.mockResolvedValue({ success: true });

    renderDetail({ user_id: 1, username: 'ada' });

    await user.click(await screen.findByRole('button', { name: 'Delete pebble' }));
    expect(deletePebble).not.toHaveBeenCalled();
    const dialog = screen.getByTestId('delete-pebble-modal');
    expect(dialog).toHaveTextContent('Are you sure? Deletion is permanent.');
    expect(dialog).toHaveTextContent('Shelf ice');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deletePebble).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete pebble' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deletePebble).toHaveBeenCalledWith(4));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('another person does not get delete', async () => {
    fetchPebble.mockResolvedValue({
      pebble_id: 4,
      author_id: 1,
      title: 'Shelf ice',
      author_username: 'ada',
      status: 'published',
      field_notes: [],
    });

    renderDetail({ user_id: 2, username: 'bob' });

    expect(await screen.findByRole('heading', { name: 'Shelf ice' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete pebble' })).not.toBeInTheDocument();
  });
});
