import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApplications, createApplication, updateApplication, deleteApplication, toggleStar } from '../api/applicationApi';
import './Applications.css';

const STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

const STATUS_META = {
  Applied:     { color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', dot: '#2563eb' },
  Shortlisted: { color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed' },
  Interview:   { color: '#f59e0b', light: '#fffbeb', border: '#fde68a', dot: '#d97706' },
  Offer:       { color: '#10b981', light: '#ecfdf5', border: '#a7f3d0', dot: '#059669' },
  Rejected:    { color: '#ef4444', light: '#fef2f2', border: '#fecaca', dot: '#dc2626' },
};

const EMPTY_FORM = {
  company: '', role: '', status: 'Applied', location: '', package: '',
  jobType: 'Full-time', jobUrl: '', notes: '',
  appliedDate: new Date().toISOString().split('T')[0], priority: 'Medium',
};

export default function Applications() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('kanban');
  const [saving, setSaving] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await getApplications({ search, status: filterStatus });
      setApplications(res.data.applications || []);
      setStats(res.data.stats || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, [search, filterStatus]);

  const openCreate = () => { setEditApp(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (app, e) => {
    e?.stopPropagation();
    setEditApp(app);
    setForm({
      ...app,
      package: app.package || '',
      appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editApp) await updateApplication(editApp._id, form);
      else await createApplication(form);
      setShowModal(false);
      fetchApps();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Remove this placement drive?')) return;
    await deleteApplication(id);
    fetchApps();
  };

  const handleStar = async (id, e) => {
    e?.stopPropagation();
    await toggleStar(id);
    fetchApps();
  };

  const handleStatusChange = async (id, status, e) => {
    e?.stopPropagation();
    await updateApplication(id, { status });
    fetchApps();
  };

  const appsByStatus = (status) => applications.filter((a) => a.status === status);
  const totalDrives = applications.length;

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="applications-page fade-in">

      {/* ── Page Header ── */}
      <div className="app-page-header">
        <div className="app-page-header-left">
          <h1 className="page-title">Placement Drives</h1>
          <p className="app-page-subtitle">
            {totalDrives} drive{totalDrives !== 1 ? 's' : ''} listed
            {stats.offer > 0 && <span className="app-offer-pill">{stats.offer} offer{stats.offer > 1 ? 's' : ''} received</span>}
          </p>
        </div>
        <div className="app-page-header-right">
          <div className="view-toggle">
            <button id="view-kanban" className={`view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="0" width="4" height="8" rx="1" fill="currentColor"/><rect x="5" y="0" width="4" height="14" rx="1" fill="currentColor"/><rect x="10" y="0" width="4" height="11" rx="1" fill="currentColor"/></svg>
              Kanban
            </button>
            <button id="view-list" className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor"/><rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor"/><rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor"/></svg>
              List
            </button>
          </div>
          {isAdmin && (
            <button id="add-application-btn" className="btn btn-primary" onClick={openCreate}>
              + Add Drive
            </button>
          )}
        </div>
      </div>

      {/* ── Status Summary Bar ── */}
      <div className="app-summary-bar">
        {STATUSES.map((s) => {
          const m = STATUS_META[s];
          const count = stats[s.toLowerCase()] || 0;
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              className={`app-summary-chip ${isActive ? 'active' : ''}`}
              style={{
                '--chip-color': m.color,
                '--chip-light': m.light,
                '--chip-border': m.border,
              }}
              onClick={() => setFilterStatus(isActive ? '' : s)}
            >
              <span className="chip-dot" style={{ background: m.dot }} />
              <span className="chip-count">{count}</span>
              <span className="chip-label">{s}</span>
            </button>
          );
        })}
        <div className="app-search-box">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            id="app-search"
            className="app-search-input"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      {/* ── Kanban ── */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUSES.map((status) => {
            const cards = appsByStatus(status);
            const m = STATUS_META[status];
            return (
              <div key={status} className="kanban-col">
                {/* Column Header */}
                <div className="kanban-col-head">
                  <div className="kanban-col-label">
                    <span className="kanban-col-dot" style={{ background: m.color }} />
                    <span className="kanban-col-name" style={{ color: m.color }}>{status}</span>
                  </div>
                  <span className="kanban-col-count" style={{ background: m.light, color: m.color, border: `1px solid ${m.border}` }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="kanban-cards-list">
                  {cards.length === 0 ? (
                    <div className="kanban-empty-state">
                      <div className="kanban-empty-circle" style={{ background: m.light, border: `1.5px dashed ${m.border}` }}>
                        <span style={{ color: m.color, fontSize: '1.2rem', opacity: 0.5 }}>○</span>
                      </div>
                      <span className="kanban-empty-text">No drives here</span>
                      {isAdmin && (
                        <button className="kanban-empty-add" onClick={openCreate} style={{ color: m.color }}>
                          + Add drive
                        </button>
                      )}
                    </div>
                  ) : (
                    cards.map((app) => (
                      <DriveCard
                        key={app._id}
                        app={app}
                        meta={m}
                        isAdmin={isAdmin}
                        onStar={handleStar}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {view === 'list' && (
        <div className="app-list-wrap">
          {applications.length === 0 ? (
            <div className="list-empty">No placement drives found.</div>
          ) : (
            <div className="app-list-cards">
              {applications.map((app) => {
                const m = STATUS_META[app.status] || STATUS_META.Applied;
                return (
                  <div key={app._id} className="list-card" id={`app-row-${app._id}`}>
                    <div className="list-card-left">
                      <div className="list-company-logo" style={{ background: `linear-gradient(135deg, ${m.color}22, ${m.color}44)`, color: m.color }}>
                        {app.company[0]?.toUpperCase()}
                      </div>
                      <div className="list-card-info">
                        <div className="list-company-name">{app.company}</div>
                        <div className="list-role">{app.role}</div>
                        <div className="list-meta">
                          {app.location && <span className="ltag">{app.location}</span>}
                          {app.package > 0 && <span className="ltag ltag--green">{app.package} LPA</span>}
                          <span className="ltag">{app.jobType}</span>
                          {app.priority === 'High' && <span className="ltag ltag--red">High Priority</span>}
                        </div>
                      </div>
                    </div>
                    <div className="list-card-right">
                      <span className="list-status-badge" style={{ background: m.light, color: m.color, border: `1px solid ${m.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block', marginRight: 5 }} />
                        {app.status}
                      </span>
                      <div className="list-actions">
                        <select
                          className="list-status-select"
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value, e)}
                          style={{ borderColor: m.border, color: m.color }}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        {isAdmin && (
                          <>
                            <button className="icon-btn icon-btn--edit" onClick={(e) => openEdit(app, e)} title="Edit">✎</button>
                            <button className="icon-btn icon-btn--del" onClick={(e) => handleDelete(app._id, e)} title="Delete">✕</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" id="application-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editApp ? 'Edit Drive' : isAdmin ? 'Add Placement Drive' : 'Update Status'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input id="app-form-company" className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Google" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input id="app-form-role" className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select id="app-form-status" className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select id="app-form-jobtype" className="form-input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                    {['Full-time', 'Internship', 'Part-time', 'Contract'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input id="app-form-location" className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bangalore, India" />
                </div>
                <div className="form-group">
                  <label className="form-label">Package (LPA)</label>
                  <input id="app-form-package" className="form-input" type="number" value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="12" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Applied Date</label>
                  <input id="app-form-date" className="form-input" type="date" value={form.appliedDate} onChange={(e) => setForm({ ...form, appliedDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select id="app-form-priority" className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job URL</label>
                <input id="app-form-url" className="form-input" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea id="app-form-notes" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Eligibility, rounds info, contacts..." rows={3} />
              </div>
              <button type="submit" id="app-form-submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? 'Saving...' : editApp ? 'Update Drive' : 'Add Drive'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Drive Card Component ── */
function DriveCard({ app, meta: m, isAdmin, onStar, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`drive-card ${expanded ? 'drive-card--open' : ''}`} id={`app-card-${app._id}`}>
      {/* Accent strip */}
      <div className="drive-card-strip" style={{ background: m.color }} />

      <div className="drive-card-body">
        {/* Top row */}
        <div className="drive-card-top">
          <div className="drive-logo" style={{ background: `${m.color}18`, color: m.color }}>
            {app.company[0]?.toUpperCase()}
          </div>
          <div className="drive-title-block">
            <div className="drive-company">{app.company}</div>
            <div className="drive-role">{app.role}</div>
          </div>
          <button
            className={`drive-star ${app.starred ? 'starred' : ''}`}
            onClick={(e) => { e.stopPropagation(); onStar(app._id, e); }}
          >
            {app.starred ? '★' : '☆'}
          </button>
        </div>

        {/* Tags row */}
        <div className="drive-tags">
          {app.location && <span className="drive-tag">{app.location}</span>}
          {app.package > 0 && <span className="drive-tag drive-tag--green">₹{app.package} LPA</span>}
          <span className="drive-tag">{app.jobType}</span>
          {app.priority === 'High' && <span className="drive-tag drive-tag--red">High Priority</span>}
        </div>

        {/* Status selector */}
        <div className="drive-status-row">
          <select
            className="drive-status-select"
            value={app.status}
            onChange={(e) => { e.stopPropagation(); onStatusChange(app._id, e.target.value, e); }}
            style={{ color: m.color, borderColor: m.border, background: m.light }}
            onClick={(e) => e.stopPropagation()}
          >
            {['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Expand / Info */}
          <button
            className="drive-expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Less info' : 'More info'}
          >
            {expanded ? '▲' : '▼'}
          </button>

          {isAdmin && (
            <div className="drive-admin-actions">
              <button className="icon-btn icon-btn--edit" onClick={(e) => onEdit(app, e)} title="Edit">✎</button>
              <button className="icon-btn icon-btn--del" onClick={(e) => onDelete(app._id, e)} title="Delete">✕</button>
            </div>
          )}
        </div>

        {/* Expanded notes */}
        {expanded && app.notes && (
          <div className="drive-notes">
            <div className="drive-notes-label">Notes</div>
            <div className="drive-notes-text">{app.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
