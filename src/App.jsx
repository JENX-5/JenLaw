import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import QuickActions from './components/QuickActions';
import ChatArea from './components/ChatArea';
import { callGemini, callGeminiRaw } from './lib/gemini';
import { QA_PROMPT } from './lib/prompts';
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
  
  // NEW: Store two documents
  const [docA, setDocA] = useState({ name: '', text: '', type: '' });
  const [docB, setDocB] = useState({ name: '', text: '', type: '' });

  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState('Not specified');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Quick Action Handler
  const handleRunAction = async (label, template) => {
    if (isLoading) return;
    
    // For actions requiring two documents (like Compare)
    if (template.includes('{DOCUMENT_B}') && (!docA.text || !docB.text)) {
      alert("This action requires both Document A and Document B to be loaded.");
      return;
    }

    setConversationHistory(prev => [...prev, {
      id: Date.now().toString() + '-' + Math.random(),
      role: 'user',
      content: `> **Action triggered:** ${label}`,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      let finalTemplate = template;
      
      if (finalTemplate.includes('{SCENARIO}')) {
        const scenarioText = window.prompt("Describe the hypothetical scenario you want to test against this document:");
        if (!scenarioText || !scenarioText.trim()) {
          setIsLoading(false);
          return;
        }
        finalTemplate = finalTemplate.replace(/\{SCENARIO\}/g, scenarioText);
      }

      // Inject documents
      const filledPrompt = finalTemplate
        .replace(/\{DOCUMENT_TEXT\}/g, docA.text.slice(0, 50000))
        .replace(/\{DOCUMENT_A\}/g, docA.text.slice(0, 50000))
        .replace(/\{DOCUMENT_B\}/g, docB.text ? docB.text.slice(0, 50000) : '')
        .replace(/\{USER_ROLE\}/g, currentRole);

      let responseText = null;
      let retries = 0;
      while (retries <= 2) {
        try {
          responseText = await callGeminiRaw({
            fullPrompt: filledPrompt
          });
          break;
        } catch (error) {
          retries++;
          if (retries > 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setConversationHistory(prev => [...prev, {
        id: Date.now().toString() + '-' + Math.random(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("API Error in handleRunAction:", error);
      setConversationHistory(prev => [...prev, {
        id: Date.now().toString() + '-' + Math.random(),
        role: 'model',
        content: `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // General Chat Handler (QA_PROMPT fallback)
  const handleSendMessage = async (text) => {
    if (isLoading) return;
    
    setConversationHistory(prev => [...prev, {
      id: Date.now().toString() + '-' + Math.random(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      let responseText = null;
      let retries = 0;
      
      while (retries <= 2) {
        try {
          if (docA.text && !docB.text) {
            // Use QA format for single document
            const filledPrompt = QA_PROMPT
              .replace(/\{DOCUMENT_TEXT\}/g, docA.text.slice(0, 50000))
              .replace(/\{USER_ROLE\}/g, currentRole)
              .replace(/\{QUESTION\}/g, text);
            
            responseText = await callGeminiRaw({ fullPrompt: filledPrompt });
          } else {
            // Conversational fallback (handles multi-doc or no doc scenarios)
            let combinedDocs = '';
            if (docA.text) combinedDocs += `DOCUMENT A:\n${docA.text.slice(0, 40000)}\n\n`;
            if (docB.text) combinedDocs += `DOCUMENT B:\n${docB.text.slice(0, 40000)}\n\n`;
            
            responseText = await callGemini({
              userMessage: text,
              documentText: combinedDocs,
              currentRole,
              conversationHistory
            });
          }
          break; // Success
        } catch (error) {
          retries++;
          if (retries > 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setConversationHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("API Error in handleSendMessage:", error);
      setConversationHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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
          title="Drag to resize"
        />
      )}
      
      <div className="main-content">
        <header className="chat-header">
          <div className="chat-header-left">
            {!isSidebarOpen && (
              <button className="icon-btn" onClick={() => setIsSidebarOpen(true)} title="Open sidebar">
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
            <button className="icon-btn" onClick={() => setConversationHistory([])} title="Clear conversation">
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
