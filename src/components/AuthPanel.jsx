import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, signUp } from '../store/authSlice';

export default function AuthPanel() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();
    const action = mode === 'login' ? signIn({ username, password }) : signUp({ username, password });
    await dispatch(action);
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><div className="logo large">ELD</div><div><p className="eyebrow">DRIVER OPERATIONS</p><h1>ELD Trip Planner</h1></div></div>
      <p className="auth-copy">Plan routes, schedule HOS events, review daily logs, and export a trip PDF from one workspace.</p>
      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label>Username<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="driver01" required /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} /></label>
        {error && <div className="error">{error}</div>}
        <button disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="auth-foot">Your trips are private to your signed-in account.</p>
    </section>
  </main>;
}
