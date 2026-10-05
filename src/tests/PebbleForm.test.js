import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { uploadFile } from '../helpers/uploadHelpers';
import { fetchFields, fetchPhenomena } from '../helpers/taxonomyHelpers';
import { fetchWeatherSuggestion } from '../helpers/weatherHelpers';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('../helpers/uploadHelpers', () => {
  const actual = jest.requireActual('../helpers/uploadHelpers');
  return {
    ...actual,
    uploadFile: jest.fn(),
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

describe('PebbleForm', () => {
  beforeEach(() => {
    fetchFields.mockResolvedValue(fields);
    fetchPhenomena.mockResolvedValue(phenomena);
  });

  test('follows composer order and keeps multiple fields', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 4 });
    renderForm({ onSaveDraft });

    const labels = [
      'Title',
      'At a glance',
      'Date',
      'Time',
      'Location',
      'Pin name',
      'Weather',
      'Featured image',
      'Media',
      'Scientific fields',
      'Phenomenon tags',
      'Further reading',
      'Questions to consider',
      'Field notes',
    ];
    const nodes = labels.map((label) => screen.getByText(new RegExp(`^${label}`)));
    const tops = nodes.map((node) => node.compareDocumentPosition(nodes[0]));
    expect(nodes[0].compareDocumentPosition(nodes[nodes.length - 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (let i = 1; i < nodes.length; i += 1) {
      expect(nodes[i - 1].compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(tops).toHaveLength(labels.length);

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

    fireEvent.change(screen.getByPlaceholderText('https://'), {
      target: { value: 'https://example.edu/paper' },
    });
    const question = screen.getByRole('button', { name: 'Add question' });
    fireEvent.click(question);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Shelf' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[0]);
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      title: 'Shelf',
      status: 'draft',
      fieldIds: [2, 1],
      otherTags: ['katabatic wind'],
      resources: ['https://example.edu/paper'],
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
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-51.2' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-60.1' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fish Islands' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[0]);
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      placeLat: -51.2,
      placeLng: -60.1,
    });
  });

  test('saves a date without inventing a clock time', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 11 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[0]);
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
    expect(screen.getByLabelText('Date')).toHaveValue('2021-07-27');
    expect(screen.getByLabelText('Time')).toHaveValue('');
    unmount();

    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '15:00' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[1]);
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
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2021-07-27' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '9.93' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-84.09' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Dry pin' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[1]);
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0].weather).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Override?' }));
    expect(screen.getByRole('button', { name: 'Sunny' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('saves a typed pin name when Places returns no name', async () => {
    const onSaveDraft = jest.fn().mockResolvedValue({ pebble_id: 14 });
    renderForm({ onSaveDraft });
    fireEvent.change(screen.getByLabelText('Pin name'), { target: { value: 'Antarctica' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-75.2' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Field site' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save progress' })[0]);
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled());
    expect(onSaveDraft.mock.calls.at(-1)[0]).toMatchObject({
      pinName: 'Antarctica',
      placeName: '',
      placeLat: -75.2,
      placeLng: 0.4,
    });
  });

  test('bottom save changes publishes the same payload as the header button', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({
      onSubmit,
      submitLabel: 'Save changes',
      initial: { title: 'Shelf', status: 'published' },
    });
    const saves = screen.getAllByRole('button', { name: 'Save changes' });
    expect(saves).toHaveLength(2);
    fireEvent.click(saves[1]);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Shelf',
      status: 'published',
    });
  });

  test('selecting three photos adds three thumbnails inside the form', async () => {
    uploadFile.mockImplementation(async (file) => ({
      media_id: file.name,
      media_url: `https://example.com/${file.name}`,
      media_type: 'image',
      filename: file.name,
    }));
    renderForm();

    ['Photo', 'Video', 'Audio', 'Data', 'Attachment'].forEach((label) => {
      expect(screen.getByLabelText(label)).toHaveAttribute('multiple');
    });

    const files = ['one.jpg', 'two.jpg', 'three.jpg'].map(
      (name) => new File(['photo'], name, { type: 'image/jpeg' })
    );
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files } });

    const form = screen.getAllByRole('button', { name: 'Publish' })[0].closest('form');
    const grid = within(form).getByTestId('pebble-form-media');
    expect(form).toHaveClass('w-full', 'min-w-0', 'max-w-full');
    expect(grid).toHaveClass('grid-cols-3', 'w-full', 'min-w-0');
    expect(await within(grid).findByRole('img', { name: 'three.jpg' })).toBeInTheDocument();
    expect(within(grid).getAllByRole('img')).toHaveLength(3);
    expect(within(grid).getByRole('img', { name: 'one.jpg' })).toHaveAttribute(
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
    const files = ['one.jpg', 'bad.jpg', 'three.jpg'].map(
      (name) => new File(['photo'], name, { type: 'image/jpeg' })
    );
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files } });

    const grid = screen.getByTestId('pebble-form-media');
    expect(await within(grid).findByRole('img', { name: 'three.jpg' })).toBeInTheDocument();
    expect(within(grid).getByRole('img', { name: 'one.jpg' })).toBeInTheDocument();
    expect(within(grid).queryByRole('img', { name: 'bad.jpg' })).not.toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Video'), { target: { files: [clip] } });
    const video = await screen.findByLabelText('field.mp4');
    expect(video).toHaveAttribute('src', 'https://example.com/field.mp4#t=0.1');
    expect(uploadFile).toHaveBeenCalledWith(clip, 'video');
  });

  test('opens the location map in a centered modal', () => {
    renderForm();
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
    const grid = screen.getByTestId('pebble-form-media');
    expect(within(grid).getByRole('img', { name: 'a.jpg' })).toHaveAttribute(
      'src',
      'https://example.com/a.jpg'
    );
    expect(within(grid).getByLabelText('b.mp4')).toHaveAttribute(
      'src',
      'https://example.com/b.mp4#t=0.1'
    );
  });
});
