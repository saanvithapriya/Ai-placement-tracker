import { useState, useEffect } from 'react';
import {
  getAdminStats, getStudents, getCompanies, createCompany, updateCompany, deleteCompany,
  getDrives, getDriveApplicants, updateApplicantStatus,
} from '../api/adminApi';
import { showToast } from '../components/Toast';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import './AdminPanel.css';

const STATUS_COLORS = {
  Applied: '#3b82f6', Shortlisted: '#8b5cf6',
  Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444',
};

const STATUS_BADGE = {
  Applied: 'applied', Shortlisted: 'shortlisted',
  Interview: 'interview', Offer: 'offer', Rejected: 'rejected',
};

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
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(COMPANY_EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Drive applicants modal
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState('All');
  const [pendingUserId, setPendingUserId] = useState(null); // which row is mid-transition

  // Confirmation modal for critical actions (Offer / Reject)
  const [confirmPending, setConfirmPending] = useState(null); // { userId, newStatus, studentName }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, stRes, cRes, dRes] = await Promise.all([
          getAdminStats(),
          getStudents(),
          getCompanies(),
          getDrives(),
        ]);
        setStats(sRes.data.stats);
        setStudents(stRes.data.students);
        setCompanies(cRes.data.companies);
        setDrives(dRes.data.drives);
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

  const openDriveApplicants = async (drive) => {
    setSelectedDrive(drive);
    setApplicants([]);
    setApplicantSearch('');
    setApplicantStatusFilter('All');
    setLoadingApplicants(true);
    setShowApplicantsModal(true);
    try {
      const res = await getDriveApplicants(drive._id);
      setApplicants(res.data.applicants);
    } catch (err) { console.error(err); }
    finally { setLoadingApplicants(false); }
  };

  // Entry point: Offer/Reject → show confirm modal; others → execute directly
  const requestAdvanceStatus = (userId, newStatus, studentName) => {
    if (['Offer', 'Rejected'].includes(newStatus)) {
      setConfirmPending({ userId, newStatus, studentName });
    } else {
      handleAdvanceStatus(userId, newStatus);
    }
  };

  // Advance a student's status via the state machine (admin action)
  const handleAdvanceStatus = async (userId, newStatus) => {
    if (!selectedDrive || pendingUserId) return;
    setConfirmPending(null);
    setPendingUserId(userId);
    try {
      await updateApplicantStatus(selectedDrive._id, userId, newStatus);
      const res = await getDriveApplicants(selectedDrive._id);
      setApplicants(res.data.applicants);
      const dRes = await getDrives();
      setDrives(dRes.data.drives);
      showToast(`Student moved to ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Action failed. Please try again.';
      showToast(msg, 'error');
      const res = await getDriveApplicants(selectedDrive._id);
      setApplicants(res.data.applicants);
    } finally {
      setPendingUserId(null);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApplicants = applicants.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      (a.rollNumber || '').toLowerCase().includes(applicantSearch.toLowerCase());
    const matchStatus = applicantStatusFilter === 'All' || a.status === applicantStatusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="admin-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Placement officer dashboard — manage students, companies, and drives
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Students' },
          { id: 'companies', label: 'Companies' },
          { id: 'drives', label: `Drives & Applicants ${drives.length > 0 ? `(${drives.length})` : ''}` },
        ].map((t) => (
          <button
            key={t.id}
            id={`admin-tab-${t.id}`}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="fade-up">
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <StatsCard icon="S" label="Total Students" value={stats?.totalStudents ?? 0} color="primary" />
            <StatsCard icon="A" label="Total Applications" value={stats?.totalApplications ?? 0} color="secondary" />
            <StatsCard icon="O" label="Offers Given" value={stats?.totalOffers ?? 0} color="success" />
            <StatsCard icon="R" label="Placement Rate" value={`${stats?.placementRate ?? 0}%`} color="warning" />
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
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#0f172a' }} />
                    <Legend formatter={(v) => <span style={{ color: '#475569', fontSize: '0.82rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><h3>No application data</h3></div>}
            </div>

            <div className="card">
              <h2 className="card-title">Students by Branch</h2>
              {branchData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={branchData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="branch" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#0f172a' }} />
                    <Bar dataKey="students" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><h3>No branch data</h3></div>}
            </div>
          </div>

          {stats?.topCompanies?.length > 0 && (
            <div className="card" style={{ marginTop: 24 }}>
              <h2 className="card-title">Top Companies by Offers</h2>
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
              placeholder="Search students..."
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
                  <div className="company-card-package">{c.packageRange.min} - {c.packageRange.max} LPA</div>
                )}
                {c.recruitmentDriveDate && (
                  <div className="company-card-date">{new Date(c.recruitmentDriveDate).toLocaleDateString()}</div>
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

      {/* Drives & Applicants */}
      {tab === 'drives' && (
        <div className="fade-up">
          {drives.length === 0 ? (
            <div className="empty-state card">
              <h3>No placement drives found</h3>
              <p>Create a drive from the Applications page or the Companies tab</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Company / Role</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Drive Date</th>
                    <th>Package</th>
                    <th>Applicants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map((d) => (
                    <tr key={d._id} id={`drive-row-${d._id}`}>
                      <td>
                        <div className="admin-student-cell">
                          <div className="admin-student-avatar" style={{ borderRadius: 8 }}>{d.company?.[0] || '?'}</div>
                          <div>
                            <div className="admin-student-name">{d.company}</div>
                            <div className="admin-student-email">{d.role}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{ fontSize: '0.72rem' }}>{d.jobType || 'Full-time'}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${STATUS_BADGE[d.status] || 'applied'}`}>{d.status}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {d.driveDate ? new Date(d.driveDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                        {d.package > 0 ? `${d.package} LPA` : '—'}
                      </td>
                      <td>
                        <span className="drive-applicant-count">{d.applicantCount}</span>
                      </td>
                      <td>
                        <button
                          id={`view-applicants-${d._id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => openDriveApplicants(d)}
                        >
                          View Applicants
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCompanyModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} id="company-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editCompany ? 'Edit Company' : 'Add Company Drive'}</h2>
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
                    {['Upcoming', 'Active', 'Closed'].map((s) => <option key={s}>{s}</option>)}
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
                {saving ? 'Saving...' : editCompany ? 'Update Company' : 'Add Company'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drive Applicants Modal */}
      {showApplicantsModal && selectedDrive && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowApplicantsModal(false)}>
          <div className="modal modal-wide" id="drive-applicants-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedDrive.company} — {selectedDrive.role}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                  {loadingApplicants ? 'Loading…' : `${applicants.length} student${applicants.length !== 1 ? 's' : ''} applied`}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowApplicantsModal(false)}>✕</button>
            </div>

            {/* Filters */}
            <div className="drive-modal-filters">
              <input
                id="applicant-search"
                className="form-input"
                placeholder="Search by name, email, roll no…"
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <select
                id="applicant-status-filter"
                className="form-input"
                value={applicantStatusFilter}
                onChange={(e) => setApplicantStatusFilter(e.target.value)}
                style={{ width: 160 }}
              >
                {['All', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Status summary pills */}
            {!loadingApplicants && applicants.length > 0 && (
              <div className="drive-status-summary">
                {['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'].map((s) => {
                  const cnt = applicants.filter((a) => a.status === s).length;
                  if (cnt === 0) return null;
                  return (
                    <span
                      key={s}
                      className={`badge badge-${STATUS_BADGE[s]}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setApplicantStatusFilter(applicantStatusFilter === s ? 'All' : s)}
                    >
                      {s}: {cnt}
                    </span>
                  );
                })}
              </div>
            )}

            {loadingApplicants ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" /></div>
            ) : filteredApplicants.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <h3>{applicants.length === 0 ? 'No students have applied yet' : 'No results match your filters'}</h3>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" id="applicants-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Branch</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Stage Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((a, idx) => {
                      // Determine which stage timestamp to display
                      const stageTs =
                        a.status === 'Shortlisted' ? a.shortlisted_at
                        : a.status === 'Interview'   ? a.interview_at
                        : a.status === 'Offer'       ? a.offer_at
                        : a.status === 'Rejected'    ? a.rejected_at
                        : a.applied_at;

                      // Next-action buttons based on current status
                      const actionButtons = {
                        Applied:     [{ label: '✓ Shortlist',      next: 'Shortlisted', cls: 'btn-shortlist' }],
                        Shortlisted: [{ label: '→ Interview',      next: 'Interview',   cls: 'btn-interview' }],
                        Interview:   [
                          { label: '🎉 Offer',   next: 'Offer',    cls: 'btn-offer'  },
                          { label: '✕ Reject',  next: 'Rejected', cls: 'btn-reject' },
                        ],
                        Offer:    [],
                        Rejected: [],
                      }[a.status] || [];

                      return (
                        <tr
                          key={String(a.userId)}
                          id={`applicant-row-${String(a.userId)}`}
                          className={pendingUserId === String(a.userId) ? 'applicant-row-pending' : ''}
                        >
                          <td style={{ color: 'var(--text-muted)', fontWeight: 700, width: 40 }}>{idx + 1}</td>
                          <td>
                            <div className="admin-student-cell">
                              <div className="admin-student-avatar">{a.name[0]}</div>
                              <div>
                                <div className="admin-student-name">{a.name}</div>
                                <div className="admin-student-email">{a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.rollNumber || '—'}</td>
                          <td style={{ fontSize: '0.82rem' }}>{a.branch || '—'}</td>
                          <td style={{ fontSize: '0.82rem' }}>{a.year ? `Year ${a.year}` : '—'}</td>
                          <td>
                            <span className={`badge badge-${STATUS_BADGE[a.status] || 'applied'}`}>{a.status}</span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {stageTs ? new Date(stageTs).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div className="applicant-action-btns">
                              {pendingUserId === String(a.userId) ? (
                                <span className="applicant-row-spinner">⏳ Updating…</span>
                              ) : actionButtons.length === 0 ? (
                                <span className="terminal-badge">Terminal</span>
                              ) : (
                                actionButtons.map(({ label, next, cls }) => (
                                  <button
                                    key={next}
                                    id={`advance-${String(a.userId)}-${next}`}
                                    className={`btn btn-sm applicant-action-btn ${cls}`}
                                    disabled={!!pendingUserId}
                                    onClick={() => requestAdvanceStatus(String(a.userId), next, a.name)}
                                  >
                                    {label}
                                  </button>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confirmation Modal (Offer / Reject) ── */}
      {confirmPending && (
        <ConfirmModal
          studentName={confirmPending.studentName}
          newStatus={confirmPending.newStatus}
          onConfirm={() => handleAdvanceStatus(confirmPending.userId, confirmPending.newStatus)}
          onCancel={() => setConfirmPending(null)}
        />
      )}
    </div>
  );
}

/* ── Confirm Modal Component ── */
function ConfirmModal({ studentName, newStatus, onConfirm, onCancel }) {
  const isOffer    = newStatus === 'Offer';
  const accentColor = isOffer ? '#10b981' : '#ef4444';
  const icon        = isOffer ? '🏆' : '❌';

  return (
    <div
      className="modal-overlay"
      id="confirm-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm-modal" id="confirm-modal">
        <div className="confirm-modal-icon" style={{ background: isOffer ? '#ecfdf5' : '#fef2f2' }}>
          <span style={{ fontSize: '2rem' }}>{icon}</span>
        </div>
        <h3 className="confirm-modal-title" style={{ color: accentColor }}>
          Confirm {newStatus}
        </h3>
        <p className="confirm-modal-body">
          You are about to mark <strong>{studentName}</strong> as{' '}
          <strong style={{ color: accentColor }}>{newStatus}</strong>.
          {newStatus === 'Rejected'
            ? ' This will notify the student that they have not been selected.'
            : ' This will notify the student with a congratulatory message.'}
        </p>
        <p className="confirm-modal-warning">This action cannot be undone.</p>
        <div className="confirm-modal-actions">
          <button
            id="confirm-modal-cancel"
            className="btn btn-ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            id="confirm-modal-proceed"
            className="btn"
            style={{ background: accentColor, color: 'white', border: 'none' }}
            onClick={onConfirm}
          >
            Confirm {newStatus}
          </button>
        </div>
      </div>
    </div>
  );
}
