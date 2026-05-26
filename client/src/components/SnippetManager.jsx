import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  Code2, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  Trash2, 
  Plus, 
  Terminal,
  FileCode2
} from 'lucide-react';

const SnippetManager = ({ onReviewSnippet }) => {
  const { activeProject, user, triggerAlert } = useApp();
  const { reloadTrigger } = useSocket();

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Searching & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('javascript');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');

  // Copy Feedback map of snippetId -> boolean
  const [copiedMap, setCopiedMap] = useState({});

  const fetchSnippets = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/snippets`);
      if (res.ok) {
        const data = await res.json();
        setSnippets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [activeProject, reloadTrigger]);

  const handleCreateSnippet = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;
    if (!activeProject) {
      triggerAlert('error', 'Please select or create a project folder inside the workspace first.');
      return;
    }

    try {
      const tagArray = newTags.split(',').map(t => t.trim()).filter(t => t !== '');
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          title: newTitle,
          language: newLang,
          code: newCode,
          tags: tagArray,
          description: newDesc,
          userId: user.id
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewCode('');
        setNewDesc('');
        setNewTags('');
        setShowCreateModal(false);
        triggerAlert('success', 'Snippet saved in repository');
        fetchSnippets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSnippet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;
    try {
      const res = await fetch(`/api/snippets/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        triggerAlert('success', 'Snippet removed');
        fetchSnippets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyToClipboard = (snippetId, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedMap(prev => ({ ...prev, [snippetId]: true }));
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [snippetId]: false }));
    }, 2000);
    triggerAlert('success', 'Code copied to clipboard');
  };

  // Simple custom high-fidelity syntax highlighter that highlights core programming tags
  const renderHighlightedCode = (codeText, lang) => {
    if (!codeText) return '';
    const keywords = ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'class', 'def', 'import', 'from', 'if', 'else', 'for', 'while', 'package', 'public', 'private', 'static', 'void', 'int', 'String', 'func', 'nil', 'err'];
    
    const escaped = codeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Highlight keywords
    let highlighted = escaped;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span style="color: var(--accent-purple); font-weight: 600;">${kw}</span>`);
    });

    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*)/g, `<span style="color: var(--text-muted); font-style: italic;">$1</span>`);
    highlighted = highlighted.replace(/(#.*)/g, `<span style="color: var(--text-muted); font-style: italic;">$1</span>`);

    // Highlight strings
    highlighted = highlighted.replace(/(['"`].*?['"`])/g, `<span style="color: var(--priority-p2); font-weight: 500;">$1</span>`);

    return (
      <code 
        style={{ display: 'block', textAlign: 'left' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  };

  // Filter snippets based on query
  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="auth-input" 
            style={{ width: '280px', paddingLeft: '36px', height: '36px' }} 
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="header-btn header-btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Save Code Snippet
        </button>
      </div>

      {/* Snippet display Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <span>Loading snippets database...</span>
        </div>
      ) : (
        <div className="snippets-grid">
          {filteredSnippets.map(snip => (
            <div key={snip.id} className="snippet-card">
              <div className="snippet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{snip.title}</span>
                </div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {snip.language}
                </span>
              </div>

              {snip.description && (
                <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.08)', textAlign: 'left' }}>
                  {snip.description}
                </div>
              )}

              <div className="snippet-body">
                <pre className="snippet-code-pre">
                  {renderHighlightedCode(snip.code, snip.language)}
                </pre>
              </div>

              {snip.tags && snip.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
                  {snip.tags.map(t => (
                    <span key={t} className="card-label">#{t}</span>
                  ))}
                </div>
              )}

              <div className="snippet-footer">
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Copy Button */}
                  <button 
                    className="header-btn" 
                    style={{ padding: '6px 10px' }}
                    onClick={() => handleCopyToClipboard(snip.id, snip.code)}
                  >
                    {copiedMap[snip.id] ? <Check size={12} style={{ color: 'var(--priority-p2)' }} /> : <Copy size={12} />}
                    <span style={{ fontSize: '11px' }}>{copiedMap[snip.id] ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* AI Code Review Trigger */}
                  <button 
                    className="header-btn" 
                    style={{ padding: '6px 10px', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
                    onClick={() => onReviewSnippet(snip.language, snip.code, snip.title)}
                  >
                    <Sparkles size={12} />
                    <span style={{ fontSize: '11px' }}>AI Review</span>
                  </button>
                </div>

                <Trash2 
                  size={14} 
                  style={{ cursor: 'pointer', color: 'var(--priority-p0)' }}
                  onClick={() => handleDeleteSnippet(snip.id)}
                />
              </div>
            </div>
          ))}
          {filteredSnippets.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileCode2 size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <span>No code snippets saved in this repository yet.</span>
            </div>
          )}
        </div>
      )}

      {/* Save Snippet Modal overlay */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-glow">
            <h3 style={{ marginBottom: '16px' }}>Save Code Snippet</h3>
            <form onSubmit={handleCreateSnippet}>
              <div className="auth-input-group">
                <label className="auth-label">Snippet Title</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. JWT Auth Middleware"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="auth-input-group">
                  <label className="auth-label">Language</label>
                  <select 
                    className="workspace-select" 
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="auth, helper, express"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Description (Optional)</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Explain what this code solves..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Source Code</label>
                <textarea 
                  className="auth-input" 
                  style={{ minHeight: '180px', fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'vertical' }}
                  placeholder="Paste your clean code block..."
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="header-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="auth-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Save Snippet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnippetManager;
