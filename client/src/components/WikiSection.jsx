import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  FileText, 
  Plus, 
  History, 
  Trash2, 
  Save, 
  ChevronRight, 
  RefreshCw,
  Link,
  BookOpen
} from 'lucide-react';

const WikiSection = () => {
  const { activeProject, user, triggerAlert } = useApp();
  const { reloadTrigger } = useSocket();

  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Editor values
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);

  const fetchDocs = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/docs`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
        if (data.length > 0 && !activeDoc) {
          selectDoc(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeProject, reloadTrigger]);

  const selectDoc = (doc) => {
    setActiveDoc(doc);
    setEditorTitle(doc.title);
    setEditorContent(doc.content);
    setPreviewVersion(null);
    setShowHistory(false);
  };

  const handleCreateDoc = async () => {
    if (!activeProject) {
      triggerAlert('error', 'Please select or create a project folder first.');
      return;
    }
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          title: 'Untitled Wiki Page',
          content: 'Start writing your Notion-style document here...\n\nUse Markdown-like conventions:\n# Heading 1\n## Heading 2\n- Bullet items\n\nLink other wiki pages here!',
          userId: user.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(prev => [...prev, data]);
        selectDoc(data);
        triggerAlert('success', 'Wiki page initialized');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDoc = async () => {
    if (!activeDoc) return;
    try {
      const res = await fetch(`/api/docs/${activeDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editorTitle,
          content: editorContent,
          userId: user.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(prev => prev.map(d => d.id === data.id ? data : d));
        setActiveDoc(data);
        triggerAlert('success', 'Wiki changes saved');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollback = async (versionId) => {
    if (!activeDoc) return;
    try {
      const res = await fetch(`/api/docs/${activeDoc.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, userId: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(prev => prev.map(d => d.id === data.id ? data : d));
        selectDoc(data);
        triggerAlert('success', 'Restored document to historical version');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDoc = async () => {
    if (!activeDoc) return;
    if (!window.confirm('Delete this wiki page permanently?')) return;
    
    try {
      const res = await fetch(`/api/docs/${activeDoc.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        const remaining = docs.filter(d => d.id !== activeDoc.id);
        setDocs(remaining);
        if (remaining.length > 0) {
          selectDoc(remaining[0]);
        } else {
          setActiveDoc(null);
          setEditorTitle('');
          setEditorContent('');
        }
        triggerAlert('success', 'Wiki page deleted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render markdown preview highlights dynamically
  const formatBodyPreview = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ marginTop: '18px', marginBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ marginTop: '16px', marginBottom: '6px' }}>{line.slice(3)}</h2>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '20px' }}>{line.slice(2)}</li>;
      }
      if (line.startsWith('```')) {
        return <code key={idx} style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', display: 'block', margin: '8px 0', fontFamily: 'var(--font-mono)' }}>{line}</code>;
      }
      return <p key={idx} style={{ minHeight: '1.5em' }}>{line}</p>;
    });
  };

  return (
    <div className="wiki-container">
      {/* Sidebar Nested pages list */}
      <div className="wiki-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Wiki Documentation</span>
          <Plus size={16} style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} onClick={handleCreateDoc} />
        </div>
        
        <div className="wiki-list">
          {docs.map(doc => (
            <div 
              key={doc.id} 
              className={`wiki-page-item ${activeDoc?.id === doc.id ? 'active' : ''}`}
              onClick={() => selectDoc(doc)}
            >
              <FileText size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '150px' }}>
                {doc.title}
              </span>
            </div>
          ))}
          {docs.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
              No docs added
            </div>
          )}
        </div>
      </div>

      {/* Main wiki document editor */}
      {activeDoc ? (
        <div className="wiki-main">
          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="header-btn" onClick={handleSaveDoc} style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                <Save size={14} /> Save Page
              </button>
              <button className="header-btn" onClick={() => setShowHistory(!showHistory)}>
                <History size={14} /> History
              </button>
            </div>
            
            {/* Quick Wiki Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Wiki Pages:</span>
              {docs.filter(d => d.id !== activeDoc.id).slice(0, 3).map(d => (
                <span 
                  key={d.id} 
                  style={{ color: 'var(--accent-purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'underline' }}
                  onClick={() => selectDoc(d)}
                >
                  <Link size={10} /> {d.title}
                </span>
              ))}
            </div>

            <button className="header-btn" style={{ borderColor: 'var(--priority-p0)', color: 'var(--priority-p0)' }} onClick={handleDeleteDoc}>
              <Trash2 size={14} /> Delete
            </button>
          </div>

          {/* Version preview warning banner */}
          {previewVersion && (
            <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid var(--priority-p1)', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px' }}>
                ⚠️ Viewing **historical version** created by **{previewVersion.updatedBy}** on **{new Date(previewVersion.updatedAt).toLocaleString()}**. Edits are read-only.
              </div>
              <button className="header-btn header-btn-primary" onClick={() => handleRollback(previewVersion.versionId)}>
                <RefreshCw size={12} /> Rollback to this version
              </button>
            </div>
          )}

          {/* Inputs */}
          <input 
            type="text" 
            className="wiki-editor-title" 
            value={editorTitle}
            onChange={(e) => {
              if (previewVersion) return;
              setEditorTitle(e.target.value);
            }}
            placeholder="Wiki Title..."
            disabled={!!previewVersion}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', flex: 1 }}>
            {/* Editor Textarea */}
            <textarea 
              className="wiki-editor-body"
              value={editorContent}
              onChange={(e) => {
                if (previewVersion) return;
                setEditorContent(e.target.value);
              }}
              placeholder="Start writing Notion pages... Use Markdown tags (# heading, - list items) and preview them on the right in real-time."
              disabled={!!previewVersion}
            />

            {/* Premium Gated Live Render Preview */}
            <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '32px', overflowY: 'auto', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '16px' }}>Notion Interactive Render</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {formatBodyPreview(editorContent)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Wiki Page Selected</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Select or click the **+** icon in the left wiki sidebar to create a documentation page.</p>
        </div>
      )}

      {/* Version History Drawer Panel */}
      {showHistory && activeDoc && (
        <div className="version-history-drawer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Version History</span>
            <button className="header-btn" style={{ padding: '4px 8px' }} onClick={() => {
              setShowHistory(false);
              setPreviewVersion(null);
              setEditorTitle(activeDoc.title);
              setEditorContent(activeDoc.content);
            }}>Close</button>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeDoc.versions?.slice().reverse().map((ver, idx) => (
              <div 
                key={ver.versionId} 
                className="version-item"
                style={{ 
                  borderColor: previewVersion?.versionId === ver.versionId ? 'var(--accent-purple)' : 'var(--border-light)',
                  background: previewVersion?.versionId === ver.versionId ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-tertiary)'
                }}
                onClick={() => {
                  setPreviewVersion(ver);
                  setEditorTitle(ver.title);
                  setEditorContent(ver.content);
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Revision {activeDoc.versions.length - idx}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Modified by {ver.updatedBy}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{new Date(ver.updatedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiSection;
