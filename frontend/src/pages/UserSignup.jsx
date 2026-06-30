import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
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

export default function UserSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const { show, Toast } = useToast();

  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    user_name: '',
    password: '',
    user_address: '',
    contact: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!inviteCode) {
      setError(true);
      setLoading(false);
      return;
    }
    fetchGroupInfo();
  }, [inviteCode]);

  const fetchGroupInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/invite/${inviteCode}`);
      setGroupInfo(res.data);
    } catch {
      setError(true);
      show('Invalid invite link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/user/signup`, {
        user_name: form.user_name,
        password: form.password,
        user_address: form.user_address,
        contact: form.contact,
        invite_code: inviteCode,
      });
      setSuccess(true);
      show('✓ Account created! Awaiting admin approval…', 'success');
      setTimeout(() => navigate('/'), 3500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Signup failed';
      show(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <Toast />
        <p className="text-muted" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Validating invite…
        </p>
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className="auth-page">
        <Toast />
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-wrap anim-fade-up">
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>Invalid Invite Link</h3>
              <p className="text-muted text-sm" style={{ maxWidth: 320 }}>
                The invite link is invalid or has expired. Ask your kitchen admin for a new invite.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <a href="/" className="btn btn-ghost" style={{ flex: 1, textAlign: 'center' }}>Sign In</a>
                <a href="/admin/signup" className="btn btn-saffron" style={{ flex: 1, textAlign: 'center' }}>Create Group</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <Toast />
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-wrap anim-fade-up">
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Account Created!</h3>
              <p className="text-muted text-sm" style={{ maxWidth: 320, marginBottom: '1rem' }}>
                Your account is pending admin approval for <strong>{groupInfo.group_name}</strong>. You'll be able to access the group once approved.
              </p>
              <p className="text-xs text-dim">Redirecting to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            You're Invited
          </p>
          <h1 style={{ fontSize: '2.6rem', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--t1)' }}>
            Join
            <br />
            <span style={{ color: 'var(--saffron)' }}>{groupInfo.group_name}</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 360 }}>
            You've been invited to join this group. Create your account below to get started.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2.5rem', position: 'relative', zIndex: 1 }}>
          {[
            ['✓', 'Create your account'],
            ['⏳', 'Wait for admin approval'],
            ['🚀', 'Start tracking expenses'],
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
          <h2 style={{ marginBottom: '0.35rem' }}>Join {groupInfo.group_name}</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
            Create your account to join this group
          </p>

          <form onSubmit={handleSignup}>
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

            <button className="btn btn-saffron btn-full" style={{ marginTop: '0.5rem' }} disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account →'}
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