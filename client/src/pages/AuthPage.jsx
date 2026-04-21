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
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container">
        <Link to="/" className="auth-back">← Back to Home</Link>

        <div className="auth-card">
          <div className="auth-logo">
            <span>🎯</span>
            <span>APT</span>
          </div>

          <h1 className="auth-title">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Start tracking your placement journey with AI'
              : 'Sign in to continue your placement journey'
            }
          </p>

          {error && <div className="auth-error" id="auth-error-msg">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" id="auth-form">
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                className="form-input"
                placeholder={isRegister ? 'Min 6 characters' : 'Your password'}
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <div className="role-selector">
                  {[
                    { v: 'student', icon: '🎓', label: 'Student' },
                    { v: 'admin', icon: '🛡', label: 'Admin (Placement Officer)' },
                  ].map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      id={`role-${r.v}`}
                      className={`role-option ${form.role === r.v ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, role: r.v })}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : '🔑 Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              id="auth-toggle-mode"
              className="auth-switch-btn"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
