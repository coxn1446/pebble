import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import AuthPageLayout from '../components/Auth/AuthPageLayout';
import RegisterForm from '../components/Auth/RegisterForm';
import OAuthButtons from '../components/Auth/OAuthButtons';
import { WelcomeFooter } from '../components/Welcome/WelcomeShared';
import { registerWithPassword } from '../helpers/authHelpers';
import { setUser } from '../store/auth.reducer';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      const user = await registerWithPassword(payload);
      dispatch(setUser(user));
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <AuthPageLayout title="Create account" subtitle="Stored in Postgres with a bcrypt password hash.">
          <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          <div className="my-6 flex items-center gap-3 text-xs text-pebble">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <OAuthButtons />
          <p className="mt-6 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </AuthPageLayout>
      </div>
      <WelcomeFooter />
    </div>
  );
};

export default Register;
