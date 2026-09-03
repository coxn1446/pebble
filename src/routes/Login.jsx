import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthPageLayout from '../components/Auth/AuthPageLayout';
import LoginForm from '../components/Auth/LoginForm';
import OAuthButtons from '../components/Auth/OAuthButtons';
import { loginWithPassword } from '../helpers/authHelpers';
import { setUser } from '../store/auth.reducer';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ email, password }) => {
    setIsSubmitting(true);
    try {
      const user = await loginWithPassword(email, password);
      dispatch(setUser(user));
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout title="Sign in" subtitle="Local email and password, or OAuth when configured.">
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <div className="my-6 flex items-center gap-3 text-xs text-pebble">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <OAuthButtons />
    </AuthPageLayout>
  );
};

export default Login;
