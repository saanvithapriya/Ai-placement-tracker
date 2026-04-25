import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('mode') === 'register');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const u = await register(form.name, form.email, form.password, form.role);
        navigate(u.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        const u = await login(form.email, form.password);
        navigate(u.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">Back to Home</Link>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">T</div>
          <span className="auth-logo-text">TrackHire</span>
        </div>

        <h1 className="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Start tracking your placement journey with AI' : 'Sign in to continue your placement journey'}
        </p>

        {error && <div className="auth-error" id="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input id="auth-name" className="form-input" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your full name" required autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input id="auth-email" className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div className="pw-wrap">
              <input id="auth-password" className="form-input" name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Your password" required minLength={6} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                {showPw ? '●' : '○'}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="role-grid">
                {[
                  { value: 'student', label: 'Student', desc: 'Track your applications' },
                  { value: 'admin', label: 'Admin (Placement Officer)', desc: 'Manage company drives' },
                ].map((r) => (
                  <label key={r.value} className={`role-option ${form.role === r.value ? 'selected' : ''}`} id={`role-${r.value}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} style={{ display: 'none' }} />
                    <div className="role-label">{r.label}</div>
                    <div className="role-desc">{r.desc}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button id="auth-submit-btn" type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? (
            <>Already have an account? <button className="auth-switch-btn" onClick={() => setIsRegister(false)}>Sign In</button></>
          ) : (
            <>Don't have an account? <button className="auth-switch-btn" onClick={() => setIsRegister(true)}>Create Account</button></>
          )}
        </p>
      </div>
    </div>
  );
}
