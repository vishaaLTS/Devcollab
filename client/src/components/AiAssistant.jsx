import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  Sparkles, 
  Play, 
  HelpCircle, 
  Terminal, 
  Code, 
  Clock, 
  AlertTriangle,
  FileCheck,
  CheckCircle
} from 'lucide-react';

const AiAssistant = ({ reviewState, onClearReview }) => {
  const { activeProject, activeWorkspace, user, triggerAlert } = useApp();
  const { reloadTrigger } = useSocket();

  const [activeSubTab, setActiveSubTab] = useState('assistant'); // 'assistant' | 'breakdown' | 'reviewer'
  
  // Assistant queries
  const [aiLoading, setAiLoading] = useState(false);
  const [assistantOutput, setAssistantOutput] = useState('');
  
  // Feature Breakdown
  const [featurePrompt, setFeaturePrompt] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // If a new snippet is selected for review, force review sub-tab open
  useEffect(() => {
    if (reviewState) {
      setActiveSubTab('reviewer');
    }
  }, [reviewState]);

  const handleAiAction = async (actionPath) => {
    if (!activeProject) return;
    setAiLoading(true);
    setAssistantOutput('');
    try {
      const res = await fetch(`/api/ai/${actionPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          workspaceId: activeWorkspace.id,
          projectName: activeProject.name,
          username: user.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAssistantOutput(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateBreakdown = async (e) => {
    e.preventDefault();
    if (!featurePrompt.trim() || !activeProject) return;

    setBreakdownLoading(true);
    setGeneratedTasks([]);
    try {
      // We will perform a dry-run review or fetch mock subtasks first, to let user review them in UI!
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          description: featurePrompt,
          userId: user.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedTasks(data.tasks);
        triggerAlert('success', `AI successfully generated and inserted ${data.tasks.length} tasks!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Format Code Reviewer Score styling
  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 5) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  if (!activeProject) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px', textAlign: 'center', height: '100%' }}>
        <Sparkles size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3>AI Assistant Locked</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Select or construct a workspace project folder inside the sidebar to initialize the AI engine.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer sub-selector */}
      <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <button 
          className={`view-tab ${activeSubTab === 'assistant' ? 'active' : ''}`}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
          onClick={() => setActiveSubTab('assistant')}
        >
          Project Assistant
        </button>
        <button 
          className={`view-tab ${activeSubTab === 'breakdown' ? 'active' : ''}`}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
          onClick={() => setActiveSubTab('breakdown')}
        >
          Task Breakdown
        </button>
        <button 
          className={`view-tab ${activeSubTab === 'reviewer' ? 'active' : ''}`}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
          onClick={() => setActiveSubTab('reviewer')}
        >
          AI Code Reviewer
        </button>
      </div>

      {/* RENDER ACTIVE ASSISTANT TABS */}
      
      {/* 1. Project Helper Chatbots */}
      {activeSubTab === 'assistant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="header-btn" onClick={() => handleAiAction('summarize')} disabled={aiLoading}>
              📈 Summarize Project
            </button>
            <button className="header-btn" onClick={() => handleAiAction('blockers')} disabled={aiLoading}>
              🛑 What's Blocking Us?
            </button>
            <button className="header-btn" onClick={() => handleAiAction('standup')} disabled={aiLoading}>
              📝 Daily Standup Report
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {aiLoading ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <span>AI Assistant is compiling workspace data...</span>
              </div>
            ) : (
              assistantOutput && (
                <div className="ai-result-box" style={{ flex: 1, textAlign: 'left', overflowY: 'auto' }}>
                  {/* Simplistic renderer parsing headers and listings */}
                  {assistantOutput.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) return <h3 key={i} style={{ marginTop: '16px', color: 'var(--accent-purple)' }}>{line.slice(4)}</h3>;
                    if (line.startsWith('#### ')) return <h4 key={i} style={{ marginTop: '12px', color: 'var(--accent-pink)' }}>{line.slice(5)}</h4>;
                    if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '16px', fontSize: '13px' }}>{line.slice(2)}</li>;
                    return <p key={i} style={{ minHeight: '1em', fontSize: '13px', margin: '4px 0' }}>{line}</p>;
                  })}
                </div>
              )
            )}
            {!assistantOutput && !aiLoading && (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>
                Select a quick action button above to let AI read your project board and output analytics.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Feature Breakdown Subtask Creator */}
      {activeSubTab === 'breakdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <form onSubmit={handleGenerateBreakdown} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">Feature Description</label>
              <textarea 
                className="auth-input" 
                placeholder="e.g. Build an authentication system with password recovery and token validation cookies..." 
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={featurePrompt}
                onChange={(e) => setFeaturePrompt(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn" style={{ width: '100%', margin: 0 }} disabled={breakdownLoading}>
              <Sparkles size={14} /> Generate & Apply 6 Subtasks
            </button>
          </form>

          {breakdownLoading && (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <span>AI is generating operational project breakdown...</span>
            </div>
          )}

          {generatedTasks.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent-purple)' }}>Successfully Inserted Subtasks:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedTasks.map((t, idx) => (
                  <div key={t.id || idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                      <span>{t.title}</span>
                      <span style={{ color: 'var(--priority-p1)' }}>{t.priority}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. AI Code Reviewer diagnostics */}
      {activeSubTab === 'reviewer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {reviewState ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px' }}>Code Review: **{reviewState.title}**</h3>
                <button className="header-btn" onClick={onClearReview} style={{ padding: '4px 8px' }}>Clear</button>
              </div>

              {/* Quality score circular panel */}
              <div className="reviewer-metrics">
                <div className="reviewer-score-card">
                  <span className="reviewer-score-value" style={{ color: getScoreColor(reviewState.score) }}>
                    {reviewState.score}
                  </span>
                  <span className="reviewer-score-label">Score / 10</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <div>🛡️ Language detected: **{reviewState.language}**</div>
                  <div style={{ marginTop: '6px' }}>🔑 Quality: {reviewState.score >= 8 ? 'Nominal' : reviewState.score >= 5 ? 'Needs Optimization' : 'Refactoring Required'}</div>
                </div>
              </div>

              {/* Detailed reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                {reviewState.bugs && (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>
                      <AlertTriangle size={14} /> Bugs & Edge Cases
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{reviewState.bugs}</p>
                  </div>
                )}

                {reviewState.security && (
                  <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#f43f5e' }}>
                      <AlertTriangle size={14} /> Security Violations
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{reviewState.security}</p>
                  </div>
                )}

                {reviewState.performance && (
                  <div style={{ padding: '12px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.15)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>
                      <Clock size={14} /> Performance Optimizations
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{reviewState.performance}</p>
                  </div>
                )}

                {reviewState.readability && (
                  <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>
                      <CheckCircle size={14} /> Readability & Formatting
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{reviewState.readability}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '1px dashed var(--border-light)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              <Code size={32} style={{ marginBottom: '12px' }} />
              <span style={{ fontSize: '13px', padding: '0 24px', textAlign: 'center' }}>Navigate to **Snippet Hub**, select a reusable code card, and click **AI Review** to initialize structural code reviewing.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
