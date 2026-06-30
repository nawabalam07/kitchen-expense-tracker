import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AdminSignup() {
  const [form, setForm] = useState({
    user_name: '',
    password: '',
    password_confirm: '',
    user_address: '',
    contact: '',
    group_name: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { show, Toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      show('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/signup`, {
        user_name: form.user_name,
        password: form.password,
        user_address: form.user_address,
        contact: form.contact,
        group_name: form.group_name,
      });
      login(res.data);
      show('Welcome, admin! 🎉', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.status === 400
        ? err.response?.data?.detail || 'Username already taken'
        : 'Signup failed. Try again.';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Toast />

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
            Admin Setup
          </p>
          <h1 style={{ fontSize: '2.6rem', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--t1)' }}>
            Set up your<br />
            <span style={{ color: 'var(--saffron)' }}>kitchen group.</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 360 }}>
            Create your account and start managing shared expenses with your roommates.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2.5rem', position: 'relative', zIndex: 1 }}>
          {[
            ['1️⃣', 'Create your admin account'],
            ['2️⃣', 'Set up your first group'],
            ['3️⃣', 'Invite roommates to join'],
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

      <div className="auth-right">
        <div className="auth-form-wrap anim-fade-up">
          <h2 style={{ marginBottom: '0.35rem' }}>Create Admin Account</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
            Set yourself up as the kitchen group admin
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                className="input"
                placeholder="Choose a username"
                value={form.user_name}
                onChange={e => setForm({ ...form, user_name: e.target.value })}
                required autoFocus
              />
            </div>

            <div className="field">
              <label>Address</label>
              <input
                className="input"
                placeholder="Your address"
                value={form.user_address}
                onChange={e => setForm({ ...form, user_address: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Contact</label>
              <input
                className="input"
                placeholder="Phone number"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <input
                  className="input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.password_confirm}
                  onChange={e => setForm({ ...form, password_confirm: e.target.value })}
                  required
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <div className="field">
              <label>Group Name</label>
              <input
                className="input"
                placeholder="e.g. Our Flat, Roommates 2024"
                value={form.group_name}
                onChange={e => setForm({ ...form, group_name: e.target.value })}
                required
              />
            </div>

            <button className="btn btn-saffron btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account & Group →'}
            </button>
          </form>

          <hr className="divider" />

          <p className="text-sm text-muted text-center">
            Already have an account?{' '}
            <a href="/" style={{ color: 'var(--saffron)', fontWeight: 600 }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}