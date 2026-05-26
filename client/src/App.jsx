import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import WikiSection from './components/WikiSection';
import SnippetManager from './components/SnippetManager';
import AiAssistant from './components/AiAssistant';
import ActivityFeed from './components/ActivityFeed';
import PaymentsModal from './components/PaymentsModal';
import { FolderGit2, Sparkles, Terminal, Mail, Lock, User, Code } from 'lucide-react';

// Inner component that consumes global Contexts
const MainAppContent = () => {
  const { 
    user, 
    login, 
    register, 
    sidebarTab, 
    setSidebarTab, 
    showPayments, 
    alert, 
    loading 
  } = useApp();

  // Authentication Switch (Login vs Register)
  const [authMode, setAuthMode] = useState('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regSkills, setRegSkills] = useState('');
  const [regGithub, setRegGithub] = useState('');

  // AI Code Review transfer state (passing code from Snippet -> AI assistant tab)
  const [codeReview, setCodeReview] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      setEmail('');
      setPassword('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    const skillList = regSkills.split(',').map(s => s.trim()).filter(s => s !== '');
    const success = await register(regName, regEmail, regPassword, regBio, skillList, regGithub);
    if (success) {
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegBio('');
      setRegSkills('');
      setRegGithub('');
    }
  };

  const handleReviewSnippet = async (language, code, title) => {
    // Open AI Tab and start loader
    setSidebarTab('assistant');
    setCodeReview({
      loading: true,
      title,
      language,
      score: '...',
      bugs: '',
      performance: '',
      readability: '',
      security: ''
    });

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      if (res.ok) {
        const data = await res.json();
        setCodeReview({
          loading: false,
          title,
          language,
          ...data
        });
      }
    } catch (e) {
      console.error(e);
      setCodeReview(null);
    }
  };

  const handleClearReview = () => {
    setCodeReview(null);
  };

  // Render Authentication Screen
  if (!user) {
    return (
      <div className="auth-container">
        {/* Sleek Floating alert */}
        {alert && (
          <div style={{
            position: 'fixed',
            top: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            background: alert.type === 'success' ? 'var(--priority-p2)' : 'var(--priority-p0)',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {alert.message}
          </div>
        )}

        <div className="auth-card glass-glow">
          <div className="auth-header">
            <div className="auth-logo">
              <FolderGit2 size={32} style={{ color: 'var(--accent-purple)' }} />
              <span>DevCollab</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
              Real-time collaboration platform for developer teams
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-input-group">
                <label className="auth-label"><Mail size={12} /> Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="name@university.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label"><Lock size={12} /> Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Entering Sandbox Portal...' : 'Login Workspace'}
              </button>

              <div className="auth-footer">
                Don't have an account?{' '}
                <span className="auth-toggle-link" onClick={() => setAuthMode('register')}>
                  Register
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="auth-input-group">
                <label className="auth-label"><User size={12} /> Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. Ankush" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label"><Mail size={12} /> Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="name@university.edu" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label"><Lock size={12} /> Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="••••••••" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="auth-input-group">
                  <label className="auth-label"><Code size={12} /> Skills (comma separated)</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="React, Node" 
                    value={regSkills}
                    onChange={(e) => setRegSkills(e.target.value)}
                  />
                </div>

                <div className="auth-input-group">
                  <label className="auth-label"><Terminal size={12} /> GitHub Link</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="github.com/profile" 
                    value={regGithub}
                    onChange={(e) => setRegGithub(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Short Bio</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Fullstack Engineer..." 
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Construct Workspace Account'}
              </button>

              <div className="auth-footer">
                Already registered?{' '}
                <span className="auth-toggle-link" onClick={() => setAuthMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Logged In Workspace
  return (
    <div className="app-layout">
      {/* Alert toast notification banners */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          background: alert.type === 'success' ? 'var(--priority-p2)' : 'var(--priority-p0)',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {alert.message}
        </div>
      )}

      {/* Left Workspace sidebar */}
      <Sidebar />

      {/* Main content frames */}
      <main className="content-frame">
        {/* Common workspace navigation header */}
        <Header />

        {/* Dynamic Views selections */}
        {sidebarTab === 'board' && <KanbanBoard />}
        {sidebarTab === 'wiki' && <WikiSection />}
        {sidebarTab === 'snippets' && <SnippetManager onReviewSnippet={handleReviewSnippet} />}
        {sidebarTab === 'assistant' && <AiAssistant reviewState={codeReview} onClearReview={handleClearReview} />}
        {sidebarTab === 'activity' && <ActivityFeed />}
      </main>

      {/* Sandbox checkout upgrade payment modal */}
      {showPayments && <PaymentsModal />}
    </div>
  );
};

// Global App wrapper encapsulating Providers
const App = () => {
  return (
    <AppProvider>
      <SocketProvider>
        <MainAppContent />
      </SocketProvider>
    </AppProvider>
  );
};

export default App;
