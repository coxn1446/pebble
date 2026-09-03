import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { createPebble } from '../helpers/pebbleHelpers';

const PebbleNew = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      const pebble = await createPebble(payload);
      toast.success('Pebble published');
      navigate(`/pebbles/${pebble.pebble_id}`);
    } catch (err) {
      toast.error(err.message || 'Could not create pebble');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PebbleForm
      pageTitle="Create pebble"
      submitLabel="Publish"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default PebbleNew;
