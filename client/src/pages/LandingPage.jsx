import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  { title: 'Smart Application Tracker', desc: 'Kanban-style board to track every job from Applied to Offer — with notes, deadlines, and timeline.', color: 'primary', icon: '◈' },
  { title: 'AI Resume Analyzer', desc: 'Get instant AI feedback on your resume — skill gaps, ATS score, readability, and improvements.', color: 'secondary', icon: '◎' },
  { title: 'JD Match Scorer', desc: 'Paste any job description and get a percentage match score with tailored cover letter tips.', color: 'warning', icon: '◐' },
  { title: 'Interview Prep AI', desc: 'Practice role-specific interview questions with AI-powered STAR method answers.', color: 'success', icon: '◉' },
  { title: 'Skill Progress Tracker', desc: 'Track your learning journey across multiple skills with visual progress indicators.', color: 'purple', icon: '◆' },
  { title: 'Admin Panel', desc: 'Placement officers can manage company drives, eligibility, and view aggregate student progress.', color: 'danger', icon: '◇' },
];

const stats = [
  { value: '10K+', label: 'Students Placed' },
  { value: '500+', label: 'Companies Tracked' },
  { value: '98%', label: 'Resume Score Accuracy' },
  { value: '3x', label: 'Faster Job Search' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="header-nav">
          <div className="header-logo">
            <div className="header-logo-mark">T</div>
            <span className="header-logo-text">TrackHire</span>
          </div>
          <div className="header-actions">
            <Link to="/auth" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/auth?mode=register" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Placement Intelligence</div>
          <h1 className="hero-title">
            Track Your Path to
            <span className="hero-gradient"> Your Dream Job</span>
          </h1>
          <p className="hero-desc">
            The intelligent placement tracker built for students. Manage applications, analyze your resume with AI, prep for interviews, and land the offer — all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/auth?mode=register" className="btn btn-primary btn-lg" id="hero-cta-register">
              Start Tracking Free
            </Link>
            <Link to="/auth" className="btn btn-secondary btn-lg" id="hero-cta-login">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Dashboard Preview */}
        <div className="hero-visual">
          <div className="hero-dashboard">
            <div className="hd-header">
              <div className="hd-dots"><span /><span /><span /></div>
              <div className="hd-title">TrackHire Dashboard</div>
            </div>
            <div className="hd-body">
              <div className="hd-stats-row">
                <div className="hd-stat hd-stat--applied"><div className="hd-stat-num">24</div><div className="hd-stat-lbl">Applied</div></div>
                <div className="hd-stat hd-stat--interview"><div className="hd-stat-num">8</div><div className="hd-stat-lbl">Interviews</div></div>
                <div className="hd-stat hd-stat--offer"><div className="hd-stat-num">3</div><div className="hd-stat-lbl">Offers</div></div>
              </div>
              <div className="hd-bars">
                <div className="hd-bar-row"><span>Google</span><div className="hd-bar-track"><div className="hd-bar-fill" style={{width:'85%', background:'#6366f1'}} /></div></div>
                <div className="hd-bar-row"><span>Amazon</span><div className="hd-bar-track"><div className="hd-bar-fill" style={{width:'70%', background:'#06b6d4'}} /></div></div>
                <div className="hd-bar-row"><span>Microsoft</span><div className="hd-bar-track"><div className="hd-bar-fill" style={{width:'60%', background:'#10b981'}} /></div></div>
                <div className="hd-bar-row"><span>Swiggy</span><div className="hd-bar-track"><div className="hd-bar-fill" style={{width:'45%', background:'#f59e0b'}} /></div></div>
              </div>
              <div className="hd-chips">
                <span className="hd-chip hd-chip--green">Offer Received</span>
                <span className="hd-chip hd-chip--blue">Interview Scheduled</span>
                <span className="hd-chip hd-chip--gray">Applied</span>
              </div>
              <div className="hd-ai-banner">
                <div className="hd-ai-dot" />
                <span>AI: Strong match for SWE roles — apply now</span>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div className="hero-badge-float hero-badge-float--1">Resume Score: 92%</div>
          <div className="hero-badge-float hero-badge-float--2">Interview in 2 days</div>
          <div className="hero-badge-float hero-badge-float--3">Offer from Google!</div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-badge">Features</div>
        <h2 className="section-title">Everything you need to get placed</h2>
        <p className="section-desc">From first application to final offer — TrackHire is your intelligent placement co-pilot.</p>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className={`feature-card feature-card--${f.color}`}>
              <div className={`feature-icon feature-icon--${f.color}`}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="section-badge">How It Works</div>
        <h2 className="section-title">Up and running in 2 minutes</h2>
        <div className="steps">
          {[
            { n: '01', title: 'Create your profile', desc: 'Add your skills, education, and upload your resume.' },
            { n: '02', title: 'Add applications', desc: "Log every company you've applied to in your Kanban board." },
            { n: '03', title: 'Get AI insights', desc: 'Let AI analyze your resume and match it to job descriptions.' },
            { n: '04', title: 'Land the offer', desc: 'Use interview prep, track progress, and celebrate your offer.' },
          ].map((step) => (
            <div key={step.n} className="step">
              <div className="step-number">{step.n}</div>
              <div className="step-connector" />
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to land your dream job?</h2>
        <p className="cta-desc">Join thousands of students who use TrackHire to streamline their placement journey.</p>
        <Link to="/auth?mode=register" className="btn btn-primary btn-lg" id="footer-cta-btn">
          Get Started — It's Free
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-logo">TrackHire</div>
        <div className="footer-text">&copy; {new Date().getFullYear()} TrackHire. Built for students.</div>
      </footer>
    </div>
  );
}
