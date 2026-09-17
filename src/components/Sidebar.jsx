import React, { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { extractTextFromPDF } from '../lib/utils';
import { SAMPLE_DOCS } from '../lib/sampleDocs';
import { FileText } from 'lucide-react';
import DocumentSlot from './DocumentSlot';

export default function Sidebar({ docA, docB, setDocA, setDocB, isSidebarOpen, onClose }) {
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);
  
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pastingTarget, setPastingTarget] = useState('A');
  const [showSamples, setShowSamples] = useState(false);
  
  // Track which document is currently being previewed in the bottom pane
  const [activePreview, setActivePreview] = useState('A');

  const handleFileUpload = useCallback(async (e, isDocB) => {
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
  }, [setDocA, setDocB]);

  const handlePasteClick = useCallback((target) => {
    setPastingTarget(target);
    setPasteText('');
    setIsPasting(true);
  }, []);

  const submitPaste = useCallback(() => {
    if (!pasteText.trim()) {
      setIsPasting(false);
      return;
    }
    const setDoc = pastingTarget === 'B' ? setDocB : setDocA;
    setDoc({ name: 'Pasted Document', text: pasteText, type: 'text/plain' });
    setActivePreview(pastingTarget);
    setIsPasting(false);
    setPasteText('');
  }, [pasteText, pastingTarget, setDocA, setDocB]);

  const loadSample = useCallback((sample) => {
    // If A is empty, load into A. Otherwise load into B.
    const isDocB = docA.text ? true : false;
    const setDoc = isDocB ? setDocB : setDocA;
    setDoc({ name: sample.name, text: sample.text, type: sample.type || 'text/plain' });
    setActivePreview(isDocB ? 'B' : 'A');
    setShowSamples(false);
  }, [docA.text, setDocA, setDocB]);

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
      <div className="doc-preview-content" tabIndex={0} aria-label={`Previewing Document ${activePreview}`}>
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
            <button className="icon-btn" onClick={onClose} aria-label="Close sidebar" style={{ padding: '4px' }} type="button">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-content" style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {isPasting ? (
          <div className="paste-ui">
            <div className="doc-slot-title" style={{ marginBottom: '12px' }}>Paste Document {pastingTarget}</div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your legal text here..."
              aria-label={`Paste text for Document ${pastingTarget}`}
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
                type="button"
                style={{ flex: 1, padding: '8px', background: 'var(--navy)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Save
              </button>
              <button 
                onClick={() => setIsPasting(false)}
                type="button"
                style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <DocumentSlot 
              title="Document A"
              doc={docA}
              setDoc={setDocA}
              fileInputRef={fileInputARef}
              targetStr="A"
              activePreview={activePreview}
              setActivePreview={setActivePreview}
              handleFileUpload={handleFileUpload}
              handlePasteClick={handlePasteClick}
            />
            <DocumentSlot 
              title="Document B"
              doc={docB}
              setDoc={setDocB}
              fileInputRef={fileInputBRef}
              targetStr="B"
              activePreview={activePreview}
              setActivePreview={setActivePreview}
              handleFileUpload={handleFileUpload}
              handlePasteClick={handlePasteClick}
            />
          </>
        )}
      </div>

      {/* Fixed Sample Documents Section */}
      {!isPasting && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Or try a sample</span>
            <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SAMPLE_DOCS.map((sample, idx) => (
              <button 
                key={idx} 
                onClick={() => loadSample(sample)}
                type="button"
                aria-label={`Load sample: ${sample.name}`}
                style={{
                  background: 'var(--off-white)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all var(--t-fast)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.borderColor = 'var(--accent-border)'; 
                  e.currentTarget.style.background = 'var(--accent-subtle)'; 
                  e.currentTarget.style.color = 'var(--accent)'; 
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.08)';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.borderColor = 'var(--border)'; 
                  e.currentTarget.style.background = 'var(--off-white)'; 
                  e.currentTarget.style.color = 'var(--text)'; 
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ background: 'var(--bg)', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <FileText size={16} />
                </div>
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="doc-preview-area" id="doc-preview-area" aria-label="Document preview" aria-live="polite" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        {renderDocumentPreview()}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  docA: PropTypes.shape({
    name: PropTypes.string,
    text: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  docB: PropTypes.shape({
    name: PropTypes.string,
    text: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  setDocA: PropTypes.func.isRequired,
  setDocB: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func
};
