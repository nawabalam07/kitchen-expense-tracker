import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useToast } from '../useToast.jsx';
import { API_URL } from '../config';

function BackIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function RefreshIcon({ spinning }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={spinning ? { animation: 'spin 0.8s linear infinite' } : undefined}
    >
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}
function CheckIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="3.5"/></svg>;
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function Checkbox({ checked, label, onChange }) {
  return (
    <label className={`check-label ${checked ? 'checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span className="check-box">{checked && <CheckIcon />}</span>
      <span>{label}</span>
    </label>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { show, Toast } = useToast();

  const [groupInfo, setGroupInfo]     = useState(null);
  const [users, setUsers]             = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [balances, setBalances]       = useState([]);
  const [tab, setTab]                 = useState('expenses');
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const [form, setForm] = useState({ description: '', amount: '', date: '', });
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchAll();
  }, [user, groupId]);

  const fetchAll = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [usersRes, expRes, balRes, groupsRes] = await Promise.all([
        axios.get(`${API_URL}/users?group_id=${groupId}`),
        axios.get(`${API_URL}/expenses?group_id=${groupId}`),
        axios.get(`${API_URL}/balances?group_id=${groupId}`),
        axios.get(`${API_URL}/groups?user_id=${user.user_id}`),
      ]);
      setUsers(usersRes.data);
      setExpenses(expRes.data);
      setBalances(balRes.data);
      const g = groupsRes.data.find(g => g.group_id === parseInt(groupId));
      setGroupInfo(g);
      if (!g) { show('You are not a member of this group.', 'error'); navigate('/groups'); }
      if (isManualRefresh) show('Dashboard refreshed', 'success');
    } catch {
      show('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchAll(true);

  const toggleUser = (uid) =>
    setSelected(s => s.includes(uid) ? s.filter(i => i !== uid) : [...s, uid]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { show('Select at least one person to split with.', 'error'); return; }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/expenses`, {
        group_id: parseInt(groupId),
        paid_by: user.user_id,
        amount: parseFloat(form.amount),
        expense_date: form.date,
        description: form.description,
        users: selected,
      });
      show('Expense added!', 'success');
      setShowModal(false);
      setForm({ description: '', amount: '', date: '' });
      setSelected([]);
      fetchAll();
    } catch {
      show('Failed to add expense. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const myBalance = balances.find(b => b.user_id === user?.user_id)?.amount || 0;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="page-wrap" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <Toast />

      <nav className="navbar">
        <div className="navbar-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/groups')}
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <BackIcon />
          </button>
          <div className="logo-mark">
            <span className="logo-icon">🍳</span>
            <span style={{ color: 'var(--t2)', fontWeight: 400, fontSize: '0.9rem' }}>
              {groupInfo?.group_name || 'Loading…'}
            </span>
          </div>
        </div>
        <div className="navbar-right">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshIcon spinning={refreshing} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="btn btn-saffron btn-sm" onClick={() => setShowModal(true)}>
            <PlusIcon /> Add Expense
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/'); }}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </nav>

      <div className="container">

        <div className="anim-fade-up" style={{ marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--ink-3) 100%)',
            border: '1px solid var(--rim)',
            borderRadius: 'var(--r-xl)',
            padding: '2rem 2.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '1.5rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200, borderRadius: '50%',
              background: myBalance >= 0
                ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <p className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Your Balance</p>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '2.8rem', lineHeight: 1,
                color: myBalance >= 0 ? 'var(--emerald)' : 'var(--rose)',
              }}>
                {myBalance >= 0 ? '+' : '−'}₹{Math.abs(myBalance).toFixed(2)}
              </div>
              <p className="text-sm text-muted" style={{ marginTop: '0.4rem' }}>
                {myBalance > 0 ? 'You are owed money' : myBalance < 0 ? 'You owe money' : 'All settled up ✓'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Spent',  value: `₹${totalSpent.toFixed(2)}`,  color: 'var(--saffron)' },
                { label: 'Expenses',     value: expenses.length,               color: 'var(--sky)' },
                { label: 'Members',      value: users.length,                  color: 'var(--t2)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', minWidth: 90 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-dim" style={{ marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
          {['expenses', 'balances', 'members'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'expenses' && (
          <div className="card card-pad anim-fade-in card-column">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
              <h4>All Expenses</h4>
              <button className="btn btn-saffron btn-sm" onClick={() => setShowModal(true)}>
                <PlusIcon />
              </button>
            </div>
            <div className="card-scroll">
              {expenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧾</div>
                  <p className="text-muted text-sm">No expenses recorded yet.</p>
                </div>
              ) : (
                expenses.map((exp, i) => (
                  <div key={exp.expense_id} className="row-item anim-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="row-main">
                      <div style={{
                        width: 38, height: 38, borderRadius: 'var(--r-sm)', flexShrink: 0,
                        background: exp.paid_by === user?.user_id ? 'var(--saffron-bg)' : 'var(--emerald-bg)',
                        border: `1px solid ${exp.paid_by === user?.user_id ? 'var(--saffron-rim)' : 'var(--emerald-rim)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                      }}>🧾</div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--t1)', fontSize: '0.9rem' }}>{exp.description}</p>
                        <p className="text-xs text-dim">
                          Paid by <strong style={{ color: exp.paid_by === user?.user_id ? 'var(--saffron)' : 'var(--t2)' }}>
                            {exp.paid_by === user?.user_id ? 'you' : exp.paid_by_name}
                          </strong> · {exp.expense_date}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--saffron)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                      ₹{exp.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'balances' && (
          <div className="card card-pad anim-fade-in card-column">
            <h4 style={{ marginBottom: '1.25rem', flexShrink: 0 }}>Group Balances</h4>
            <div className="card-scroll">
              {balances.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚖️</div>
                  <p className="text-muted text-sm">Add expenses to see balances.</p>
                </div>
              ) : (
                [...balances].sort((a, b) => b.amount - a.amount).map((b, i) => (
                  <div key={b.user_id} className="row-item anim-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="row-main">
                      <div className="avatar">{initials(b.user_name)}</div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--t1)', fontSize: '0.9rem' }}>
                          {b.user_name}
                          {b.user_id === user?.user_id && (
                            <span className="text-dim text-xs" style={{ marginLeft: '0.4rem' }}>(you)</span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: b.amount >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                          {b.amount >= 0 ? 'is owed' : 'owes'}
                        </p>
                      </div>
                    </div>

                    <div className="row-side">
                      <p style={{
                        fontWeight: 800, fontSize: '1.1rem',
                        color: b.amount >= 0 ? 'var(--emerald)' : 'var(--rose)',
                      }}>
                        {b.amount >= 0 ? '+' : '−'}₹{Math.abs(b.amount).toFixed(2)}
                      </p>
                      <div style={{
                        marginTop: '0.3rem', height: 4, width: 80,
                        background: 'var(--ink-3)', borderRadius: 99, overflow: 'hidden',
                        marginLeft: 'auto',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: b.amount >= 0 ? 'var(--emerald)' : 'var(--rose)',
                          width: `${Math.min(100, (Math.abs(b.amount) / (totalSpent || 1)) * 100)}%`,
                        }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="card card-pad anim-fade-in card-column">
            <h4 style={{ marginBottom: '1.25rem', flexShrink: 0 }}>Members ({users.length})</h4>
            <div className="card-scroll">
              {users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p className="text-muted text-sm">No members yet.</p>
                </div>
              ) : (
                users.map((u, i) => (
                  <div key={u.user_id} className="row-item anim-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="row-main">
                      <div className="avatar" style={u.user_id === user?.user_id ? { background: 'var(--saffron-bg)', color: 'var(--saffron)', borderColor: 'var(--saffron-rim)' } : {}}>
                        {initials(u.user_name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--t1)', fontSize: '0.9rem' }}>
                          {u.user_name}
                          {u.user_id === user?.user_id && (
                            <span className="text-dim text-xs" style={{ marginLeft: '0.4rem' }}>(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-dim">{u.contact}</p>
                      </div>
                    </div>
                    {u.user_id === groupInfo?.admin_id
                      ? <span className="badge badge-admin">Admin</span>
                      : <span className="badge badge-member">Member</span>
                    }
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="field">
                <label>Description</label>
                <input
                  className="input"
                  placeholder="e.g. Groceries, Gas bill…"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required autoFocus
                />
              </div>

              <div className="form-grid-2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Amount (₹)</label>
                  <input
                    className="input"
                    type="number" step="0.01" min="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: '1.25rem' }}>
                <div className="field-heading-row">
                  <label style={{ margin: 0 }}>
                    Split with <span style={{ color: 'var(--saffron)' }}>({selected.length})</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-ghost btn-sm"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setSelected(users.map(u => u.user_id))}>
                      All
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setSelected([])}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="checkbox-grid">
                  {users.map(u => (
                    <Checkbox
                      key={u.user_id}
                      checked={selected.includes(u.user_id)}
                      label={u.user_id === user?.user_id ? `${u.user_name} (you)` : u.user_name}
                      onChange={() => toggleUser(u.user_id)}
                    />
                  ))}
                </div>
              </div>

              {selected.length > 0 && form.amount && (
                <div style={{
                  marginTop: '0.5rem',
                  background: 'var(--saffron-bg)', border: '1px solid var(--saffron-rim)',
                  borderRadius: 'var(--r-md)', padding: '0.65rem 1rem',
                  fontSize: '0.82rem', color: 'var(--saffron)',
                }}>
                  ₹{parseFloat(form.amount || 0).toFixed(2)} ÷ {selected.length} people
                  = <strong>₹{(parseFloat(form.amount || 0) / selected.length).toFixed(2)}</strong> each
                </div>
              )}

              <div className="button-row">
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-saffron" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}