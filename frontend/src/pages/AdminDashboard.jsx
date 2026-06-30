import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useToast } from '../useToast.jsx';
import { API_URL } from '../config';

function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function CopyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
}
function UndoIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>;
}
function TickIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>;
}

function initials(name) {
  return (name || '').slice(0, 2).toUpperCase() || '??';
}

function Checkbox({ checked, label, onChange }) {
  return (
    <label className={`check-label ${checked ? 'checked' : ''}`} onClick={onChange} style={{ cursor: 'pointer' }}>
      <input type="checkbox" readOnly checked={checked} style={{ display: 'none' }} />
      <span className="check-box">{checked && <TickIcon />}</span>
      <span>{label}</span>
    </label>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { show, Toast } = useToast();

  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [expForm, setExpForm] = useState({ description: '', amount: '', date: '' });
  const [splitWith, setSplitWith] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [undoActive, setUndoActive] = useState(false);
  const [undoTimer, setUndoTimer] = useState(30);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (selected) {
      fetchGroupData(selected.group_id);
      setSplitWith([]);
    }
  }, [selected]);

  // Undo timer countdown
  useEffect(() => {
    if (!undoActive) return;
    const interval = setInterval(() => {
      setUndoTimer(t => {
        if (t <= 1) {
          setUndoActive(false);
          show('Undo window expired. Data is now permanently deleted.', 'info');
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undoActive]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/groups?user_id=${user.user_id}`);
      const mine = res.data.filter(g => g.is_admin);
      setGroups(mine);
      if (mine.length && !selected) setSelected(mine[0]);
    } catch { show('Failed to load groups', 'error'); }
    finally { setLoading(false); }
  };

  const fetchGroupData = async (gid) => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        axios.get(`http://localhost:8000/groups/${gid}/requests?admin_id=${user.user_id}`),
        axios.get(`http://localhost:8000/users?group_id=${gid}`),
        axios.get(`http://localhost:8000/expenses?group_id=${gid}`),
        axios.get(`http://localhost:8000/balances?group_id=${gid}`),
      ]);
      setPending(r1.data);
      setMembers(r2.data);
      setExpenses(r3.data);
      setBalances(r4.data);
    } catch { show('Failed to load group data', 'error'); }
  };

  const handleAccept = async (uid) => {
    try {
      await axios.post(`http://localhost:8000/groups/${selected.group_id}/accept/${uid}?admin_id=${user.user_id}`);
      show('Member accepted', 'success');
      fetchGroupData(selected.group_id);
    } catch { show('Failed to accept member', 'error'); }
  };

  const handleReject = async (uid) => {
    try {
      await axios.post(`http://localhost:8000/groups/${selected.group_id}/reject/${uid}?admin_id=${user.user_id}`);
      show('Request declined', 'success');
      fetchGroupData(selected.group_id);
    } catch { show('Failed to decline request', 'error'); }
  };

  const handleCopy = () => {
    if (!selected) return;
    navigator.clipboard.writeText(`${window.location.origin}/signup?invite=${selected.invite_code}`);
    setCopied(true);
    show('Invite link copied!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8000/groups?user_id=${user.user_id}`, { group_name: newName });
      show(`"${newName}" created`, 'success');
      setNewName('');
      setShowGroupModal(false);
      fetchGroups();
    } catch { show('Failed to create group', 'error'); }
  };

  const toggleSplit = (uid) => setSplitWith(s => s.includes(uid) ? s.filter(i => i !== uid) : [...s, uid]);

  const openExpenseModal = () => {
    setSplitWith(members.map(m => m.user_id));
    setExpForm({ description: '', amount: '', date: '' });
    setShowExpenseModal(true);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (splitWith.length === 0) { show('Select at least one person to split with.', 'error'); return; }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/expenses`, {
        group_id: selected.group_id,
        paid_by: user.user_id,
        amount: parseFloat(expForm.amount),
        expense_date: expForm.date,
        description: expForm.description,
        users: splitWith,
      });
      show('Expense added!', 'success');
      setShowExpenseModal(false);
      setExpForm({ description: '', amount: '', date: '' });
      setSplitWith([]);
      fetchGroupData(selected.group_id);
    } catch (err) {
      show(err.response?.data?.detail || 'Failed to add expense.', 'error');
    } finally { setSaving(false); }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await axios.post(`http://localhost:8000/groups/${selected.group_id}/clear-expenses?admin_id=${user.user_id}`);
      setUndoActive(true);
      setUndoTimer(30);
      setShowClearModal(false);
      fetchGroupData(selected.group_id);
    } catch {
      show('Failed to clear data.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleUndo = async () => {
    try {
      await axios.post(`http://localhost:8000/groups/${selected.group_id}/undo-clear?admin_id=${user.user_id}`);
      show('✓ Data restored successfully!', 'success');
      setUndoActive(false);
      fetchGroupData(selected.group_id);
    } catch (err) {
      show(err.response?.data?.detail || 'Failed to undo.', 'error');
      setUndoActive(false);
    }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const inviteLink = selected ? `${window.location.origin}/signup?invite=${selected.invite_code}` : '';
  const perPerson = splitWith.length > 0 && expForm.amount ? (parseFloat(expForm.amount) / splitWith.length).toFixed(2) : null;

  return (
    <div className="page-wrap">
      <Toast />

      {/* Undo toast */}
      {undoActive && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--rose)', color: 'white', padding: '1rem 1.5rem',
          borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', gap: '1rem',
          zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Data cleared!</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Undo available for {undoTimer}s</p>
          </div>
          <button
            onClick={handleUndo}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              padding: '0.5rem 1rem', borderRadius: 'var(--r-md)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            <UndoIcon /> Undo
          </button>
        </div>
      )}

      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo-mark">
            <span className="logo-icon">🍳</span>
            KitchenMate
          </div>
          <span className="badge badge-admin">Admin</span>
        </div>
        <div className="navbar-right">
          <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>👋 {user?.user_name}</span>
          {selected && (
            <button className="btn btn-saffron btn-sm" onClick={openExpenseModal}>
              <PlusIcon /> Add Expense
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowGroupModal(true)}>
            <PlusIcon /> New Group
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/'); }}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {loading ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '4rem' }}>
            <p className="text-muted">Loading your groups…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="card card-pad anim-fade-up">
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <h3>No groups yet</h3>
              <p className="text-muted text-sm">Create your first kitchen group to get started.</p>
              <button className="btn btn-saffron" onClick={() => setShowGroupModal(true)}>
                <PlusIcon /> Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="sidebar-layout">

            <div>
              <p className="section-eyebrow" style={{ padding: '0 0.25rem' }}>Your Groups</p>
              <div className="sidebar">
                {groups.map(g => (
                  <div key={g.group_id} className={`sidebar-item ${selected?.group_id === g.group_id ? 'active' : ''}`} onClick={() => { setSelected(g); setTab('overview'); }}>
                    <span className="truncate">{g.group_name}</span>
                    {selected?.group_id === g.group_id && pending.length > 0 && (
                      <span className="notif-dot">{pending.length}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <div className="anim-fade-in">

                <div className="card card-pad mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 style={{ marginBottom: '0.2rem' }}>{selected.group_name}</h2>
                      <p className="text-sm text-muted">Managed by you · {members.length} members</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {pending.length > 0 && (
                        <div style={{
                          background: 'var(--rose-bg)', border: '1px solid var(--rose-rim)',
                          color: 'var(--rose)', borderRadius: 'var(--r-md)',
                          padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700,
                        }}>
                          {pending.length} pending
                        </div>
                      )}
                      <button className="btn btn-saffron btn-sm" onClick={openExpenseModal}>
                        <PlusIcon /> Add Expense
                      </button>
                      {expenses.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowClearModal(true)} style={{ color: 'var(--t2)' }}>
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="section-eyebrow">Invite Link</p>
                    <div className="copy-row">
                      <span>{inviteLink}</span>
                      <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                        <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid-3 mb-4">
                  {[
                    { label: 'Members', value: members.length, color: 'var(--sky)', icon: '👥' },
                    { label: 'Expenses', value: expenses.length, color: 'var(--emerald)', icon: '🧾' },
                    { label: 'Total Spent', value: `₹${totalSpent.toFixed(2)}`, color: 'var(--saffron)', icon: '💰' },
                  ].map(s => (
                    <div key={s.label} className="stat-card anim-fade-up">
                      <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                      <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="tab-bar mb-4">
                  {['overview', 'expenses', 'members'].map(t => (
                    <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <div className="grid-2 anim-fade-in">
                    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        Join Requests
                        {pending.length > 0 && <span className="notif-dot">{pending.length}</span>}
                      </h4>
                      <div className="card-scroll">
                        {pending.length === 0 ? (
                          <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p className="text-muted text-sm">No pending requests right now.</p>
                          </div>
                        ) : pending.map(req => (
                          <div key={req.user_id} className="request-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div className="avatar">{initials(req.user_name)}</div>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t1)' }}>{req.user_name}</p>
                                <p className="text-xs text-dim">Wants to join</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                              <button className="btn btn-success btn-sm" onClick={() => handleAccept(req.user_id)}>
                                <CheckIcon />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(req.user_id)}>
                                <XIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 className="mb-4" style={{ flexShrink: 0 }}>Balances</h4>
                      <div className="card-scroll">
                        {balances.length === 0 ? (
                          <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p className="text-muted text-sm">No expenses added yet.</p>
                          </div>
                        ) : balances.map(b => (
                          <div key={b.user_id} className="row-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div className="avatar">{initials(b.user_name)}</div>
                              <span style={{ fontWeight: 500 }}>{b.user_name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: b.amount >= 0 ? 'var(--emerald)' : 'var(--rose)', whiteSpace: 'nowrap' }}>
                              {b.amount >= 0 ? '+' : '−'}₹{Math.abs(b.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'expenses' && (
                  <div className="card card-pad anim-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
                      <h4>All Expenses</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-saffron btn-sm" onClick={openExpenseModal}>
                          <PlusIcon />
                        </button>
                        {expenses.length > 0 && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setShowClearModal(true)} style={{ color: 'var(--t2)' }}>
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="card-scroll">
                      {expenses.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">🧾</div>
                          <p className="text-muted text-sm">No expenses recorded yet.</p>
                        </div>
                      ) : expenses.map(exp => (
                        <div key={exp.expense_id} className="row-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'members' && (
                  <div className="card card-pad anim-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 className="mb-4" style={{ flexShrink: 0 }}>Members ({members.length})</h4>
                    <div className="card-scroll">
                      {members.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">👥</div>
                          <p className="text-muted text-sm">No members yet. Share the invite link.</p>
                        </div>
                      ) : members.map(m => (
                        <div key={m.user_id} className="row-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="avatar">{initials(m.user_name)}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t1)' }}>
                                {m.user_name}
                                {m.user_id === user?.user_id && (
                                  <span className="text-dim text-xs" style={{ marginLeft: '0.4rem' }}>(you)</span>
                                )}
                              </p>
                              <p className="text-xs text-dim">{m.contact}</p>
                            </div>
                          </div>
                          {m.user_id === selected.admin_id
                            ? <span className="badge badge-admin">Admin</span>
                            : <span className="badge badge-member">Member</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showExpenseModal && (
        <div className="modal-backdrop" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ marginBottom: '0.15rem' }}>Add Expense</h3>
                <p className="text-xs text-dim">{selected?.group_name}</p>
              </div>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="field">
                <label>Description</label>
                <input
                  className="input"
                  placeholder="e.g. Groceries, Gas bill, Pizza night…"
                  value={expForm.description}
                  onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                  required autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Amount (₹)</label>
                  <input
                    className="input"
                    type="number" step="0.01" min="0.01"
                    placeholder="0.00"
                    value={expForm.amount}
                    onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Date</label>
                  <input
                    className="input"
                    type="date"
                    value={expForm.date}
                    onChange={e => setExpForm({ ...expForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <label style={{ margin: 0 }}>
                    Split with <span style={{ color: 'var(--saffron)' }}>({splitWith.length})</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSplitWith(members.map(m => m.user_id))}>All</button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSplitWith([])}>Clear</button>
                  </div>
                </div>

                {members.length === 0 ? (
                  <p className="text-sm text-muted">No members in this group yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {members.map(m => (
                      <Checkbox key={m.user_id} checked={splitWith.includes(m.user_id)} label={m.user_id === user?.user_id ? `${m.user_name} (you)` : m.user_name} onChange={() => toggleSplit(m.user_id)} />
                    ))}
                  </div>
                )}
              </div>

              {perPerson && (
                <div style={{
                  marginTop: '0.5rem',
                  background: 'var(--saffron-bg)', border: '1px solid var(--saffron-rim)',
                  borderRadius: 'var(--r-md)', padding: '0.65rem 1rem',
                  fontSize: '0.82rem', color: 'var(--saffron)',
                }}>
                  ₹{parseFloat(expForm.amount).toFixed(2)} ÷ {splitWith.length} people = <strong>₹{perPerson}</strong> each
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-saffron" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal-backdrop" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Group</h3>
              <button className="modal-close" onClick={() => setShowGroupModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="field">
                <label>Group Name</label>
                <input className="input" placeholder="e.g. Weekend Cooking Club" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-saffron" style={{ flex: 1 }}>Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="modal-backdrop" onClick={() => setShowClearModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clear Monthly Data?</h3>
              <button className="modal-close" onClick={() => setShowClearModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                This will delete all expenses and reset everyone's balance to ₹0 for {selected?.group_name}.
              </p>
              <div style={{
                background: 'var(--sky-bg)', border: '1px solid var(--sky-rim)',
                borderRadius: 'var(--r-md)', padding: '0.75rem 1rem',
                color: 'var(--sky)', fontSize: '0.85rem',
              }}>
                ℹ️ You'll have <strong>30 seconds</strong> to undo this action if you change your mind.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowClearModal(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleClearData} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}