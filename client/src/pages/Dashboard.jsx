import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApplications } from '../api/applicationApi';
import { getCareerInsights } from '../api/aiApi';
import StatsCard from '../components/StatsCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import './Dashboard.css';

const STATUS_COLORS = {
  Applied: '#3b82f6',
  Shortlisted: '#8b5cf6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const appRes = await getApplications({ sort: '-createdAt' });
        setApplications(appRes.data.applications || []);
        setStats(appRes.data.stats || {});
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
      // AI insights are optional — never block the dashboard
      try {
        const insightRes = await getCareerInsights(user?.skills || [], user?.targetRole || '');
        setInsights(insightRes.data.result);
      } catch (_) {
        // Silently ignore AI failures (missing key, quota, etc.)
        setInsights(null);
      }
    };
    fetchAll();
  }, []);

  const pieData = stats
    ? Object.entries(STATUS_COLORS)
        .map(([k, color]) => ({ name: k, value: stats[k.toLowerCase()] || 0, color }))
        .filter((d) => d.value > 0)
    : [];

  // Build area chart data from application dates
  const monthMap = {};
  applications.forEach((app) => {
    const m = new Date(app.appliedDate).toLocaleString('default', { month: 'short' });
    monthMap[m] = (monthMap[m] || 0) + 1;
  });
  const areaData = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  const recent = applications.slice(0, 5);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span>Loading your dashboard...</span>
    </div>
  );

  return (
    <div className="dashboard fade-in">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1 className="welcome-title">
            Good {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="welcome-sub">
            {stats?.offer > 0
              ? `Congratulations! You have ${stats.offer} offer${stats.offer > 1 ? 's' : ''}.`
              : `You have ${stats?.total || 0} applications tracked. Keep going!`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <StatsCard icon="T" label="Total Applied" value={stats?.total ?? 0} color="primary" />
        <StatsCard icon="S" label="Shortlisted" value={stats?.shortlisted ?? 0} color="purple" />
        <StatsCard icon="I" label="Interviews" value={stats?.interview ?? 0} color="warning" />
        <StatsCard icon="O" label="Offers" value={stats?.offer ?? 0} color="success" />
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h2 className="card-title">Application Timeline</h2>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <h3>No data yet</h3>
              <p>Start adding applications to see your timeline</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Status Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#0f172a' }}
                />
                <Legend
                  formatter={(v) => <span style={{ color: '#475569', fontSize: '0.82rem' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <h3>Nothing to show yet</h3>
              <p>Add some applications to see the breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent + Insights */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Applications</h2>
            <Link to="/applications" className="btn btn-secondary btn-sm">View All &rarr;</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <h3>No applications yet</h3>
              <Link to="/applications" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>+ Add First Application</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map((app) => (
                <div key={app._id} className="recent-item">
                  <div className="recent-company-logo">
                    {app.company[0].toUpperCase()}
                  </div>
                  <div className="recent-info">
                    <div className="recent-company">{app.company}</div>
                    <div className="recent-role">{app.role}</div>
                  </div>
                  <span className={`badge badge-${(app.status || 'applied').toLowerCase()}`}>{app.status || 'Applied'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">AI Career Insights</h2>
          {insights ? (
            <div className="insights-list">
              <div className="insights-section-title">Trending Skills</div>
              {insights.trending?.slice(0, 3).map((t) => (
                <div key={t.skill} className="insight-item">
                  <div className="insight-skill">{t.skill}</div>
                  <div className="insight-meta">
                    <span className="insight-demand">{t.demand}</span>
                    <span className="insight-growth">{t.growth}</span>
                  </div>
                </div>
              ))}
              <hr className="divider" />
              <div className="insights-section-title">Salary Range ({user?.targetRole || 'Software'})</div>
              <div className="salary-range">
                <div className="salary-level"><span>Entry</span><strong>{insights.salaryInsight?.entry}</strong></div>
                <div className="salary-level"><span>Mid</span><strong>{insights.salaryInsight?.mid}</strong></div>
                <div className="salary-level"><span>Senior</span><strong>{insights.salaryInsight?.senior}</strong></div>
              </div>
              <Link to="/ai" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                Open AI Assistant &rarr;
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI insights unavailable.</p>
              <Link to="/ai" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Open AI Assistant &rarr;</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
