import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DeletePebbleConfirm from '../components/Pebbles/DeletePebbleConfirm';
import PebbleForm from '../components/Pebbles/PebbleForm';
import { deletePebble, fetchPebble, publishedMapPath, updatePebble } from '../helpers/pebbleHelpers';

const PebbleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pebble, setPebble] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchPebble(id)
      .then(setPebble)
      .catch((err) => toast.error(err.message || 'Could not load pebble'));
  }, [id]);

  if (!pebble) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <>
    <PebbleForm
      initial={pebble}
      pageTitle="Edit pebble"
      submitLabel={pebble.status === 'draft' ? 'Publish' : 'Save changes'}
      isSubmitting={isSubmitting}
      onDelete={pebble.status === 'draft' ? () => setConfirmDelete(true) : undefined}
      onSaveDraft={async (payload) => {
        const status = pebble.status === 'published' ? 'published' : 'draft';
        return updatePebble(id, { ...payload, status });
      }}
      onSubmit={async (payload) => {
        setIsSubmitting(true);
        try {
          const next = await updatePebble(id, { ...payload, status: 'published' });
          toast.success('Changes saved');
          navigate(publishedMapPath(next));
        } catch (err) {
          toast.error(err.message || 'Could not save');
          throw err;
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
    <DeletePebbleConfirm
      pebble={confirmDelete ? pebble : null}
      onCancel={() => setConfirmDelete(false)}
      onConfirm={async () => {
        try {
          await deletePebble(id);
          toast.success('Pebble deleted');
          navigate('/profile');
        } catch (err) {
          toast.error(err.message || 'Could not delete pebble');
        }
      }}
    />
    </>
  );
};

export default PebbleEdit;
