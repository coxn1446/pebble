import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import BrandMark from '../components/Brand/BrandMark';
import LoginForm from '../components/Auth/LoginForm';
import OAuthButtons from '../components/Auth/OAuthButtons';
import { WELCOME_TAGLINE, WelcomeFooter } from '../components/Welcome/WelcomeShared';
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-surface">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-ocean/10 px-6 py-8 text-center animate-fade-up md:px-10">
          <BrandMark size="lg" showWordmark={false} to="/" />
          <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-ink">
            Sign in to Pebble
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-tagline text-moss">
            {WELCOME_TAGLINE}
          </p>
          <div className="mt-8 w-full">
            <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
          <div className="mt-8 w-full">
            <OAuthButtons showHint={false} />
          </div>
        </div>
      </div>
      <WelcomeFooter />
    </div>
  );
};

export default Login;
