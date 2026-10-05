import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { createPebble, publishedMapPath, updatePebble } from '../helpers/pebbleHelpers';

const PebbleNew = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = async (payload) => {
    const body = { ...payload, status: 'draft' };
    if (payload.pebbleId) return updatePebble(payload.pebbleId, body);
    return createPebble(body);
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      const body = { ...payload, status: 'published' };
      const pebble = payload.pebbleId
        ? await updatePebble(payload.pebbleId, body)
        : await createPebble(body);
      toast.success('Pebble published');
      navigate(publishedMapPath(pebble));
    } catch (err) {
      toast.error(err.message || 'Could not create pebble');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PebbleForm
      pageTitle="Create pebble"
      submitLabel="Publish"
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      isSubmitting={isSubmitting}
    />
  );
};

export default PebbleNew;
