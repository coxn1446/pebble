import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { fetchPebble, updatePebble } from '../helpers/pebbleHelpers';

const PebbleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pebble, setPebble] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPebble(id)
      .then(setPebble)
      .catch((err) => toast.error(err.message || 'Could not load pebble'));
  }, [id]);

  if (!pebble) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <PebbleForm
      initial={pebble}
      pageTitle="Edit pebble"
      submitLabel="Save changes"
      isSubmitting={isSubmitting}
      onSubmit={async (payload) => {
        setIsSubmitting(true);
        try {
          const next = await updatePebble(id, payload);
          toast.success('Changes saved');
          navigate(`/pebbles/${next.pebble_id}`);
        } catch (err) {
          toast.error(err.message || 'Could not save');
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
  );
};

export default PebbleEdit;
