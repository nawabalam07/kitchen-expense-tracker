import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useToast } from '../useToast.jsx';
import { API_URL } from '../config';

function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ArrowIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Groups() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { show, Toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role === 'admin') { navigate('/admin/dashboard'); return; }
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/groups?user_id=${user.user_id}`);
      setGroups(res.data);
    } catch {
      show('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const accepted = groups.filter(g => g.status === 'accepted');
  const pending  = groups.filter(g => g.status === 'pending');

  return (
    <div className="page-wrap">
      <Toast />

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-mark">
          <span className="logo-icon">🍳</span>
          KitchenMate
        </div>
        <div className="navbar-right">
          <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>👋 {user?.user_name}</span>
          <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/'); }}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: 860 }}>
        {/* Page header */}
        <div className="anim-fade-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ marginBottom: '0.35rem' }}>Your Groups</h1>
          <p className="text-muted">Select a group to view the shared expense dashboard.</p>
        </div>

        {loading ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '4rem' }}>
            <p className="text-muted">Loading your groups…</p>
          </div>
        ) : (
          <>
            {/* Pending groups */}
            {pending.length > 0 && (
              <div style={{ marginBottom: '2.5rem' }} className="anim-fade-up">
                <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
                  ⏳ Awaiting Approval
                </p>
                <div className="grid-2">
                  {pending.map(g => (
                    <div key={g.group_id} className="group-card pending">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 'var(--r-md)',
                          background: 'rgba(251,191,87,0.08)',
                          border: '1px solid rgba(251,191,87,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 800,
                          color: '#fbbf57', fontSize: '0.9rem', flexShrink: 0,
                        }}>
                          {initials(g.group_name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: '0.1rem' }}>{g.group_name}</p>
                          <span className="badge badge-pending">Pending</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted">
                        Your request is waiting for admin approval. You'll get access once they approve.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active groups */}
            <div className="anim-fade-up">
              <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
                ✅ Active Groups
              </p>
              {accepted.length === 0 ? (
                <div className="card card-pad">
                  <div className="empty-state">
                    <div className="empty-icon">🍽️</div>
                    <h3>No active groups yet</h3>
                    <p className="text-muted text-sm" style={{ maxWidth: 320 }}>
                      {pending.length > 0
                        ? 'Your request is pending. Once approved, your group will appear here.'
                        : 'Ask your kitchen admin to share an invite link with you.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid-2">
                  {accepted.map(g => (
                    <div
                      key={g.group_id}
                      className="group-card anim-fade-up"
                      onClick={() => navigate(`/dashboard/${g.group_id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 'var(--r-md)',
                          background: 'var(--saffron-bg)',
                          border: '1px solid var(--saffron-rim)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 800,
                          color: 'var(--saffron)', fontSize: '0.95rem', flexShrink: 0,
                        }}>
                          {initials(g.group_name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--t1)', marginBottom: '0.2rem' }}>
                            {g.group_name}
                          </p>
                          <span className="badge badge-active">Active</span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid var(--rim)',
                      }}>
                        <p className="text-sm text-muted">Open dashboard</p>
                        <span style={{ color: 'var(--saffron)' }}><ArrowIcon /></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}