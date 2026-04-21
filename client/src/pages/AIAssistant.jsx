import { useState, useRef, useEffect } from 'react';
import { analyzeResume, matchJD, getInterviewPrep, getCareerInsights } from '../api/aiApi';
import './AIAssistant.css';

const TABS = [
  { id: 'resume', icon: '📄', label: 'Resume Analyzer' },
  { id: 'jd', icon: '🎯', label: 'JD Matcher' },
  { id: 'interview', icon: '🧠', label: 'Interview Prep' },
  { id: 'insights', icon: '📊', label: 'Career Insights' },
];

export default function AIAssistant() {
  const [tab, setTab] = useState('resume');
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  // Resume
  const [resumeText, setResumeText] = useState('');
  const [resumeResult, setResumeResult] = useState(null);

  // JD Matcher
  const [jdResume, setJdResume] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdResult, setJdResult] = useState(null);

  // Interview prep
  const [role, setRole] = useState('');
  const [messages, setMessages] = useState([
    { from: 'ai', text: '👋 Hi! I\'m your AI interview coach. Tell me the role you\'re preparing for, then ask any interview question!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Insights
  const [insightsResult, setInsightsResult] = useState(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const runAI = async (fn, ...args) => {
    setLoading(true);
    setPulsing(true);
    try {
      const res = await fn(...args);
      return res.data;
    } finally {
      setLoading(false);
      setPulsing(false);
    }
  };

  const handleResumeAnalyze = async () => {
    if (!resumeText.trim()) return;
    const data = await runAI(analyzeResume, resumeText);
    setResumeResult(data.analysis);
  };

  const handleJDMatch = async () => {
    if (!jdResume.trim() || !jdText.trim()) return;
    const data = await runAI(matchJD, jdResume, jdText);
    setJdResult(data.result);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { from: 'user', text: q }]);
    setLoading(true);
    setPulsing(true);
    try {
      const res = await getInterviewPrep(role || 'Software Engineer', q);
      const { answer, followUpQuestions, tips } = res.data.result;
      setMessages((prev) => [...prev,
        { from: 'ai', text: answer },
        { from: 'ai', text: `💡 **Follow-up questions:**\n${followUpQuestions.map((q,i) => `${i+1}. ${q}`).join('\n')}` },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { from: 'ai', text: '⚠️ Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
      setPulsing(false);
    }
  };

  const handleInsights = async () => {
    const data = await runAI(getCareerInsights, [], role || 'Software Engineer');
    setInsightsResult(data.result);
  };

  return (
    <div className="ai-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Powered by AI — Resume analysis, JD matching, interview prep</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`ai-tab-${t.id}`}
            className={`ai-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Resume Analyzer */}
      {tab === 'resume' && (
        <div className="ai-panel fade-up">
          <div className="ai-panel-split">
            <div className="ai-panel-left">
              <h2 className="ai-panel-title">📄 Resume Analyzer</h2>
              <p className="ai-panel-desc">Paste your resume text below to get AI-powered feedback on skills, ATS compatibility, and improvements.</p>
              <textarea
                id="resume-text-input"
                className="form-input ai-textarea"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={12}
              />
              <button
                id="analyze-resume-btn"
                className="btn btn-primary"
                onClick={handleResumeAnalyze}
                disabled={loading || !resumeText.trim()}
                style={{ marginTop: 12 }}
              >
                {loading ? '⏳ Analyzing...' : '🔍 Analyze Resume'}
              </button>
            </div>

            <div className="ai-panel-right">
              {resumeResult ? (
                <div className="ai-result fade-up">
                  <div className="ai-scores">
                    <div className="ai-score-item">
                      <div className="ai-score-ring" style={{ '--score': resumeResult.overallScore }}>
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="var(--bg-elevated)" strokeWidth="10" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="10" fill="none"
                            strokeDasharray={`${resumeResult.overallScore * 2.51} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dasharray 1s ease' }} />
                        </svg>
                        <span className="ai-score-label">{resumeResult.overallScore}%</span>
                      </div>
                      <div className="ai-score-name">Overall Score</div>
                    </div>
                    <div className="ai-score-item">
                      <div className="ai-score-ring">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="var(--bg-elevated)" strokeWidth="10" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="var(--success)" strokeWidth="10" fill="none"
                            strokeDasharray={`${resumeResult.atsCompatibility * 2.51} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)" />
                        </svg>
                        <span className="ai-score-label">{resumeResult.atsCompatibility}%</span>
                      </div>
                      <div className="ai-score-name">ATS Score</div>
                    </div>
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">✅ Detected Skills</div>
                    <div className="ai-tags">
                      {resumeResult.detectedSkills?.map((s) => <span key={s} className="tag tag-primary">{s}</span>)}
                    </div>
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">💪 Strengths</div>
                    {resumeResult.strengths?.map((s, i) => <div key={i} className="ai-list-item">✓ {s}</div>)}
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">📈 Improvements Needed</div>
                    {resumeResult.improvements?.map((s, i) => <div key={i} className="ai-list-item ai-list-item--warn">→ {s}</div>)}
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">🔑 Missing Keywords</div>
                    <div className="ai-tags">
                      {resumeResult.missingKeywords?.map((k) => <span key={k} className="tag">{k}</span>)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-placeholder">
                  <div className="ai-placeholder-icon">📄</div>
                  <p>Your resume analysis will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JD Matcher */}
      {tab === 'jd' && (
        <div className="ai-panel fade-up">
          <div className="ai-panel-split">
            <div className="ai-panel-left">
              <h2 className="ai-panel-title">🎯 Job Description Matcher</h2>
              <p className="ai-panel-desc">Paste your resume and any job description to get a match score and tailored tips.</p>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Your Resume</label>
                <textarea
                  id="jd-resume-input"
                  className="form-input ai-textarea"
                  value={jdResume}
                  onChange={(e) => setJdResume(e.target.value)}
                  placeholder="Paste your resume..."
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea
                  id="jd-text-input"
                  className="form-input ai-textarea"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description..."
                  rows={6}
                />
              </div>
              <button
                id="jd-match-btn"
                className="btn btn-primary"
                onClick={handleJDMatch}
                disabled={loading || !jdResume.trim() || !jdText.trim()}
                style={{ marginTop: 12 }}
              >
                {loading ? '⏳ Matching...' : '🎯 Get Match Score'}
              </button>
            </div>

            <div className="ai-panel-right">
              {jdResult ? (
                <div className="ai-result fade-up">
                  <div className="match-score-wrap">
                    <div className="match-score-circle" style={{ '--score': jdResult.matchScore }}>
                      <svg viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="56" stroke="var(--bg-elevated)" strokeWidth="12" fill="none" />
                        <circle cx="70" cy="70" r="56" stroke={jdResult.matchScore >= 75 ? 'var(--success)' : jdResult.matchScore >= 50 ? 'var(--warning)' : 'var(--danger)'}
                          strokeWidth="12" fill="none"
                          strokeDasharray={`${jdResult.matchScore * 3.52} 352`}
                          strokeLinecap="round"
                          transform="rotate(-90 70 70)" />
                      </svg>
                      <div className="match-score-text">
                        <div className="match-score-num">{jdResult.matchScore}%</div>
                        <div className="match-score-sub">Match</div>
                      </div>
                    </div>
                    <p className="match-recommendation">{jdResult.recommendation}</p>
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">✅ Matched Skills</div>
                    <div className="ai-tags">
                      {jdResult.matchedSkills?.map((s) => <span key={s} className="tag tag-primary">{s}</span>)}
                    </div>
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">⚠️ Missing Skills</div>
                    <div className="ai-tags">
                      {jdResult.missingSkills?.map((s) => <span key={s} className="tag" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger-light)' }}>{s}</span>)}
                    </div>
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">✉️ Cover Letter Tips</div>
                    {jdResult.coverLetterTips?.map((t, i) => <div key={i} className="ai-list-item">→ {t}</div>)}
                  </div>
                </div>
              ) : (
                <div className="ai-placeholder">
                  <div className="ai-placeholder-icon">🎯</div>
                  <p>Match results will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Prep */}
      {tab === 'interview' && (
        <div className="ai-panel fade-up">
          <h2 className="ai-panel-title">🧠 Interview Prep Assistant</h2>
          <p className="ai-panel-desc">Practice interview questions with your AI coach. Get STAR method answers and tips.</p>

          <div className="form-group" style={{ marginBottom: 16, maxWidth: 320 }}>
            <label className="form-label">Target Role</label>
            <input
              id="interview-role-input"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, PM..."
            />
          </div>

          <div className="chat-container" id="interview-chat">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble--${msg.from}`}>
                {msg.from === 'ai' && <div className="chat-ai-icon">🤖</div>}
                <div className="chat-text" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble--ai">
                <div className="chat-ai-icon">🤖</div>
                <div className="chat-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              id="interview-question-input"
              className="form-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleChat()}
              placeholder="Ask any interview question..."
              disabled={loading}
            />
            <button
              id="interview-send-btn"
              className="btn btn-primary"
              onClick={handleChat}
              disabled={loading || !chatInput.trim()}
            >
              {loading ? '⏳' : '➤ Send'}
            </button>
          </div>
        </div>
      )}

      {/* Insights */}
      {tab === 'insights' && (
        <div className="ai-panel fade-up">
          <div className="ai-panel-split">
            <div className="ai-panel-left">
              <h2 className="ai-panel-title">📊 AI Career Insights</h2>
              <p className="ai-panel-desc">Get AI-powered career roadmap, salary insights, and trending skills for your target role.</p>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Target Role</label>
                <input
                  id="insights-role-input"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer..."
                />
              </div>
              <button
                id="get-insights-btn"
                className="btn btn-primary"
                onClick={handleInsights}
                disabled={loading}
              >
                {loading ? '⏳ Loading...' : '✨ Get Career Insights'}
              </button>
            </div>

            <div className="ai-panel-right">
              {insightsResult ? (
                <div className="ai-result fade-up">
                  <div className="ai-section">
                    <div className="ai-section-title">📈 Trending Skills</div>
                    {insightsResult.trending?.map((t) => (
                      <div key={t.skill} className="trending-item">
                        <div>
                          <div className="trending-skill">{t.skill}</div>
                          <div className="trending-demand">{t.demand} demand</div>
                        </div>
                        <div className="trending-growth">{t.growth}</div>
                      </div>
                    ))}
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">🗺️ Career Roadmap</div>
                    {insightsResult.roadmap?.map((r, i) => (
                      <div key={i} className="roadmap-item">
                        <div className={`roadmap-dot roadmap-dot--${r.priority.toLowerCase()}`} />
                        <div>
                          <div className="roadmap-milestone">{r.milestone}</div>
                          <div className="roadmap-timeline">{r.priority} · {r.timeline}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ai-section">
                    <div className="ai-section-title">🏢 Top Companies Hiring</div>
                    <div className="ai-tags">
                      {insightsResult.topCompanies?.map((c) => <span key={c} className="tag">{c}</span>)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-placeholder">
                  <div className="ai-placeholder-icon">✨</div>
                  <p>Career insights will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
