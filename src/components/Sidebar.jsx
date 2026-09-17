import React, { useRef, useState } from 'react';
import { extractTextFromPDF } from '../lib/utils';
import { SAMPLE_DOCS } from '../lib/sampleDocs';
import { FileUp, FilePlus, FileText } from 'lucide-react';

export default function Sidebar({ docA, docB, setDocA, setDocB, isSidebarOpen, onClose }) {
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('A'); // 'A' or 'B'
  
  // State for manual paste UI
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pastingTarget, setPastingTarget] = useState('A');

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
        setActiveTab('B');
      } else {
        setDocA(newDoc);
        setActiveTab('A');
      }
    } catch (err) {
      alert(`Error reading document: ${err.message}`);
    }
    // reset input
    e.target.value = '';
  };

  const handlePasteClick = (isDocB) => {
    setPastingTarget(isDocB ? 'B' : 'A');
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
    setActiveTab(pastingTarget);
    setIsPasting(false);
    setPasteText('');
  };

  const loadSample = (sample, isDocB) => {
    const setDoc = isDocB ? setDocB : setDocA;
    setDoc({ name: sample.name, text: sample.text, type: sample.type || 'text/plain' });
    setActiveTab(isDocB ? 'B' : 'A');
  };

  const renderDocumentPreview = () => {
    const activeDoc = activeTab === 'A' ? docA : docB;
    
    if (!activeDoc.text) {
      return (
        <div className="doc-preview-empty" style={{marginTop: '2rem'}}>
          <p>No document loaded.</p>
          <p style={{fontSize:'0.85rem', color:'var(--text-lighter)', marginTop:'0.5rem'}}>
            Upload a PDF, TXT, or Markdown file to see it here.
          </p>
        </div>
      );
    }
    
    return (
      <div className="doc-preview-content">
        <div className="doc-preview-meta">
          <span className="meta-badge" style={{color: 'var(--accent)', backgroundColor: '#E5F3EE', border: '1px solid #C3E6DB'}}>
            ✓ Loaded
          </span>
          <span className="meta-badge" style={{ fontWeight: '500' }}>
            Document {activeTab}
          </span>
          <span className="meta-badge" style={{color: 'var(--text-light)', border: '1px solid var(--border)'}}>
            {Math.round(activeDoc.text.length / 1000)}k chars
          </span>
        </div>
        <div style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem', fontWeight: 500 }}>
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
            <div className="sidebar-header-title">Paste Document {pastingTarget}</div>
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
            {/* Only show the large upload box if Doc A isn't loaded */}
            {!docA.text && (
              <>
                <div className="sidebar-header-title">Document</div>
                <div className="sidebar-upload" role="button" tabIndex="0" aria-label="Upload document A" onClick={() => fileInputARef.current?.click()}>
                  <input 
                    type="file" 
                    ref={fileInputARef}
                    onChange={(e) => handleFileUpload(e, false)}
                    style={{display: 'none'}}
                    accept=".pdf,.txt,.md,text/plain,application/pdf" 
                    aria-label="Choose file" 
                  />
                  <FileUp size={24} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                  <div className="sidebar-upload-text">Drop PDF or click to upload</div>
                  <div className="sidebar-upload-hint">PDF, TXT, MD</div>
                </div>

                <div className="sidebar-upload-sep">— or —</div>

                <button className="btn-paste" onClick={() => handlePasteClick(false)} id="paste-btn" aria-label="Paste document text">
                  ⎘ &nbsp;Paste Text
                </button>
                
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Or try a sample</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {SAMPLE_DOCS.map((sample, idx) => (
                      <button key={idx} className="btn-sample" onClick={() => loadSample(sample, false)}>
                        <FileText size={14} style={{ marginRight: '6px' }} />
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
        {docA.text && (
          <div className="sidebar-doc-manager" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <button 
                onClick={() => setActiveTab('A')}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  border: 'none', 
                  background: activeTab === 'A' ? 'var(--bg-light)' : 'transparent',
                  fontWeight: activeTab === 'A' ? 600 : 400,
                  color: activeTab === 'A' ? 'var(--text)' : 'var(--text-light)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Doc A
              </button>
              <button 
                onClick={() => setActiveTab('B')}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  border: 'none', 
                  background: activeTab === 'B' ? 'var(--bg-light)' : 'transparent',
                  fontWeight: activeTab === 'B' ? 600 : 400,
                  color: activeTab === 'B' ? 'var(--text)' : 'var(--text-light)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Doc B
              </button>
            </div>

            {/* Quick action to replace current tab document */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem' }}>
               <input 
                  type="file" 
                  ref={activeTab === 'A' ? fileInputARef : fileInputBRef}
                  onChange={(e) => handleFileUpload(e, activeTab === 'B')}
                  style={{display: 'none'}}
                  accept=".pdf,.txt,.md,text/plain,application/pdf" 
                />
               <button 
                 onClick={() => activeTab === 'A' ? fileInputARef.current?.click() : fileInputBRef.current?.click()}
                 className="btn-paste" 
                 style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
               >
                 <FileUp size={14} /> Upload {activeTab === 'A' ? (docA.text ? 'New A' : 'A') : (docB.text ? 'New B' : 'B')}
               </button>
               <button 
                 onClick={() => handlePasteClick(activeTab === 'B')}
                 className="btn-paste" 
                 style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
               >
                 ⎘ Paste {activeTab === 'A' ? (docA.text ? 'New A' : 'A') : (docB.text ? 'New B' : 'B')}
               </button>
            </div>
            
          </div>
        )}
        </>
        )}
      </div>

      <div className="doc-preview-area" id="doc-preview-area" aria-label="Document preview" aria-live="polite" style={{ marginTop: '0.5rem' }}>
        {renderDocumentPreview()}
      </div>
    </aside>
  );
}
