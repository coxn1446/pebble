import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from '../Icons/Icons';
import peopleIcon from '../../resources/icon - people.png';

const inputClass =
  'w-full rounded-full border border-border bg-background px-4 py-2.5 text-base text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const LoginForm = ({ onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink">
            Email address
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="researcher@institute.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-ink">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide text-ink transition hover:text-ocean"
              onClick={() => toast.error('Password reset is not available yet.')}
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-4 flex items-center text-pebble transition hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((open) => !open)}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mx-auto flex items-center justify-center gap-3 rounded-full border-2 border-ink bg-surface px-8 py-1 text-ink transition hover:bg-ink hover:text-white disabled:opacity-60"
      >
        <img src={peopleIcon} alt="" className="h-12 w-12" />
        <span className="text-sm font-semibold uppercase tracking-wide">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </span>
      </button>
    </form>
  );
};

export default LoginForm;
