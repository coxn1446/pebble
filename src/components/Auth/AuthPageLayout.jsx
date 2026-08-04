import React from 'react';
import BrandMark from '../Brand/BrandMark';

const AuthPageLayout = ({ title, subtitle, children }) => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center animate-fade-up">
    <BrandMark size="md" showTagline className="mb-8" />
    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
    {subtitle ? <p className="mt-2 text-sm text-slate/70">{subtitle}</p> : null}
    <div className="mt-8">{children}</div>
  </div>
);

export default AuthPageLayout;
