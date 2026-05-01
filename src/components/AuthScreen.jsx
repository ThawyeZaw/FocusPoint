import React, { useState } from 'react';
import { BookOpenCheck, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthScreen() {
  const { signIn, signUp, setupError } = useAuth();
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setSubmitting(true);

    try {
      if (isSignup) {
        const data = await signUp(form);
        if (!data.session) {
          setStatus('Check your email to confirm your account, then return to FocusPoint.');
        }
      } else {
        await signIn(form);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="auth-brand-icon"><BookOpenCheck className="h-5 w-5" /></span>
          <div>
            <h1>FocusPoint</h1>
            <p>Sign in to sync your study plan across devices.</p>
          </div>
        </div>

        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button type="button" className={isSignup ? 'active' : ''} onClick={() => setMode('signup')}>
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
          <button type="button" className={!isSignup ? 'active' : ''} onClick={() => setMode('signin')}>
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label>
              <span>Name</span>
              <input
                className="input-field"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <div className="auth-input-icon">
              <Mail className="h-4 w-4" />
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="auth-input-icon">
              <Lock className="h-4 w-4" />
              <input
                className="input-field"
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>
          </label>

          {(error || setupError) && <p className="auth-error">{error || setupError}</p>}
          {status && <p className="auth-status">{status}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
            {isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {submitting ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
