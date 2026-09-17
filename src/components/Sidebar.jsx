import React, { useRef, useState } from 'react';
import { extractTextFromPDF } from '../lib/utils';
import { SAMPLE_DOCS } from '../lib/sampleDocs';
import { FileUp, FileText, Trash2, Edit3, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function Sidebar({ docA, docB, setDocA, setDocB, isSidebarOpen, onClose }) {
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);
  
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pastingTarget, setPastingTarget] = useState('A');
  const [showSamples, setShowSamples] = useState(false);
  
  // Track which document is currently being previewed in the bottom pane
  const [activePreview, setActivePreview] = useState('A');

  const handleFileUpload = async (e, isDocB) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      
      const newDoc = { name: file.name, text: text, type: file.type };
      if (isDocB) {
        setDocB(newDoc);
        setActivePreview('B');
      } else {
        setDocA(newDoc);
        setActivePreview('A');
      }
    } catch (err) {
      alert(`Error reading document: ${err.message}`);
    }
    // reset input
    e.target.value = '';
  };

  const handlePasteClick = (target) => {
    setPastingTarget(target);
    setPasteText('');
    setIsPasting(true);
  };

  const submitPaste = () => {
    if (!pasteText.trim()) {
      setIsPasting(false);
      return;
    }
    const setDoc = pastingTarget === 'B' ? setDocB : setDocA;
    setDoc({ name: 'Pasted Document', text: pasteText, type: 'text/plain' });
    setActivePreview(pastingTarget);
    setIsPasting(false);
    setPasteText('');
  };

  const loadSample = (sample) => {
    // If A is empty, load into A. Otherwise load into B.
    const isDocB = docA.text ? true : false;
    const setDoc = isDocB ? setDocB : setDocA;
    setDoc({ name: sample.name, text: sample.text, type: sample.type || 'text/plain' });
    setActivePreview(isDocB ? 'B' : 'A');
    setShowSamples(false);
  };

  const renderSlot = (title, doc, setDoc, fileInputRef, targetStr) => {
    const isLoaded = !!doc.text;
    const isActive = activePreview === targetStr && isLoaded;

    if (!isLoaded) {
      return (
        <div className="doc-slot">
          <div className="doc-slot-header">
            <span className="doc-slot-title">{title}</span>
          </div>
          <div 
            className="doc-slot-empty" 
            onClick={() => fileInputRef.current?.click()}
          >
             <FileUp size={24} className="doc-slot-empty-icon" />
             <div className="doc-slot-empty-text">Upload {title}</div>
             <div className="doc-slot-empty-hint">PDF, TXT, MD</div>
          </div>
          <div className="doc-slot-actions">
            <button className="btn-slot-action" onClick={() => handlePasteClick(targetStr)}>
              <Edit3 size={14} /> Paste Text
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e, targetStr === 'B')}
              style={{display: 'none'}}
              accept=".pdf,.txt,.md,text/plain,application/pdf" 
            />
          </div>
        </div>
      );
    }

    return (
      <div 
        className="doc-slot" 
        style={{ 
          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
          boxShadow: isActive ? '0 0 0 1px var(--accent-subtle)' : 'none',
          cursor: 'pointer'
        }} 
        onClick={() => setActivePreview(targetStr)}
      >
        <div className="doc-slot-header">
          <span className="doc-slot-title">{title}</span>
          <CheckCircle2 size={16} color="var(--green)" />
        </div>
        <div className="doc-slot-loaded">
          <div className="doc-slot-filename">{doc.name || 'Untitled Document'}</div>
          <div className="doc-slot-meta">{Math.round(doc.text.length / 1000)}k chars</div>
        </div>
        <div className="doc-slot-actions">
          <button className="btn-slot-action" onClick={(e) => { e.stopPropagation(); setDoc({ name: '', text: '', type: '' }); if(activePreview === targetStr) setActivePreview(targetStr === 'A' ? 'B' : 'A'); }}>
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    );
  };

  const renderDocumentPreview = () => {
    const activeDoc = activePreview === 'A' ? docA : docB;
    
    if (!activeDoc.text) {
      return (
        <div className="doc-preview-empty" style={{marginTop: '2rem'}}>
          <p>No document selected.</p>
          <p style={{fontSize:'0.85rem', color:'var(--text-faint)', marginTop:'0.5rem'}}>
            Click on a loaded document above to preview it here.
          </p>
        </div>
      );
    }
    
    return (
      <div className="doc-preview-content">
        <div className="doc-preview-meta">
          <span className="meta-badge" style={{ fontWeight: '500' }}>
            Previewing: Document {activePreview}
          </span>
        </div>
        <div style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>
          {activeDoc.name}
        </div>
        <pre className="doc-preview-text">
          {activeDoc.text}
        </pre>
      </div>
    );
  };

  return (
    <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`} aria-hidden={!isSidebarOpen}>
      <div className="sidebar-header" style={{ paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', background: 'var(--navy)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src="/jenlaw_logo.jpg" alt="JenLaw Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.3px' }}>JenLaw</span>
          </div>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Close sidebar" style={{ padding: '4px' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-content" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        
        {isPasting ? (
          <div className="paste-ui">
            <div className="doc-slot-title" style={{ marginBottom: '12px' }}>Paste Document {pastingTarget}</div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your legal text here..."
              style={{
                width: '100%',
                height: '300px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontFamily: 'var(--font)',
                fontSize: '13px',
                resize: 'vertical',
                marginBottom: '12px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={submitPaste}
                style={{ flex: 1, padding: '8px', background: 'var(--navy)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Save
              </button>
              <button 
                onClick={() => setIsPasting(false)}
                style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {renderSlot('Document A', docA, setDocA, fileInputARef, 'A')}
            {renderSlot('Document B', docB, setDocB, fileInputBRef, 'B')}

            {/* Sample Documents Dropdown */}
            <div style={{ marginTop: '24px' }}>
              <button 
                className="btn-sample" 
                onClick={() => setShowSamples(!showSamples)}
                style={{ justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <FileText size={14} style={{ marginRight: '6px' }} />
                  Load Sample Document
                </span>
                <ChevronDown size={14} style={{ transform: showSamples ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              {showSamples && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>
                  {SAMPLE_DOCS.map((sample, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => loadSample(sample)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        textAlign: 'left',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--off-white)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      • {sample.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="doc-preview-area" id="doc-preview-area" aria-label="Document preview" aria-live="polite" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        {renderDocumentPreview()}
      </div>
    </aside>
  );
}
