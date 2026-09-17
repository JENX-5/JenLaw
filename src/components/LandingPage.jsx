import React from 'react';

export default function LandingPage({ onOpenApp }) {
  return (
    <div id="landing">
      {/* Navigation */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <a href="#" className="nav-logo" aria-label="JenLaw home">
          <div className="nav-logo-mark" aria-hidden="true"><img src="/jenlaw_logo.jpg" alt="JenLaw Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <span className="nav-logo-text">JenLaw</span>
        </a>

        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#landing-disclaimer">Disclaimer</a></li>
        </ul>

        <button className="btn-nav" onClick={onOpenApp} id="nav-open-btn">
          Open App →
        </button>
      </nav>

      {/* Hero */}
      <section className="hero" id="hero" aria-labelledby="hero-title">
        <div className="hero-eyebrow" aria-label="AI-powered legal clarity">
          AI-powered legal clarity
        </div>

        <h1 className="hero-title" id="hero-title">
          Understand Legal Documents<br />with Confidence
        </h1>

        <p className="hero-subtitle">
          Upload contracts, agreements, and policies to receive clear explanations,
          important attention points, and document-grounded answers.
        </p>

        {/* CTA buttons */}
        <div className="hero-actions" style={{marginTop: '2rem'}}>
          <button className="btn-primary" onClick={onOpenApp} style={{fontSize: '1.1rem', padding: '0.75rem 1.5rem'}}>
            Get Started
          </button>
        </div>

        {/* Feature cards */}
        <div className="feature-cards" id="features" role="list">
          <div className="feature-card" role="listitem">
            <div className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Understand</h3>
            <p>Get a comprehensive document summary, so you know exactly what you're agreeing to.</p>
          </div>

          <div className="feature-card" role="listitem">
            <div className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
            <h3>Attention Points</h3>
            <p>Highlight obligations, deadlines, financial commitments, and clauses that deserve careful review.</p>
          </div>

          <div className="feature-card" role="listitem">
            <div className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Ask Questions</h3>
            <p>Ask any document-specific question and get grounded answers drawn directly from the document text.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="landing-disclaimer" id="landing-disclaimer" role="note" aria-label="Legal disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>
          <strong>Important:</strong> JenLaw provides legal <em>information</em>, not legal <em>advice</em>. Nothing produced by JenLaw constitutes professional legal advice or replaces a qualified lawyer. Always consult a licensed legal professional for decisions that could materially affect your rights.
        </p>
      </div>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo">
        <a href="#" className="footer-logo" aria-label="JenLaw">
          <div className="footer-logo-mark"><img src="/jenlaw_logo.jpg" alt="JenLaw Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <span>JenLaw</span>
        </a>
        <p className="footer-copy">© 2026 JenLaw · Legal information only — not legal advice.</p>
      </footer>
    </div>
  );
}
