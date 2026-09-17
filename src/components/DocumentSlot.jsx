import React from 'react';
import PropTypes from 'prop-types';
import { FileUp, Trash2, Edit3, CheckCircle2 } from 'lucide-react';

export default function DocumentSlot({
  title,
  doc,
  setDoc,
  fileInputRef,
  targetStr,
  activePreview,
  setActivePreview,
  handleFileUpload,
  handlePasteClick
}) {
  const isLoaded = !!doc.text;
  const isActive = activePreview === targetStr && isLoaded;

  if (!isLoaded) {
    return (
      <div className="doc-slot">
        <div className="doc-slot-header">
          <span className="doc-slot-title">{title}</span>
        </div>
        <button 
          className="doc-slot-empty" 
          onClick={() => fileInputRef.current?.click()}
          aria-label={`Upload ${title}`}
          type="button"
        >
           <FileUp size={24} className="doc-slot-empty-icon" />
           <div className="doc-slot-empty-text">Upload {title}</div>
           <div className="doc-slot-empty-hint">PDF, TXT, MD</div>
        </button>
        <div className="doc-slot-actions">
          <button className="btn-slot-action" onClick={() => handlePasteClick(targetStr)} aria-label={`Paste text for ${title}`} type="button">
            <Edit3 size={14} /> Paste Text
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e, targetStr === 'B')}
            style={{display: 'none'}}
            accept=".pdf,.txt,.md,text/plain,application/pdf" 
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
    );
  }

  return (
    <button 
      className="doc-slot" 
      style={{ 
        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
        boxShadow: isActive ? '0 0 0 1px var(--accent-subtle)' : 'none',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'block',
        width: '100%',
        padding: 0
      }} 
      onClick={() => setActivePreview(targetStr)}
      aria-label={`Preview ${title}: ${doc.name || 'Untitled Document'}`}
      type="button"
    >
      <div style={{ padding: '12px' }}>
        <div className="doc-slot-header">
          <span className="doc-slot-title">{title}</span>
          <CheckCircle2 size={16} color="var(--green)" />
        </div>
        <div className="doc-slot-loaded">
          <div className="doc-slot-filename">{doc.name || 'Untitled Document'}</div>
          <div className="doc-slot-meta">{Math.round(doc.text.length / 1000)}k chars</div>
        </div>
        <div className="doc-slot-actions">
          <button 
            className="btn-slot-action" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setDoc({ name: '', text: '', type: '' }); 
              if(activePreview === targetStr) {
                setActivePreview(targetStr === 'A' ? 'B' : 'A');
              }
            }}
            aria-label={`Remove ${title}`}
            type="button"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </button>
  );
}

DocumentSlot.propTypes = {
  title: PropTypes.string.isRequired,
  doc: PropTypes.shape({
    name: PropTypes.string,
    text: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  setDoc: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  targetStr: PropTypes.string.isRequired,
  activePreview: PropTypes.string.isRequired,
  setActivePreview: PropTypes.func.isRequired,
  handleFileUpload: PropTypes.func.isRequired,
  handlePasteClick: PropTypes.func.isRequired
};
