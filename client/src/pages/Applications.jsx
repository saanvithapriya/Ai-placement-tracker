import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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

// Student-facing contextual messages per stage
const STATUS_MESSAGE = {
  Applied:     { icon: '📋', text: 'Your application is under review' },
  Shortlisted: { icon: '🎉', text: 'You have been shortlisted!' },
  Interview:   { icon: '📅', text: 'Interview scheduled — check your email' },
  Offer:       { icon: '🏆', text: 'Congratulations! You received an offer' },
  Rejected:    { icon: '😔', text: 'You were not selected this time' },
};

const EMPTY_FORM = {
  company: '', role: '', location: '', package: '',
  jobType: 'Full-time', jobUrl: '', notes: '',
  appliedDate: new Date().toISOString().split('T')[0], priority: 'Medium',
};

export default function Applications() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { onStatusUpdated } = useNotifications();

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
  const [applyingId, setApplyingId] = useState(null); // drive being applied to

  const fetchApps = async () => {
    try {
      const res = await getApplications({ search });
      setApplications(res.data.applications || []);
      setStats(res.data.stats || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Real-time: patch application status when socket emits status:updated ───
  useEffect(() => {
    if (isAdmin) return; // admin doesn't need live status patches here
    const unsubscribe = onStatusUpdated((payload) => {
      setApplications((prev) =>
        prev.map((app) =>
          app._id === payload.driveId
            ? {
                ...app,
                status:         payload.status,
                shortlisted_at: payload.shortlisted_at,
                interview_at:   payload.interview_at,
                offer_at:       payload.offer_at,
                rejected_at:    payload.rejected_at,
              }
            : app
        )
      );
      // Recompute stats
      setStats((prev) => {
        const updated = { ...prev };
        // Decrement old status, increment new (best-effort; full stats sync on next fetchApps)
        return updated;
      });
    });
    return unsubscribe; // clean up listener on unmount
  }, [isAdmin, onStatusUpdated]);

  useEffect(() => { fetchApps(); }, [search]);

  // ── Student Apply ──────────────────────────────────────────────────────────
  const handleApply = async (driveId) => {
    setApplyingId(driveId);
    try {
      await createApplication({ driveId });
      await fetchApps();
    } catch (err) {
      if (err?.response?.status === 409) {
        // already applied — just refresh
        await fetchApps();
      } else {
        console.error(err);
      }
    } finally { setApplyingId(null); }
  };

  // ── Admin drive management ─────────────────────────────────────────────────
  const openCreate = () => { setEditApp(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (app, e) => {
    e?.stopPropagation();
    setEditApp(app);
    setForm({
      ...app,
      package:     app.package     || '',
      appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editApp) await updateApplication(editApp._id, form);
      else         await createApplication(form); // admin creates a Drive
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

  // Admin-only status quick-change from drive card (drive-level, not student-level)
  const handleAdminStatusChange = async (id, status, e) => {
    e?.stopPropagation();
    if (!isAdmin) return;
    await updateApplication(id, { status });
    fetchApps();
  };

  // Derive displayed list with client-side status filter
  const displayed = filterStatus
    ? applications.filter((a) => a.status === filterStatus)
    : applications;

  const appsByStatus = (status) => displayed.filter((a) => a.status === status);
  const totalDrives  = displayed.length;

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
          const m       = STATUS_META[s];
          const count   = stats[s.toLowerCase()] || 0;
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              className={`app-summary-chip ${isActive ? 'active' : ''}`}
              style={{ '--chip-color': m.color, '--chip-light': m.light, '--chip-border': m.border }}
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
          {/* For students: show "Not Applied" column first */}
          {!isAdmin && (() => {
            const notApplied = applications.filter((a) => !a.applied);
            if (filterStatus) return null; // hide when filtering by status
            return notApplied.length > 0 ? (
              <div className="kanban-col kanban-col--not-applied">
                <div className="kanban-col-head">
                  <div className="kanban-col-label">
                    <span className="kanban-col-dot" style={{ background: '#94a3b8' }} />
                    <span className="kanban-col-name" style={{ color: '#94a3b8' }}>Not Applied</span>
                  </div>
                  <span className="kanban-col-count" style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                    {notApplied.length}
                  </span>
                </div>
                <div className="kanban-cards-list">
                  {notApplied.map((app) => (
                    <DriveCard
                      key={app._id}
                      app={app}
                      meta={STATUS_META.Applied}
                      isAdmin={isAdmin}
                      onStar={handleStar}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onApply={handleApply}
                      applyingId={applyingId}
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {STATUSES.map((status) => {
            // For students: only show drives they've applied to in these columns
            const cards = isAdmin
              ? appsByStatus(status)
              : displayed.filter((a) => a.applied && a.status === status);
            const m = STATUS_META[status];
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-head">
                  <div className="kanban-col-label">
                    <span className="kanban-col-dot" style={{ background: m.color }} />
                    <span className="kanban-col-name" style={{ color: m.color }}>{status}</span>
                  </div>
                  <span className="kanban-col-count" style={{ background: m.light, color: m.color, border: `1px solid ${m.border}` }}>
                    {cards.length}
                  </span>
                </div>
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
                        onStatusChange={handleAdminStatusChange}
                        onApply={handleApply}
                        applyingId={applyingId}
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
          {displayed.length === 0 ? (
            <div className="list-empty">No placement drives found.</div>
          ) : (
            <div className="app-list-cards">
              {displayed.map((app) => {
                const m = app.status ? (STATUS_META[app.status] || STATUS_META.Applied) : STATUS_META.Applied;
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
                          {app.package  > 0 && <span className="ltag ltag--green">{app.package} LPA</span>}
                          <span className="ltag">{app.jobType}</span>
                          {app.priority === 'High' && <span className="ltag ltag--red">High Priority</span>}
                        </div>
                      </div>
                    </div>
                    <div className="list-card-right">
                      {/* Student: show status badge + contextual message, or Apply button */}
                      {!isAdmin && (
                        app.applied ? (
                          <div className="student-status-info">
                            <span className="list-status-badge" style={{ background: m.light, color: m.color, border: `1px solid ${m.border}` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block', marginRight: 5 }} />
                              {app.status}
                            </span>
                            {STATUS_MESSAGE[app.status] && (
                              <span className="student-status-msg">
                                {STATUS_MESSAGE[app.status].icon} {STATUS_MESSAGE[app.status].text}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            id={`apply-btn-${app._id}`}
                            className="btn btn-primary btn-sm"
                            disabled={applyingId === app._id}
                            onClick={() => handleApply(app._id)}
                          >
                            {applyingId === app._id ? 'Applying…' : 'Apply'}
                          </button>
                        )
                      )}

                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="list-actions">
                          <span className="list-status-badge" style={{ background: m.light, color: m.color, border: `1px solid ${m.border}` }}>
                            {app.status}
                          </span>
                          <button className="icon-btn icon-btn--edit" onClick={(e) => openEdit(app, e)} title="Edit">✎</button>
                          <button className="icon-btn icon-btn--del"  onClick={(e) => handleDelete(app._id, e)} title="Delete">✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Admin Drive Modal ── */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" id="application-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editApp ? 'Edit Drive' : 'Add Placement Drive'}</h2>
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
                  <label className="form-label">Job Type</label>
                  <select id="app-form-jobtype" className="form-input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                    {['Full-time', 'Internship', 'Part-time', 'Contract'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input id="app-form-location" className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bangalore, India" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Package (LPA)</label>
                  <input id="app-form-package" className="form-input" type="number" value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="12" />
                </div>
                <div className="form-group">
                  <label className="form-label">Drive Date</label>
                  <input id="app-form-date" className="form-input" type="date" value={form.appliedDate} onChange={(e) => setForm({ ...form, appliedDate: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select id="app-form-priority" className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job URL</label>
                  <input id="app-form-url" className="form-input" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Eligibility</label>
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
function DriveCard({ app, meta: m, isAdmin, onStar, onEdit, onDelete, onStatusChange, onApply, applyingId }) {
  const [expanded, setExpanded] = useState(false);
  const statusMsg = STATUS_MESSAGE[app.status];

  return (
    <div className={`drive-card ${expanded ? 'drive-card--open' : ''}`} id={`app-card-${app._id}`}>
      <div className="drive-card-strip" style={{ background: app.applied || isAdmin ? m.color : '#94a3b8' }} />

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
          {app.location  && <span className="drive-tag">{app.location}</span>}
          {app.package > 0 && <span className="drive-tag drive-tag--green">₹{app.package} LPA</span>}
          <span className="drive-tag">{app.jobType}</span>
          {app.priority === 'High' && <span className="drive-tag drive-tag--red">High Priority</span>}
        </div>

        {/* ── Student: Apply button OR status badge + contextual message ── */}
        {!isAdmin && (
          <div className="drive-student-action">
            {app.applied ? (
              <>
                <span
                  className="drive-status-badge-readonly"
                  style={{ color: m.color, background: m.light, border: `1px solid ${m.border}` }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, display: 'inline-block', marginRight: 6 }} />
                  {app.status}
                </span>
                {statusMsg && (
                  <span className="drive-status-msg">
                    {statusMsg.icon} {statusMsg.text}
                  </span>
                )}
              </>
            ) : (
              <button
                id={`apply-btn-card-${app._id}`}
                className="btn btn-primary btn-sm drive-apply-btn"
                disabled={applyingId === app._id}
                onClick={(e) => { e.stopPropagation(); onApply(app._id); }}
              >
                {applyingId === app._id ? '⏳ Applying…' : '✓ Apply'}
              </button>
            )}
          </div>
        )}

        {/* ── Admin: status row + expand + edit/delete ── */}
        {isAdmin && (
          <div className="drive-status-row">
            <select
              className="drive-status-select"
              value={app.status}
              onChange={(e) => { e.stopPropagation(); onStatusChange(app._id, e.target.value, e); }}
              style={{ color: m.color, borderColor: m.border, background: m.light }}
              onClick={(e) => e.stopPropagation()}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              className="drive-expand-btn"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Less info' : 'More info'}
            >
              {expanded ? '▲' : '▼'}
            </button>

            <div className="drive-admin-actions">
              <button className="icon-btn icon-btn--edit" onClick={(e) => onEdit(app, e)} title="Edit">✎</button>
              <button className="icon-btn icon-btn--del"  onClick={(e) => onDelete(app._id, e)} title="Delete">✕</button>
            </div>
          </div>
        )}

        {/* Student expand toggle */}
        {!isAdmin && app.applied && (
          <div className="drive-status-row">
            <button className="drive-expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        )}

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
