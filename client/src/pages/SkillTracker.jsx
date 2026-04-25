import { useState, useEffect } from 'react';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../api/skillApi';
import './SkillTracker.css';

const CATEGORIES = ['Language', 'Framework', 'Tool', 'Concept', 'Soft Skill', 'Other'];
const EMPTY_FORM = { name: '', category: 'Other', progress: 0, target: 100, notes: '' };

// Get stage label, description and SVG character based on progress
function getStage(progress) {
  if (progress === 0)   return { label: 'Seed', desc: 'Just planted', stage: 0 };
  if (progress < 25)   return { label: 'Sprout', desc: 'Starting to grow', stage: 1 };
  if (progress < 50)   return { label: 'Sapling', desc: 'Growing steadily', stage: 2 };
  if (progress < 75)   return { label: 'Growing', desc: 'Making great progress', stage: 3 };
  if (progress < 100)  return { label: 'Maturing', desc: 'Almost there!', stage: 4 };
  return { label: 'Mastered', desc: 'Fully grown!', stage: 5 };
}

function SkillPlant({ progress }) {
  const { stage } = getStage(progress);
  const pct = Math.min(100, Math.max(0, progress));
  
  // Color based on stage
  const colors = ['#94a3b8','#86efac','#4ade80','#22c55e','#16a34a','#6366f1'];
  const col = colors[stage];

  return (
    <svg className="skill-plant-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {/* Pot base */}
      <rect x="27" y="62" width="26" height="14" rx="3" fill="#b45309" opacity="0.8" />
      <rect x="24" y="58" width="32" height="7" rx="3" fill="#d97706" />
      {/* Soil */}
      <ellipse cx="40" cy="60" rx="13" ry="3" fill="#78350f" opacity="0.6" />
      
      {/* Stem */}
      {stage >= 1 && (
        <line
          x1="40" y1="58"
          x2="40" y2={62 - (stage * 7)}
          stroke="#16a34a"
          strokeWidth={stage < 3 ? 2 : 3}
          strokeLinecap="round"
          className="stem-grow"
        />
      )}

      {/* Seed stage */}
      {stage === 0 && (
        <ellipse cx="40" cy="56" rx="5" ry="4" fill="#a16207" className="seed-pulse" />
      )}

      {/* Small sprout leaves */}
      {stage === 1 && (
        <>
          <ellipse cx="34" cy="48" rx="6" ry="4" fill={col} transform="rotate(-30 34 48)" className="leaf-emerge" />
          <ellipse cx="46" cy="48" rx="6" ry="4" fill={col} transform="rotate(30 46 48)" className="leaf-emerge" />
        </>
      )}

      {/* Sapling */}
      {stage === 2 && (
        <>
          <ellipse cx="32" cy="44" rx="8" ry="5" fill={col} transform="rotate(-35 32 44)" className="leaf-emerge" />
          <ellipse cx="48" cy="44" rx="8" ry="5" fill={col} transform="rotate(35 48 44)" className="leaf-emerge" />
          <ellipse cx="35" cy="37" rx="6" ry="4" fill={col} transform="rotate(-20 35 37)" className="leaf-emerge" />
        </>
      )}

      {/* Growing */}
      {stage === 3 && (
        <>
          <ellipse cx="30" cy="42" rx="9" ry="6" fill={col} transform="rotate(-40 30 42)" className="leaf-emerge" />
          <ellipse cx="50" cy="42" rx="9" ry="6" fill={col} transform="rotate(40 50 42)" className="leaf-emerge" />
          <ellipse cx="32" cy="34" rx="8" ry="5" fill={col} transform="rotate(-25 32 34)" className="leaf-emerge" />
          <ellipse cx="48" cy="34" rx="8" ry="5" fill={col} transform="rotate(25 48 34)" className="leaf-emerge" />
          <ellipse cx="40" cy="30" rx="7" ry="5" fill={col} className="leaf-emerge" />
        </>
      )}

      {/* Maturing — add a flower bud */}
      {stage === 4 && (
        <>
          <ellipse cx="29" cy="40" rx="10" ry="7" fill={col} transform="rotate(-40 29 40)" className="leaf-emerge" />
          <ellipse cx="51" cy="40" rx="10" ry="7" fill={col} transform="rotate(40 51 40)" className="leaf-emerge" />
          <ellipse cx="31" cy="31" rx="9" ry="6" fill={col} transform="rotate(-25 31 31)" className="leaf-emerge" />
          <ellipse cx="49" cy="31" rx="9" ry="6" fill={col} transform="rotate(25 49 31)" className="leaf-emerge" />
          {/* Bud */}
          <circle cx="40" cy="22" r="6" fill="#f9a8d4" className="flower-bloom" />
          <circle cx="40" cy="22" r="3" fill="#ec4899" className="flower-bloom" />
        </>
      )}

      {/* Mastered — full flower */}
      {stage === 5 && (
        <>
          <ellipse cx="28" cy="38" rx="11" ry="7" fill="#4ade80" transform="rotate(-40 28 38)" className="leaf-emerge" />
          <ellipse cx="52" cy="38" rx="11" ry="7" fill="#4ade80" transform="rotate(40 52 38)" className="leaf-emerge" />
          <ellipse cx="29" cy="29" rx="10" ry="6" fill="#4ade80" transform="rotate(-25 29 29)" className="leaf-emerge" />
          <ellipse cx="51" cy="29" rx="10" ry="6" fill="#4ade80" transform="rotate(25 51 29)" className="leaf-emerge" />
          {/* Full flower */}
          {[0,60,120,180,240,300].map((angle, i) => (
            <ellipse key={i} cx={40 + 9 * Math.cos(angle * Math.PI/180)} cy={20 + 9 * Math.sin(angle * Math.PI/180)} rx="5" ry="7" fill="#f472b6"
              transform={`rotate(${angle} ${40 + 9 * Math.cos(angle * Math.PI/180)} ${20 + 9 * Math.sin(angle * Math.PI/180)})`}
              className="flower-bloom" />
          ))}
          <circle cx="40" cy="20" r="5" fill="#fbbf24" className="flower-bloom" />
          {/* Sparkles */}
          <text x="18" y="16" fontSize="8" className="sparkle">✦</text>
          <text x="58" y="18" fontSize="6" className="sparkle sparkle--delay">✦</text>
          <text x="12" y="30" fontSize="5" className="sparkle">✦</text>
        </>
      )}

      {/* Progress arc around pot */}
      <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg-elevated)" strokeWidth="3" />
      <circle
        cx="40" cy="40" r="36" fill="none"
        stroke={col} strokeWidth="3"
        strokeDasharray={`${pct * 2.26} 226`}
        strokeDashoffset="56.5"
        strokeLinecap="round"
        className="progress-arc"
        style={{ '--arc-color': col }}
      />
    </svg>
  );
}

export default function SkillTracker() {
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSkill, setEditSkill] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchSkills = async () => {
    try {
      const res = await getSkills();
      setSkills(res.data.skills);
      setStats(res.data.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  const openCreate = () => { setEditSkill(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (skill) => {
    setEditSkill(skill);
    setForm({ name: skill.name, category: skill.category, progress: skill.progress, target: skill.target, notes: skill.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSkill) { await updateSkill(editSkill._id, form); }
      else { await createSkill(form); }
      setShowModal(false);
      fetchSkills();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this skill from tracking?')) return;
    await deleteSkill(id);
    if (expandedId === id) setExpandedId(null);
    fetchSkills();
  };

  const handleProgressUpdate = async (id, newProgress) => {
    await updateSkill(id, { progress: Math.min(100, Math.max(0, newProgress)) });
    fetchSkills();
  };

  const filtered = filter === 'all' ? skills : skills.filter((s) => s.status === filter);

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="skill-tracker-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Skill Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Watch your skills grow — literally</p>
        </div>
        <button id="add-skill-track-btn" className="btn btn-primary" onClick={openCreate}>+ Track New Skill</button>
      </div>

      {/* Overview Stats */}
      <div className="skill-overview">
        <div className="skill-stat-card">
          <div className="skill-stat-value">{stats.total || 0}</div>
          <div className="skill-stat-label">Total Skills</div>
        </div>
        <div className="skill-stat-card skill-stat--progress">
          <div className="skill-stat-value">{stats.inProgress || 0}</div>
          <div className="skill-stat-label">In Progress</div>
        </div>
        <div className="skill-stat-card skill-stat--done">
          <div className="skill-stat-value">{stats.completed || 0}</div>
          <div className="skill-stat-label">Completed</div>
        </div>
        <div className="skill-stat-card skill-stat--avg">
          <div className="skill-stat-ring">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" stroke="var(--border)" strokeWidth="6" fill="none" />
              <circle cx="40" cy="40" r="32" stroke="var(--primary)" strokeWidth="6" fill="none"
                strokeDasharray={`${(stats.avgProgress || 0) * 2.01} 201`}
                strokeLinecap="round" transform="rotate(-90 40 40)"
                className="skill-ring-animated" />
            </svg>
            <span className="skill-ring-label">{stats.avgProgress || 0}%</span>
          </div>
          <div className="skill-stat-label">Avg Progress</div>
        </div>
      </div>

      {/* Filters */}
      <div className="skill-filters">
        {['all', 'Not Started', 'In Progress', 'Completed'].map((f) => (
          <button key={f} className={`skill-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Skill Cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="st-empty-plant">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <rect x="27" y="62" width="26" height="14" rx="3" fill="#b45309" opacity="0.8" />
              <rect x="24" y="58" width="32" height="7" rx="3" fill="#d97706" />
              <ellipse cx="40" cy="56" rx="5" ry="4" fill="#a16207" className="seed-pulse" />
            </svg>
          </div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            {skills.length === 0 ? 'No skills tracked yet' : 'No skills match this filter'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {skills.length === 0 ? 'Plant your first skill and watch it grow!' : 'Try a different filter.'}
          </p>
          {skills.length === 0 && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>+ Plant Your First Skill</button>
          )}
        </div>
      ) : (
        <div className="skill-grid">
          {filtered.map((skill) => {
            const { label, desc } = getStage(skill.progress);
            const isExpanded = expandedId === skill._id;
            return (
              <div
                key={skill._id}
                className={`skill-card card ${skill.status === 'Completed' ? 'skill-card--completed' : ''} ${isExpanded ? 'skill-card--expanded' : ''}`}
                id={`skill-${skill._id}`}
                onClick={() => setExpandedId(isExpanded ? null : skill._id)}
              >
                {/* Plant Visual */}
                <div className="skill-plant-container">
                  <SkillPlant progress={skill.progress} />
                  <div className="skill-stage-badge">
                    <span className="skill-stage-label">{label}</span>
                    <span className="skill-stage-desc">{desc}</span>
                  </div>
                </div>

                <div className="skill-card-header">
                  <div>
                    <div className="skill-card-name">{skill.name}</div>
                    <span className="skill-card-category">{skill.category}</span>
                  </div>
                  <span className={`badge badge-${skill.status === 'Completed' ? 'offer' : skill.status === 'In Progress' ? 'interview' : 'applied'}`}>
                    {skill.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="skill-progress-wrap">
                  <div className="skill-progress-bar">
                    <div className="skill-progress-fill" style={{ '--progress': `${skill.progress}%` }}>
                      <div className="skill-progress-glow" />
                    </div>
                  </div>
                  <div className="skill-progress-labels">
                    <span className="skill-progress-pct">{skill.progress}%</span>
                    <span className="skill-progress-target">Target: {skill.target}%</span>
                  </div>
                </div>

                {/* Quick controls — show on expand */}
                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="skill-card-controls">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleProgressUpdate(skill._id, skill.progress - 10)} disabled={skill.progress <= 0}>-10</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleProgressUpdate(skill._id, skill.progress - 5)} disabled={skill.progress <= 0}>-5</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleProgressUpdate(skill._id, skill.progress + 5)} disabled={skill.progress >= 100}>+5</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleProgressUpdate(skill._id, skill.progress + 10)} disabled={skill.progress >= 100}>+10</button>
                    </div>
                    {skill.notes && <div className="skill-card-notes">{skill.notes}</div>}
                    <div className="skill-card-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(skill)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(skill._id)}>Remove</button>
                    </div>
                  </div>
                )}
                {!isExpanded && (
                  <div className="skill-tap-hint">Tap to expand controls</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" id="skill-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editSkill ? 'Edit Skill' : 'Track New Skill'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Skill Name *</label>
                  <input id="skill-form-name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React, Docker, DSA" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select id="skill-form-category" className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Live plant preview */}
              <div className="skill-form-preview">
                <div className="skill-form-preview-label">Preview — {getStage(form.progress).label}</div>
                <SkillPlant progress={form.progress} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Current Progress: {form.progress}%</label>
                  <input id="skill-form-progress" className="form-input skill-range" type="range" min="0" max="100" step="5" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target: {form.target}%</label>
                  <input id="skill-form-target" className="form-input skill-range" type="range" min="10" max="100" step="10" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea id="skill-form-notes" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any learning notes..." rows={3} />
              </div>
              <button type="submit" id="skill-form-submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? 'Saving...' : editSkill ? 'Update Skill' : 'Start Tracking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
