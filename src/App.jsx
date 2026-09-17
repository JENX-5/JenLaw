import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import QuickActions from './components/QuickActions';
import ChatArea from './components/ChatArea';
import { useGeminiChat } from './hooks/useGeminiChat';
import './styles.css';

const ROLES = [
  'Not specified',
  'Employee',
  'Employer',
  'Contractor',
  'Client / Customer',
  'Landlord',
  'Tenant',
  'Buyer',
  'Seller',
  'Licensor',
  'Licensee',
  'Lender',
  'Borrower'
];

export default function App() {
  const [view, setView] = useState('landing');
  
  // Store two documents
  const [docA, setDocA] = useState({ name: '', text: '', type: '' });
  const [docB, setDocB] = useState({ name: '', text: '', type: '' });

  const [currentRole, setCurrentRole] = useState('Not specified');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize custom hook
  const { 
    conversationHistory, 
    isLoading, 
    handleRunAction, 
    handleSendMessage, 
    clearHistory 
  } = useGeminiChat({ docA, docB, currentRole });

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleResizeKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSidebarWidth(w => Math.max(200, w - 20));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSidebarWidth(w => Math.min(600, w + 20));
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.classList.add('resizing');
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('resizing');
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('resizing');
    };
  }, [isResizing, resize, stopResizing]);

  if (view === 'landing') {
    return <LandingPage onOpenApp={() => setView('app')} />;
  }

  return (
    <div id="app" role="main" className="app-layout-modern" style={{ '--sidebar-width': `${sidebarWidth}px` }}>
      <Sidebar 
        docA={docA}
        docB={docB}
        setDocA={setDocA}
        setDocB={setDocB}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div 
          className={`resize-handle ${isResizing ? 'dragging' : ''}`}
          onMouseDown={startResizing}
          onKeyDown={handleResizeKeyDown}
          title="Drag or use arrow keys to resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Sidebar resizer"
          tabIndex={0}
        />
      )}
      
      <div className="main-content">
        <header className="chat-header">
          <div className="chat-header-left">
            {!isSidebarOpen && (
              <button className="icon-btn" onClick={() => setIsSidebarOpen(true)} title="Open sidebar" aria-label="Open sidebar">
                ◧
              </button>
            )}
            <span className="doc-title-display">
              {docB.text 
                ? `${docA.name || 'Doc A'} vs ${docB.name || 'Doc B'}` 
                : (docA.name || 'JenLaw AI')}
            </span>
          </div>

          <div className="chat-header-right">
            <button 
              className="theme-toggle-btn" 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="role-pill-modern">
              <select 
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                aria-label="Your role"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="icon-btn" onClick={clearHistory} title="Clear conversation" aria-label="Clear conversation">
              ↺
            </button>
          </div>
        </header>

        <ChatArea 
          messages={conversationHistory}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        >
          <QuickActions 
            onRunAction={handleRunAction} 
            hasDocument={!!docA.text}
            hasTwoDocuments={!!docA.text && !!docB.text}
          />
        </ChatArea>
      </div>
    </div>
  );
}
