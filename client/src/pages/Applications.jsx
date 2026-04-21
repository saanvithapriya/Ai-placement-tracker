import { useState, useEffect } from 'react';
import { getApplications, createApplication, updateApplication, deleteApplication, toggleStar } from '../api/applicationApi';
import './Applications.css';

const STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
const STATUS_ICONS = { Applied: '📤', Shortlisted: '⭐', Interview: '🎤', Offer: '🏆', Rejected: '❌' };

const EMPTY_FORM = {
  company: '', role: '', status: 'Applied', location: '', package: '',
  jobType: 'Full-time', jobUrl: '', jobDescription: '', notes: '',
  appliedDate: new Date().toISOString().split('T')[0], priority: 'Medium',
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [saving, setSaving] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await getApplications({ search, status: filterStatus });
      setApplications(res.data.applications);
      setStats(res.data.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, [search, filterStatus]);

  const openCreate = () => { setEditApp(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (app) => {
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
      if (editApp) {
        await updateApplication(editApp._id, form);
      } else {
        await createApplication(form);
      }
      setShowModal(false);
      fetchApps();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    await deleteApplication(id);
    fetchApps();
  };

  const handleStar = async (id) => {
    await toggleStar(id);
    fetchApps();
  };

  const handleStatusChange = async (id, status) => {
    await updateApplication(id, { status });
    fetchApps();
  };

  const appsByStatus = (status) => applications.filter((a) => a.status === status);

  if (loading) return (
    <div className="loading-screen"><div className="loading-spinner" /></div>
  );

  return (
    <div className="applications-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {stats.total || 0} total · {stats.offer || 0} offers received
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="view-toggle">
            <button id="view-kanban" className={`view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>⊞ Kanban</button>
            <button id="view-list" className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰ List</button>
          </div>
          <button id="add-application-btn" className="btn btn-primary" onClick={openCreate}>+ Add Application</button>
        </div>
      </div>

      {/* Filters */}
      <div className="app-filters">
        <input
          id="app-search"
          className="form-input"
          placeholder="🔍 Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select id="app-filter-status" className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUSES.map((status) => (
            <div key={status} className={`kanban-column kanban-col--${status.toLowerCase()}`}>
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span>{STATUS_ICONS[status]}</span>
                  <span>{status}</span>
                </div>
                <span className="kanban-count">{appsByStatus(status).length}</span>
              </div>
              <div className="kanban-cards">
                {appsByStatus(status).length === 0 && (
                  <div className="kanban-empty">No applications here</div>
                )}
                {appsByStatus(status).map((app) => (
                  <div key={app._id} className="kanban-card" id={`app-card-${app._id}`}>
                    <div className="kcard-top">
                      <div className="kcard-company-logo">{app.company[0]}</div>
                      <button
                        className={`kcard-star ${app.starred ? 'starred' : ''}`}
                        onClick={() => handleStar(app._id)}
                        title="Star"
                      >★</button>
                    </div>
                    <div className="kcard-company">{app.company}</div>
                    <div className="kcard-role">{app.role}</div>
                    <div className="kcard-meta">
                      {app.location && <span className="kcard-tag">📍 {app.location}</span>}
                      {app.package > 0 && <span className="kcard-tag">💰 {app.package} LPA</span>}
                      <span className="kcard-tag">{app.jobType}</span>
                    </div>
                    <div className="kcard-actions">
                      <select
                        className="kcard-status-select"
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(app)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app._id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="app-list-table">
          <table>
            <thead>
              <tr>
                <th>Company</th><th>Role</th><th>Status</th><th>Type</th>
                <th>Package</th><th>Applied</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No applications found</td></tr>
              ) : applications.map((app) => (
                <tr key={app._id} id={`app-row-${app._id}`}>
                  <td>
                    <div className="table-company">
                      <div className="table-company-logo">{app.company[0]}</div>
                      <div>
                        <div className="table-company-name">{app.company}</div>
                        {app.location && <div className="table-company-loc">{app.location}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{app.role}</td>
                  <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                  <td>{app.jobType}</td>
                  <td>{app.package > 0 ? `${app.package} LPA` : '—'}</td>
                  <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(app)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app._id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" id="application-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editApp ? '✏️ Edit Application' : '➕ New Application'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input id="app-form-company" className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Google" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input id="app-form-role" className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. SWE Intern" required />
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
                    {['Full-time','Internship','Part-time','Contract'].map((t) => <option key={t}>{t}</option>)}
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
              <div className="form-group">
                <label className="form-label">Job URL</label>
                <input id="app-form-url" className="form-input" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea id="app-form-notes" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this application..." rows={3} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Applied Date</label>
                  <input id="app-form-date" className="form-input" type="date" value={form.appliedDate} onChange={(e) => setForm({ ...form, appliedDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select id="app-form-priority" className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['Low','Medium','High'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" id="app-form-submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? '⏳ Saving...' : editApp ? '✅ Update Application' : '➕ Add Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
