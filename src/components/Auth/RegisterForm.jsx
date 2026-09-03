import React, { useState } from 'react';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const RegisterForm = ({ onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState('personal');
  const [organizationName, setOrganizationName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      email,
      password,
      username,
      displayName,
      accountType,
      organizationName: accountType === 'organization' ? organizationName : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm text-muted">Account type</legend>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="accountType"
            checked={accountType === 'personal'}
            onChange={() => setAccountType('personal')}
          />
          Personal
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            name="accountType"
            checked={accountType === 'organization'}
            onChange={() => setAccountType('organization')}
          />
          Organization
        </label>
      </fieldset>
      {accountType === 'organization' ? (
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Organization name</span>
          <input
            type="text"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Username</span>
        <input
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Display name</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-accent px-3 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
};

export default RegisterForm;
