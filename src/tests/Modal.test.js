import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from '../components/Modal/Modal';

describe('Modal', () => {
  test('renders title and children when open', () => {
    render(
      <Modal open title="Test modal" onClose={jest.fn()}>
        <p>Body content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test modal')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <Modal open={false} title="Hidden" onClose={jest.fn()}>
        <p>Nope</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose on Escape', () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Escapable" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
