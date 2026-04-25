import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/authApi';
import './Profile.css';

const SKILL_SUGGESTIONS = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'TypeScript', 'MongoDB', 'SQL', 'AWS', 'Docker', 'Git', 'DSA', 'System Design'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', branch: user?.branch || '', year: user?.year || '',
    rollNumber: user?.rollNumber || '', skills: user?.skills || [],
    linkedIn: user?.linkedIn || '', github: user?.github || '',
    portfolio: user?.portfolio || '', targetRole: user?.targetRole || '',
    targetSalary: user?.targetSalary || '', education: user?.education || [],
    experience: user?.experience || [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const addSkill = (skill) => {
    if (skill && !form.skills.includes(skill)) { setForm({ ...form, skills: [...form.skills, skill] }); setSkillInput(''); }
  };
  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) });
  const addEducation = () => setForm({ ...form, education: [...form.education, { degree: '', institution: '', year: '', cgpa: '' }] });
  const updateEdu = (i, field, val) => { const edu = [...form.education]; edu[i] = { ...edu[i], [field]: val }; setForm({ ...form, education: edu }); };
  const removeEdu = (i) => setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) });
  const addExperience = () => setForm({ ...form, experience: [...form.experience, { title: '', company: '', duration: '', description: '' }] });
  const updateExp = (i, field, val) => { const exp = [...form.experience]; exp[i] = { ...exp[i], [field]: val }; setForm({ ...form, experience: exp }); };
  const removeExp = (i) => setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) });

  const handleSave = async () => {
    setSaving(true);
    try { const res = await updateProfile(form); updateUser(res.data.user); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'links', label: 'Links & Goals' },
  ];

  return (
    <div className="profile-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage your placement profile and skills</p>
        </div>
        <button id="save-profile-btn" className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Profile'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">{user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-meta">
            {form.branch && <span className="tag tag-primary">{form.branch}</span>}
            {form.year && <span className="tag">Year {form.year}</span>}
            {form.rollNumber && <span className="tag">{form.rollNumber}</span>}
            <span className="tag">{user?.role === 'admin' ? 'Admin' : 'Student'}</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        {tabs.map((t) => (<button key={t.id} id={`profile-tab-${t.id}`} className={`profile-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>))}
      </div>

      <div className="profile-content card">
        {activeTab === 'basic' && (
          <div className="tab-content fade-up">
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name</label><input id="profile-name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Roll Number</label><input id="profile-roll" className="form-input" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} placeholder="21CS001" /></div>
              <div className="form-group"><label className="form-label">Branch / Department</label><input id="profile-branch" className="form-input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" /></div>
              <div className="form-group"><label className="form-label">Year of Study</label><select id="profile-year" className="form-input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}><option value="">Select year</option>{['1','2','3','4','Graduated'].map((y) => <option key={y} value={y}>{y === 'Graduated' ? 'Graduated' : `Year ${y}`}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Target Role</label><input id="profile-target-role" className="form-input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} placeholder="Software Engineer" /></div>
              <div className="form-group"><label className="form-label">Target Salary (LPA)</label><input id="profile-target-salary" className="form-input" type="number" value={form.targetSalary} onChange={(e) => setForm({ ...form, targetSalary: e.target.value })} placeholder="12" /></div>
            </div>
          </div>
        )}
        {activeTab === 'skills' && (
          <div className="tab-content fade-up">
            <div className="skills-current"><div className="form-label" style={{ marginBottom: 10 }}>Your Skills</div><div className="skills-tags">{form.skills.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills added yet</p>}{form.skills.map((s) => (<span key={s} className="skill-tag">{s}<button className="skill-remove" onClick={() => removeSkill(s)}>&times;</button></span>))}</div></div>
            <div className="skills-input-row"><input id="skill-input" className="form-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill(skillInput.trim())} placeholder="Type a skill and press Enter..." style={{ maxWidth: 320 }} /><button id="add-skill-btn" className="btn btn-primary btn-sm" onClick={() => addSkill(skillInput.trim())}>+ Add</button></div>
            <div className="skills-suggestions"><div className="form-label" style={{ marginBottom: 8 }}>Suggestions</div><div className="suggestions-grid">{SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (<button key={s} className="suggestion-chip" id={`suggest-${s}`} onClick={() => addSkill(s)}>{s}</button>))}</div></div>
          </div>
        )}
        {activeTab === 'education' && (
          <div className="tab-content fade-up">
            {form.education.map((edu, i) => (<div key={i} className="edu-exp-card"><div className="edu-exp-header"><h3 className="edu-exp-title">Education #{i + 1}</h3><button className="btn btn-danger btn-sm" onClick={() => removeEdu(i)}>Remove</button></div><div className="grid-2"><div className="form-group"><label className="form-label">Degree / Certificate</label><input id={`edu-degree-${i}`} className="form-input" value={edu.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="B.Tech in Computer Science" /></div><div className="form-group"><label className="form-label">Institution</label><input id={`edu-institution-${i}`} className="form-input" value={edu.institution} onChange={(e) => updateEdu(i, 'institution', e.target.value)} placeholder="IIT Bombay" /></div><div className="form-group"><label className="form-label">Year</label><input id={`edu-year-${i}`} className="form-input" value={edu.year} onChange={(e) => updateEdu(i, 'year', e.target.value)} placeholder="2020 - 2024" /></div><div className="form-group"><label className="form-label">CGPA / %</label><input id={`edu-cgpa-${i}`} className="form-input" value={edu.cgpa} onChange={(e) => updateEdu(i, 'cgpa', e.target.value)} placeholder="8.5/10" /></div></div></div>))}
            <button id="add-education-btn" className="btn btn-secondary" onClick={addEducation}>+ Add Education</button>
          </div>
        )}
        {activeTab === 'experience' && (
          <div className="tab-content fade-up">
            {form.experience.map((exp, i) => (<div key={i} className="edu-exp-card"><div className="edu-exp-header"><h3 className="edu-exp-title">Experience #{i + 1}</h3><button className="btn btn-danger btn-sm" onClick={() => removeExp(i)}>Remove</button></div><div className="grid-2"><div className="form-group"><label className="form-label">Job Title</label><input id={`exp-title-${i}`} className="form-input" value={exp.title} onChange={(e) => updateExp(i, 'title', e.target.value)} placeholder="Software Intern" /></div><div className="form-group"><label className="form-label">Company</label><input id={`exp-company-${i}`} className="form-input" value={exp.company} onChange={(e) => updateExp(i, 'company', e.target.value)} placeholder="Google" /></div><div className="form-group"><label className="form-label">Duration</label><input id={`exp-duration-${i}`} className="form-input" value={exp.duration} onChange={(e) => updateExp(i, 'duration', e.target.value)} placeholder="Jun 2023 - Aug 2023" /></div></div><div className="form-group"><label className="form-label">Description</label><textarea id={`exp-description-${i}`} className="form-input" value={exp.description} onChange={(e) => updateExp(i, 'description', e.target.value)} placeholder="What did you do?" rows={3} /></div></div>))}
            <button id="add-experience-btn" className="btn btn-secondary" onClick={addExperience}>+ Add Experience</button>
          </div>
        )}
        {activeTab === 'links' && (
          <div className="tab-content fade-up grid-2">
            <div className="form-group"><label className="form-label">LinkedIn URL</label><input id="profile-linkedin" className="form-input" value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
            <div className="form-group"><label className="form-label">GitHub URL</label><input id="profile-github" className="form-input" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/..." /></div>
            <div className="form-group"><label className="form-label">Portfolio / Website</label><input id="profile-portfolio" className="form-input" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} placeholder="https://yourportfolio.dev" /></div>
          </div>
        )}
      </div>
    </div>
  );
}
