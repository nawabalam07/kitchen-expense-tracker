import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useToast } from '../useToast.jsx';
import { API_URL } from '../config';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function Login() {
  const [form, setForm] = useState({ user_name: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { show, Toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, {
        user_name: form.user_name,
        password: form.password,
      });
      const userData = res.data.user;
      login(userData);
      navigate(userData.role === 'admin' ? '/admin/dashboard' : '/groups');
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Incorrect username or password.'
        : 'Cannot connect to server. Try again.';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Toast />

      {/* Left panel */}
      <div className="auth-left">
        <div className="logo-mark" style={{ marginBottom: '3rem' }}>
          <span className="logo-icon">🍳</span>
          KitchenMate
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--saffron)', marginBottom: '1rem'
          }}>
            Shared expense tracking
          </p>
          <h1 style={{ fontSize: '2.6rem', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--t1)' }}>
            Your kitchen,<br />
            <span style={{ color: 'var(--saffron)' }}>your accounts.</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 360 }}>
            Split costs fairly, track who owes what, and keep every meal drama-free.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2.5rem', position: 'relative', zIndex: 1 }}>
          {[
            ['🔗', 'Invite members via a private link'],
            ['✅', 'Admin approves every join request'],
            ['📊', 'Real-time balances for your group'],
          ].map(([icon, text]) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1rem',
              background: 'rgba(245,166,35,0.07)',
              border: '1px solid rgba(245,166,35,0.15)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.85rem', color: 'var(--t2)',
            }}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap anim-fade-up">
          <h2 style={{ marginBottom: '0.35rem' }}>Sign in</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                className="input"
                placeholder="Your username"
                value={form.user_name}
                onChange={e => setForm({ ...form, user_name: e.target.value })}
                required autoFocus
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            <button className="btn btn-saffron btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <hr className="divider" />

          <p className="text-sm text-muted text-center">
            Setting up a new kitchen?{' '}
            <Link to="/admin/signup" style={{ color: 'var(--saffron)', fontWeight: 600 }}>Create admin account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}