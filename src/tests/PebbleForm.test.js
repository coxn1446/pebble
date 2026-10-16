import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { uploadFile } from '../helpers/uploadHelpers';
import { fetchFields, fetchPhenomena } from '../helpers/taxonomyHelpers';
import { fetchWeatherSuggestion } from '../helpers/weatherHelpers';
import { fetchPlacesApiKey, loadGoogleMapsApi, loadGooglePlacesApi } from '../helpers/placesHelpers';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('../helpers/uploadHelpers', () => {
  const uploadFile = jest.fn();
  return {
    uploadFile,
    uploadFiles: async (entries) => {
      const results = [];
      for (const entry of entries) {
        try {
          const media = await uploadFile(entry.file, entry.mediaType);
          results.push({ ok: true, media, file: entry.file });
        } catch (error) {
          results.push({ ok: false, error, file: entry.file });
        }
      }
      return results;
    },
  };
});

jest.mock('../helpers/taxonomyHelpers', () => ({
  fetchFields: jest.fn(),
  fetchPhenomena: jest.fn(),
}));

jest.mock('../helpers/weatherHelpers', () => ({
  fetchWeatherSuggestion: jest.fn().mockResolvedValue(null),
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

const fields = [
  { field_id: 2, name: 'Biology' },
  { field_id: 1, name: 'Astronomy' },
];

const phenomena = [
  { phenomenon_id: 9, field_id: 2, name: 'Evolution' },
  { phenomenon_id: 4, field_id: 1, name: 'Stars' },
];

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <PebbleForm onSubmit={jest.fn()} onSaveDraft={jest.fn()} {...props} />
    </MemoryRouter>
  );

const openDrawer = (label) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
};

describe('PebbleForm', () => {
  beforeEach(() => {
    fetchFields.mockResolvedValue(fields);
    fetchPhenomena.mockResolvedValue(phenomena);
  });

  afterEach(() => {
    fetchPlacesApiKey.mockResolvedValue({ key: null, configured: false });
    loadGooglePlacesApi.mockReset();
    loadGoogleMapsApi.mockReset();
  });

  test('follows composer order and keeps multiple fields', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 4 });
    renderForm({ onSaveDraft });

    const labels = [
      'Title',
      'At a glance',
      'Date Time Location',
      'Media',
      'Scientific Fields & Phenomenon Tags',
      'Field Notes',
      'Other',
    ];
    const nodes = labels.map((label) => screen.getByText(label));
    expect(nodes[0].compareDocumentPosition(nodes[nodes.length - 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (let i = 1; i < nodes.length; i += 1) {
      expect(nodes[i - 1].compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByText('You need to select a phenomenon')).toBeInTheDocument();
    expect(screen.getByText('0/10 items selected')).toBeInTheDocument();
    expect(screen.getByText('Add a location')).toBeInTheDocument();
    const privacy = screen.getByRole('switch', { name: 'Private' });
    expect(privacy).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(privacy);
    expect(privacy).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('heading', { name: 'Create a pebble' })).toBeInTheDocument();
    const title = screen.getByRole('heading', { name: 'Create a pebble' });
    expect(title.compareDocumentPosition(screen.getByRole('button', { name: 'Publish' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    openDrawer('Scientific Fields');
    expect(await screen.findByRole('button', { name: /Biology/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Biology/i }));
    fireEvent.click(screen.getByRole('button', { name: /Astronomy/i }));
    expect(screen.getByRole('button', { name: /Biology/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Astronomy/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: (name) => name === 'Evolution' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stars' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: (name) => name === 'evolution' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Other'), { target: { value: 'katabatic wind' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: /katabatic wind/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    openDrawer('Other');
    fireEvent.change(screen.getByPlaceholderText('https://'), {
      target: { value: 'https://example.edu/paper' },
    });
    const question = screen.getByRole('button', { name: 'Add question' });
    fireEvent.click(question);

    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf' } });
    expect(title).toHaveTextContent('Create Shelf');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      title: 'Shelf',
      status: 'draft',
      fieldIds: [2, 1],
      otherTags: ['katabatic wind'],
      resources: ['https://example.edu/paper'],
      isPrivate: true,
    });
  });

  test('offers Evolution and Biotechnology and keeps a saved photosynthesis chip', async () => {
    fetchPhenomena.mockResolvedValue([
      { phenomenon_id: 1, field_id: 2, name: 'Evolution' },
      { phenomenon_id: 2, field_id: 2, name: 'Biotechnology' },
    ]);
    renderForm({
      initial: {
        title: 'Leaf',
        fields: [{ field_id: 2, name: 'Biology' }],
        phenomena: [{ phenomenon_id: 40, field_id: 2, name: 'photosynthesis' }],
      },
    });

    openDrawer('Scientific Fields');
    expect(await screen.findByRole('button', { name: (name) => name === 'Evolution' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Biotechnology' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: (name) => name === 'evolution' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'soil fertility' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'photosynthesis' })).toBeInTheDocument();
  });

  test('publish requires a title', async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('typed coordinates stay on the draft payload', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 8 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fish Islands' } });
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-51.2' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-60.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      placeLat: -51.2,
      placeLng: -60.1,
    });
  });

  test('saves a date without inventing a clock time', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 11 });
    renderForm({ onSaveDraft });
    openDrawer('Date Time Location');
    const dateRow = screen.getByLabelText('Date').closest('.grid');
    expect(dateRow).toHaveClass('grid-cols-2');
    expect(screen.getByLabelText('Time').closest('.grid')).toBe(dateRow);
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      observedOn: '2021-07-27',
      observedTime: null,
      observedAt: null,
    });
  });

  test('reopens a date-only pebble with an empty time and sends 15:00 as 15:00', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 12 });
    const { unmount } = renderForm({
      onSaveDraft,
      initial: {
        title: 'Ice',
        observed_on: '2021-07-27',
        observed_time: null,
        observed_at: null,
      },
    });
    openDrawer('Date Time Location');
    expect(screen.getByLabelText('Date')).toHaveValue('2021-07-27');
    expect(screen.getByLabelText('Time')).toHaveValue('');
    unmount();

    renderForm({ onSaveDraft });
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '15:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      observedOn: '2021-07-27',
      observedTime: '15:00',
      observedAt: null,
    });
  });

  test('fills weather for a Costa Rica pin and keeps Clear night when the pin moves', async () => {
    fetchWeatherSuggestion.mockResolvedValue('rain');
    renderForm();
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:12' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '9.93' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-84.09' } });

    const rain = await screen.findByText('Rain');
    expect(rain).toHaveClass('rounded-xl', 'bg-accent', 'text-white');
    const instructions = screen.getByText(/Choose a Location \/ Date \/ Time to select the weather/);
    expect(instructions).toContainElement(screen.getByRole('button', { name: 'Override?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Override?' }));
    expect(screen.getByRole('button', { name: 'Rain' })).toHaveAttribute('aria-pressed', 'true');
    expect(fetchWeatherSuggestion).toHaveBeenCalledWith({
      lat: 9.93,
      lng: -84.09,
      date: '2021-07-27',
      time: '14:12',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear night' }));
    fetchWeatherSuggestion.mockResolvedValue('sunny');
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '10.2' } });
    expect(screen.getByRole('button', { name: 'Clear night' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rain' })).toHaveAttribute('aria-pressed', 'false');
    expect(fetchWeatherSuggestion).toHaveBeenCalledTimes(1);
  });

  test('leaves weather empty when lookup fails and still saves', async () => {
    fetchWeatherSuggestion.mockResolvedValue(null);
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 13 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Dry pin' } });
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '9.93' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-84.09' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0].weather).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Override?' }));
    expect(screen.getByRole('button', { name: 'Sunny' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('saves a typed pin name when Places returns no name', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 14 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Field site' } });
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Pin name'), { target: { value: 'Antarctica' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-75.2' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '0.4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      pinName: 'Antarctica',
      placeName: '',
      placeLat: -75.2,
      placeLng: 0.4,
    });
  });

  test('save changes publishes the pebble', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({
      onSubmit,
      submitLabel: 'Save changes',
      initial: {
        title: 'Shelf',
        status: 'published',
        phenomena: [{ phenomenon_id: 9, field_id: 2, name: 'Evolution' }],
        place_lat: 10,
        place_lng: 20,
        place_name: 'Shelf',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Shelf',
      status: 'published',
    });
  });

  test('publish requires a phenomenon topic', async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Choose a phenomenon topic');

    openDrawer('Scientific Fields');
    fireEvent.click(await screen.findByRole('button', { name: /Biology/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Evolution' }));
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Add a location');
    openDrawer('Date Time Location');
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '20' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Name the pin');
    fireEvent.change(screen.getByLabelText('Pin name'), { target: { value: 'Shelf' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].phenomenonIds).toEqual([9]);
  });

  test('selecting three photos adds three thumbnails inside the form', async () => {
    uploadFile.mockImplementation(async (file) => ({
      media_id: file.name,
      media_url: `https://example.com/${file.name}`,
      media_type: 'image',
      filename: file.name,
    }));
    renderForm();
    openDrawer('Media');

    ['Photos & videos', 'Audio', 'Data', 'Attachment'].forEach((label) => {
      expect(screen.getByLabelText(label)).toHaveAttribute('multiple');
    });

    const files = ['one.jpg', 'two.jpg', 'three.jpg'].map(
      (name) => new File(['photo'], name, { type: 'image/jpeg' })
    );
    fireEvent.change(screen.getByLabelText('Photos & videos'), { target: { files } });

    const form = screen.getAllByRole('button', { name: 'Publish' })[0].closest('form');
    const gallery = within(form).getByTestId('pebble-form-media');
    expect(form).toHaveClass('overflow-hidden');
    expect(form.querySelector('[data-testid="form-scroll"]')).toContainElement(gallery);
    expect(await within(gallery).findByRole('img', { name: 'three.jpg' })).toBeInTheDocument();
    expect(gallery.querySelector('.grid')).toHaveClass('grid-cols-3', 'w-full', 'min-w-0');
    expect(within(gallery).getAllByRole('img')).toHaveLength(3);
    expect(within(gallery).getByRole('img', { name: 'one.jpg' })).toHaveAttribute(
      'src',
      'https://example.com/one.jpg'
    );
  });

  test('keeps successful files when one upload fails', async () => {
    uploadFile.mockImplementation(async (file) => {
      if (file.name === 'bad.jpg') throw new Error('network down');
      return {
        media_id: file.name,
        media_url: `https://example.com/${file.name}`,
        media_type: 'image',
        filename: file.name,
      };
    });
    renderForm();
    openDrawer('Media');
    const files = ['one.jpg', 'bad.jpg', 'three.jpg'].map(
      (name) => new File(['photo'], name, { type: 'image/jpeg' })
    );
    fireEvent.change(screen.getByLabelText('Photos & videos'), { target: { files } });

    const gallery = screen.getByTestId('pebble-form-media');
    expect(await within(gallery).findByRole('img', { name: 'three.jpg' })).toBeInTheDocument();
    expect(within(gallery).getByRole('img', { name: 'one.jpg' })).toBeInTheDocument();
    expect(within(gallery).queryByRole('img', { name: 'bad.jpg' })).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('bad.jpg: network down');
  });

  test('uploads a large video', async () => {
    uploadFile.mockResolvedValue({
      media_id: 4,
      media_url: 'https://example.com/field.mp4',
      media_type: 'video',
      filename: 'field.mp4',
    });
    const clip = new File(['v'], 'field.mp4', { type: 'video/mp4' });
    Object.defineProperty(clip, 'size', { value: 150 * 1024 * 1024 });
    renderForm();
    openDrawer('Media');
    fireEvent.change(screen.getByLabelText('Photos & videos'), { target: { files: [clip] } });
    const video = await screen.findByLabelText('field.mp4');
    expect(video).toHaveAttribute('src', 'https://example.com/field.mp4');
    expect(video.controls).toBe(true);
    expect(video.parentElement.querySelector('svg')).not.toBeInTheDocument();
    expect(uploadFile).toHaveBeenCalledWith(clip, 'video');
  });

  test('opens the location map in a centered modal', () => {
    renderForm();
    openDrawer('Date Time Location');
    fireEvent.click(screen.getByRole('button', { name: 'Expand map' }));
    const dialog = screen.getByRole('dialog', { name: 'Location' });
    expect(dialog.parentElement).toHaveClass('fixed', 'inset-0', 'items-center', 'justify-center');
    fireEvent.click(screen.getByRole('button', { name: 'Minimize map' }));
    expect(screen.queryByRole('dialog', { name: 'Location' })).not.toBeInTheDocument();
  });

  test('shows saved photo and video thumbnails', () => {
    renderForm({
      initial: {
        title: 'Ice',
        media: [
          { media_id: 1, media_url: 'https://example.com/a.jpg', media_type: 'image', filename: 'a.jpg' },
          { media_id: 2, media_url: 'https://example.com/b.mp4', media_type: 'video', filename: 'b.mp4' },
        ],
      },
    });
    openDrawer('Media');
    const gallery = screen.getByTestId('pebble-form-media');
    expect(within(gallery).getByRole('img', { name: 'a.jpg' })).toHaveAttribute(
      'src',
      'https://example.com/a.jpg'
    );
    expect(within(gallery).getByLabelText('b.mp4')).toHaveAttribute(
      'src',
      'https://example.com/b.mp4'
    );
    expect(within(gallery).getByLabelText('b.mp4').controls).toBe(true);
  });

  test('shows a loading tile as soon as a photo is chosen', async () => {
    let release;
    uploadFile.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    renderForm();
    openDrawer('Media');
    const file = new File(['photo'], 'one.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Photos & videos'), { target: { files: [file] } });
    expect(screen.getByText('Loading media')).toBeInTheDocument();
    expect(screen.getByText('1/10 items selected')).toBeInTheDocument();
    await act(async () => {
      release({
        media_id: 'one.jpg',
        media_url: 'https://example.com/one.jpg',
        media_type: 'image',
        filename: 'one.jpg',
      });
    });
    expect(await screen.findByRole('img', { name: 'one.jpg' })).toBeInTheDocument();
    expect(screen.queryByText('Loading media')).not.toBeInTheDocument();
  });

  test('opens a thumbnail in the editor and removes it from the grid', () => {
    renderForm({
      initial: {
        title: 'Ice',
        media: [
          { media_id: 1, media_url: 'https://example.com/a.jpg', media_type: 'image', filename: 'a.jpg' },
        ],
      },
    });
    openDrawer('Media');
    fireEvent.click(screen.getByRole('button', { name: 'Open a.jpg' }));
    const editor = screen.getByTestId('media-editor');
    const photo = within(editor).getByRole('img', { name: 'a.jpg' });
    const imageTitle = within(editor).getByLabelText('Title');
    const caption = within(editor).getByLabelText('Caption');
    expect(photo.compareDocumentPosition(imageTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(imageTitle.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(editor).getByRole('button', { name: 'Featured image' })).toBeInTheDocument();
    fireEvent.click(within(editor).getByRole('button', { name: 'Adjust preview' }));
    expect(within(editor).getByTestId('media-crop').closest('.aspect-square')).toBeTruthy();
    expect(within(editor).queryByRole('button', { name: 'Slide 1 of 1' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.jpg' }));
    expect(screen.queryByRole('img', { name: 'a.jpg' })).not.toBeInTheDocument();
  });

  test('puts the pebble title in the form heading', () => {
    const { unmount } = renderForm();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
    expect(screen.getByRole('heading', { name: 'Create a pebble' })).toBeInTheDocument();
    unmount();

    renderForm({ pageTitle: 'Edit pebble', initial: { title: 'Shelf ice' } });
    expect(screen.getByRole('heading', { name: 'Edit Shelf ice' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } });
    expect(screen.getByRole('heading', { name: 'Edit a pebble' })).toBeInTheDocument();
  });

  test('slides between photos and saves an optional image title', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 4 });
    renderForm({
      onSaveDraft,
      initial: {
        title: 'Ice',
        media: [
          {
            media_id: 1,
            media_url: 'https://example.com/a.jpg',
            media_type: 'image',
            filename: 'a.jpg',
            title: 'Face',
            caption: 'Noon',
          },
          {
            media_id: 2,
            media_url: 'https://example.com/b.jpg',
            media_type: 'image',
            filename: 'b.jpg',
            title: 'Camp',
            caption: '',
          },
        ],
      },
    });
    openDrawer('Media');
    fireEvent.click(screen.getByRole('button', { name: 'Open a.jpg' }));
    const editor = screen.getByTestId('media-editor');
    expect(within(editor).getByRole('button', { name: 'Slide 1 of 2' })).toHaveAttribute('aria-current', 'true');
    expect(within(editor).getByLabelText('Title')).toHaveValue('Face');
    fireEvent.click(within(editor).getByRole('button', { name: 'Slide 2 of 2' }));
    expect(within(editor).getByRole('button', { name: 'Slide 2 of 2' })).toHaveAttribute('aria-current', 'true');
    expect(within(editor).getByLabelText('Title')).toHaveValue('Camp');
    expect(within(editor).getByLabelText('Caption')).toHaveValue('');
    fireEvent.change(within(editor).getByLabelText('Title'), { target: { value: 'Cliff' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0].media[1]).toMatchObject({ title: 'Cliff', caption: null });
  });

  test('dropping a pin clears the location and requires a pin name', async () => {
    let clickHandler;
    fetchPlacesApiKey.mockResolvedValue({ key: 'test', configured: true, mapId: null });
    loadGooglePlacesApi.mockRejectedValue(new Error('no places'));
    loadGoogleMapsApi.mockResolvedValue({
      maps: {
        Map: jest.fn(() => ({
          addListener: (event, handler) => {
            if (event === 'click') clickHandler = handler;
          },
          panTo: jest.fn(),
          setZoom: jest.fn(),
        })),
        Marker: jest.fn(() => ({ setMap: jest.fn(), setPosition: jest.fn() })),
        event: { trigger: jest.fn() },
      },
    });
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf' } });
    openDrawer('Scientific Fields');
    fireEvent.click(await screen.findByRole('button', { name: /Biology/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Evolution' }));
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    openDrawer('Date Time Location');
    await screen.findByText(/Places failed to load/);
    await waitFor(() => expect(clickHandler).toEqual(expect.any(Function)));
    fireEvent.change(screen.getByLabelText(/Location/), { target: { value: 'Fish Islands' } });
    expect(screen.getByLabelText('Pin name')).toHaveValue('Fish Islands');
    act(() => {
      clickHandler({ latLng: { lat: () => 10, lng: () => 20 } });
    });
    expect(screen.getByLabelText(/Location/)).toHaveValue('');
    expect(screen.getByLabelText('Pin name')).toHaveValue('');
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Name the pin');
    fireEvent.change(screen.getByLabelText('Pin name'), { target: { value: 'Camp' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Publish' })[0]);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      placeName: '',
      placeLat: 10,
      placeLng: 20,
      pinName: 'Camp',
    });
    fetchPlacesApiKey.mockResolvedValue({ key: null, configured: false });
    loadGooglePlacesApi.mockReset();
  });

  test('stamps the time a draft was saved', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 4 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByTestId('form-saved-at')).toHaveTextContent(/^Saved \d{1,2}:\d{2} (AM|PM)$/);
  });
});
