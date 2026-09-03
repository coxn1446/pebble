import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  AttachmentIcon,
  AudioIcon,
  BiologyIcon,
  DataIcon,
  FeedIcon,
  FilterIcon,
  HomeIcon,
  IconLabel,
  MapIcon,
  PhotoIcon,
  VideoIcon,
  fieldIconForName,
} from '../components/Icons/Icons';

describe('Icons', () => {
  test('renders branded icon components', () => {
    const { container } = render(
      <>
        <HomeIcon />
        <MapIcon />
        <FeedIcon />
        <FilterIcon />
        <PhotoIcon />
        <VideoIcon />
        <AudioIcon />
        <DataIcon />
        <AttachmentIcon />
        <BiologyIcon />
      </>
    );
    expect(container.querySelectorAll('svg')).toHaveLength(10);
  });

  test('fieldIconForName maps taxonomy fields', () => {
    expect(fieldIconForName('Biology')).toBe(BiologyIcon);
    expect(fieldIconForName('Unknown')).toBe(DataIcon);
  });

  test('IconLabel formats as Icon | Name', () => {
    render(<IconLabel icon={PhotoIcon} label="Photo" />);
    expect(screen.getByText('|')).toBeInTheDocument();
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });
});
