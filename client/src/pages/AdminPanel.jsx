import { useState, useEffect } from 'react';
import { getAdminStats, getStudents, getCompanies, createCompany, updateCompany, deleteCompany } from '../api/adminApi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatsCard from '../components/StatsCard';
import './AdminPanel.css';

const STATUS_COLORS = { Applied: '#3b82f6', Shortlisted: '#8b5cf6', Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444' };

const COMPANY_EMPTY = {
  name: '', industry: '', location: '', website: '', description: '',
  status: 'Upcoming', jobRoles: [], recruitmentDriveDate: '',
  eligibilityCriteria: { minCgpa: '', branches: '', backlogs: 0 },
  packageRange: { min: '', max: '' },
};

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(COMPANY_EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, stRes, cRes] = await Promise.all([
          getAdminStats(),
          getStudents(),
          getCompanies(),
        ]);
        setStats(sRes.data.stats);
        setStudents(stRes.data.students);
        setCompanies(cRes.data.companies);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const pieData = stats?.statusBreakdown?.map((s) => ({
    name: s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6366f1',
  })) || [];

  const branchData = stats?.branchStats?.slice(0, 8).map((b) => ({
    branch: b._id || 'Unknown',
    students: b.count,
  })) || [];

  const openCreateCompany = () => { setEditCompany(null); setCompanyForm(COMPANY_EMPTY); setShowCompanyModal(true); };
  const openEditCompany = (c) => {
    setEditCompany(c);
    setCompanyForm({
      ...c,
      jobRoles: c.jobRoles || [],
      eligibilityCriteria: {
        ...c.eligibilityCriteria,
        branches: (c.eligibilityCriteria?.branches || []).join(', '),
      },
      recruitmentDriveDate: c.recruitmentDriveDate ? c.recruitmentDriveDate.split('T')[0] : '',
    });
    setShowCompanyModal(true);
  };

  const handleCompanySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...companyForm,
      eligibilityCriteria: {
        ...companyForm.eligibilityCriteria,
        branches: typeof companyForm.eligibilityCriteria.branches === 'string'
          ? companyForm.eligibilityCriteria.branches.split(',').map((b) => b.trim()).filter(Boolean)
          : companyForm.eligibilityCriteria.branches,
      },
    };
    try {
      if (editCompany) {
        await updateCompany(editCompany._id, payload);
      } else {
        await createCompany(payload);
      }
      setShowCompanyModal(false);
      const res = await getCompanies();
      setCompanies(res.data.companies);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    await deleteCompany(id);
    setCompanies(companies.filter((c) => c._id !== id));
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="admin-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡 Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Placement officer dashboard — manage students, companies, and drives</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'students', label: '👥 Students' },
          { id: 'companies', label: '🏢 Companies' },
        ].map((t) => (
          <button key={t.id} id={`admin-tab-${t.id}`} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="fade-up">
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <StatsCard icon="🎓" label="Total Students" value={stats?.totalStudents ?? 0} color="primary" />
            <StatsCard icon="📋" label="Total Applications" value={stats?.totalApplications ?? 0} color="secondary" />
            <StatsCard icon="🏆" label="Offers Given" value={stats?.totalOffers ?? 0} color="success" />
            <StatsCard icon="📈" label="Placement Rate" value={`${stats?.placementRate ?? 0}%`} color="warning" />
          </div>

          <div className="grid-2">
            <div className="card">
              <h2 className="card-title">Application Status Breakdown</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141628', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#f1f5f9' }} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No application data</h3></div>}
            </div>

            <div className="card">
              <h2 className="card-title">Students by Branch</h2>
              {branchData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={branchData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="branch" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ background: '#141628', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#f1f5f9' }} />
                    <Bar dataKey="students" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><div className="empty-state-icon">🏫</div><h3>No branch data</h3></div>}
            </div>
          </div>

          {stats?.topCompanies?.length > 0 && (
            <div className="card" style={{ marginTop: 24 }}>
              <h2 className="card-title">🏆 Top Companies by Offers</h2>
              <div className="top-companies">
                {stats.topCompanies.map((c, i) => (
                  <div key={c._id} className="top-company-row">
                    <span className="tc-rank">#{i + 1}</span>
                    <div className="tc-logo">{c._id?.[0]}</div>
                    <span className="tc-name">{c._id}</span>
                    <span className="tc-offers">{c.offers} offers</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students */}
      {tab === 'students' && (
        <div className="fade-up">
          <div style={{ marginBottom: 16 }}>
            <input
              id="admin-student-search"
              className="form-input"
              placeholder="🔍 Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th><th>Branch</th><th>Year</th><th>Skills</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found</td></tr>
                ) : filteredStudents.map((s) => (
                  <tr key={s._id} id={`student-row-${s._id}`}>
                    <td>
                      <div className="admin-student-cell">
                        <div className="admin-student-avatar">{s.name[0]}</div>
                        <div>
                          <div className="admin-student-name">{s.name}</div>
                          <div className="admin-student-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.branch || '—'}</td>
                    <td>{s.year ? `Year ${s.year}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {s.skills?.slice(0, 3).map((sk) => <span key={sk} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{sk}</span>)}
                        {s.skills?.length > 3 && <span className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>+{s.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies */}
      {tab === 'companies' && (
        <div className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button id="add-company-btn" className="btn btn-primary" onClick={openCreateCompany}>+ Add Company Drive</button>
          </div>
          <div className="companies-grid">
            {companies.length === 0 && (
              <div className="empty-state card">
                <div className="empty-state-icon">🏢</div>
                <h3>No companies added</h3>
                <p>Add your first company drive above</p>
              </div>
            )}
            {companies.map((c) => (
              <div key={c._id} className="company-card card" id={`company-card-${c._id}`}>
                <div className="company-card-header">
                  <div className="company-card-logo">{c.name[0]}</div>
                  <span className={`badge badge-${c.status === 'Active' ? 'offer' : c.status === 'Closed' ? 'rejected' : 'applied'}`}>{c.status}</span>
                </div>
                <div className="company-card-name">{c.name}</div>
                <div className="company-card-industry">{c.industry || 'Industry N/A'}</div>
                {c.packageRange?.max > 0 && (
                  <div className="company-card-package">💰 {c.packageRange.min}–{c.packageRange.max} LPA</div>
                )}
                {c.recruitmentDriveDate && (
                  <div className="company-card-date">📅 {new Date(c.recruitmentDriveDate).toLocaleDateString()}</div>
                )}
                <div className="company-card-roles">
                  {c.jobRoles?.slice(0, 3).map((r) => <span key={r} className="tag" style={{ fontSize: '0.72rem' }}>{r}</span>)}
                </div>
                <div className="company-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditCompany(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCompany(c._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCompanyModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} id="company-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editCompany ? '✏️ Edit Company' : '➕ Add Company Drive'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCompanyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCompanySave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input id="company-form-name" className="form-input" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input id="company-form-industry" className="form-input" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} placeholder="Technology" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input id="company-form-location" className="form-input" value={companyForm.location} onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })} placeholder="Bangalore" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select id="company-form-status" className="form-input" value={companyForm.status} onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}>
                    {['Upcoming','Active','Closed'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Min Package (LPA)</label>
                  <input id="company-form-pkg-min" className="form-input" type="number" value={companyForm.packageRange.min} onChange={(e) => setCompanyForm({ ...companyForm, packageRange: { ...companyForm.packageRange, min: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Package (LPA)</label>
                  <input id="company-form-pkg-max" className="form-input" type="number" value={companyForm.packageRange.max} onChange={(e) => setCompanyForm({ ...companyForm, packageRange: { ...companyForm.packageRange, max: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min CGPA</label>
                  <input id="company-form-cgpa" className="form-input" type="number" step="0.1" value={companyForm.eligibilityCriteria.minCgpa} onChange={(e) => setCompanyForm({ ...companyForm, eligibilityCriteria: { ...companyForm.eligibilityCriteria, minCgpa: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Drive Date</label>
                  <input id="company-form-date" className="form-input" type="date" value={companyForm.recruitmentDriveDate} onChange={(e) => setCompanyForm({ ...companyForm, recruitmentDriveDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Eligible Branches (comma separated)</label>
                <input id="company-form-branches" className="form-input" value={companyForm.eligibilityCriteria.branches} onChange={(e) => setCompanyForm({ ...companyForm, eligibilityCriteria: { ...companyForm.eligibilityCriteria, branches: e.target.value } })} placeholder="CS, IT, ECE" />
              </div>
              <div className="form-group">
                <label className="form-label">Job Roles (comma separated)</label>
                <input id="company-form-roles" className="form-input" value={Array.isArray(companyForm.jobRoles) ? companyForm.jobRoles.join(', ') : companyForm.jobRoles} onChange={(e) => setCompanyForm({ ...companyForm, jobRoles: e.target.value.split(',').map((r) => r.trim()).filter(Boolean) })} placeholder="SWE, SDE, Analyst" />
              </div>
              <button type="submit" id="company-form-submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? '⏳ Saving...' : editCompany ? '✅ Update Company' : '➕ Add Company'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
