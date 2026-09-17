// ── UI: Document Preview ─────────────────────────────────────────────────
function renderDocPreview() {
  const previewArea = el('doc-preview-area');

  if (!state.documentText) {
    previewArea.innerHTML = `
      <div class="doc-empty">
        <div class="doc-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p>No document loaded.<br>Upload a PDF or paste text to get started.</p>
      </div>`;
    return;
  }

  const shortName = state.documentName.length > 38
    ? state.documentName.slice(0, 35) + '...'
    : state.documentName;

  const preview = state.documentText.slice(0, state.previewExpanded ? 5000 : 500);
  const hasMore = state.documentText.length > 500;
  const sizeKb = (state.documentText.length / 1000).toFixed(1);

  previewArea.innerHTML = `
    <div class="doc-meta-card">
      <div class="doc-meta-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span class="doc-meta-card-name">${escapeHtml(shortName)}</span>
      </div>
      <div class="doc-meta-card-body">
        <span class="doc-tag doc-tag-green">✓ Loaded</span>
        <span class="doc-tag doc-tag-navy">${escapeHtml(state.documentType)}</span>
        <span class="doc-tag doc-tag-warm">${sizeKb}k chars</span>
      </div>
    </div>
    <div class="doc-preview-text" id="doc-preview-text">${escapeHtml(preview)}${state.previewExpanded ? '' : (hasMore ? '…' : '')}</div>
    ${hasMore ? `<button class="doc-preview-toggle" onclick="togglePreview()">${state.previewExpanded ? '▲ Show less' : '▼ Show more'}</button>` : ''}
    <button class="btn-remove-doc" onclick="confirmClear()">✕ Remove document</button>
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function togglePreview() {
  state.previewExpanded = !state.previewExpanded;
  renderDocPreview();
}

function confirmClear() {
  if (confirm('Remove this document and clear the conversation?')) clearDocument();
}

function updateDocTitleDisplay() {
  const display = el('doc-title-display');
  display.textContent = state.documentName
    ? `📄 ${state.documentName}`
    : 'No document loaded';
}

// ── UI: Chat ────────────────────────────────────────────────────────
function renderChatWelcome() {
  const container = el('chat-messages');
  container.innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-mark" aria-hidden="true">J</div>
      <h2>Welcome to JenLaw</h2>
      <p>Upload or paste your legal document in the left panel, then ask me anything — or use the Quick Actions toolbar above.</p>
      <div class="chat-welcome-hints">
        ${HINT_MESSAGES.map(hint => `<button class="hint-chip" onclick="sendMessage(${JSON.stringify(hint)})">${hint}</button>`).join('')}
      </div>
    </div>`;
}

function clearChat() {
  state.conversationHistory = [];
  renderChatWelcome();
}

function appendMessage(role, content, isLoading = false) {
  const container = el('chat-messages');

  // Remove welcome screen on first message
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.id = id;

  if (isLoading) {
    div.innerHTML = `
      <div class="msg-avatar ai">J</div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
  } else if (role === 'ai') {
    div.innerHTML = `
      <div class="msg-avatar ai">J</div>
      <div class="msg-content">
        <div class="msg-bubble">${renderMarkdown(content)}</div>
        <div class="msg-time">${formatTime(new Date())}</div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-avatar user">U</div>
      <div class="msg-content">
        <div class="msg-bubble">${escapeHtml(content)}</div>
        <div class="msg-time">${formatTime(new Date())}</div>
      </div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeMessage(id) {
  const el_msg = document.getElementById(id);
  if (el_msg) el_msg.remove();
}

function updateMessageContent(id, content) {
  const msg = document.getElementById(id);
  if (!msg) return;
  msg.innerHTML = `
    <div class="msg-avatar ai">J</div>
    <div class="msg-content">
      <div class="msg-bubble">${renderMarkdown(content)}</div>
      <div class="msg-time">${formatTime(new Date())}</div>
    </div>`;
  el('chat-messages').scrollTop = el('chat-messages').scrollHeight;
}

async function sendMessage(text) {
  if (state.isLoading) return;
  const userMsg = (text || el('chat-input').value).trim();
  if (!userMsg) return;

  el('chat-input').value = '';
  autoResizeTextarea(el('chat-input'));
  el('send-btn').disabled = true;
  state.isLoading = true;

  // Add user message
  appendMessage('user', userMsg);
  state.conversationHistory.push({ role: 'user', content: userMsg });

  // Show typing indicator
  const loadingId = appendMessage('ai', '', true);

  try {
    let responseText;
    if (state.apiKey) {
      if (state.documentText) {
        // Use the strict structured QA prompt for document questions
        const filledPrompt = QA_PROMPT
          .replace('{DOCUMENT_TEXT}', state.documentText.slice(0, 50000))
          .replace('{USER_ROLE}', state.currentRole)
          .replace('{QUESTION}', userMsg);
        responseText = await callGeminiRaw(filledPrompt);
      } else {
        // Fallback to conversational mode if no document is loaded
        responseText = await callGemini(userMsg);
      }
    } else {
      // Demo mode: simulate a short delay
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      responseText = getDemoResponse(userMsg);
    }

    removeMessage(loadingId);
    appendMessage('ai', responseText);
    state.conversationHistory.push({ role: 'model', content: responseText });

  } catch (err) {
    removeMessage(loadingId);
    appendMessage('ai', `## ⚠️ Error\n\n${err.message}\n\nPlease check your API key in ⚙️ Settings and try again.`);
  } finally {
    state.isLoading = false;
    el('send-btn').disabled = false;
    el('chat-input').focus();
  }
}

// ── Extract Panel Renderer ────────────────────────────────────────────────
function renderExtractSection(title, icon, items, renderFn) {
  if (!items || !items.length) return '';
  // Filter out trivially empty items
  const meaningful = items.filter(i => {
    const vals = Object.values(i).join(' ');
    return vals && !vals.match(/^(Not specified\s*)+$/);
  });
  if (!meaningful.length) return '';

  return `
    <div class="extract-section">
      <div class="extract-section-header">
        <span class="extract-section-icon">${icon}</span>
        <span class="extract-section-title">${title}</span>
      </div>
      <div class="extract-section-body">
        ${meaningful.map(renderFn).join('')}
      </div>
    </div>`;
}

function srcBadge(source) {
  if (!source || source === 'Not specified') return '';
  return `<span class="extract-source-badge">${escapeHtml(source)}</span>`;
}

function renderExtractPanel(data) {
  const container = el('chat-messages');

  const div = document.createElement('div');
  div.className = 'extract-panel msg ai';
  div.setAttribute('role', 'region');
  div.setAttribute('aria-label', 'Deep Extract results');

  // ── Build each section ─────────────────────────────────────────────────
  const docInfoSection = `
    <div class="extract-section extract-doc-info">
      <div class="extract-section-header">
        <span class="extract-section-icon">📄</span>
        <span class="extract-section-title">Document Information</span>
        <span class="extract-doc-type-badge">${escapeHtml(data.document_type || 'Legal Document')}</span>
      </div>
      <div class="extract-doc-grid">
        ${data.document_title && data.document_title !== 'Not specified' ? `<div class="extract-doc-cell"><div class="extract-doc-cell-label">Title</div><div class="extract-doc-cell-value">${escapeHtml(data.document_title)}</div></div>` : ''}
        ${data.purpose && data.purpose !== 'Not specified' ? `<div class="extract-doc-cell extract-doc-cell-wide"><div class="extract-doc-cell-label">Purpose</div><div class="extract-doc-cell-value">${escapeHtml(data.purpose)}</div></div>` : ''}
        ${data.effective_date && data.effective_date !== 'Not specified' ? `<div class="extract-doc-cell"><div class="extract-doc-cell-label">Effective Date</div><div class="extract-doc-cell-value">${escapeHtml(data.effective_date)}</div></div>` : ''}
        ${data.expiration_date && data.expiration_date !== 'Not specified' ? `<div class="extract-doc-cell"><div class="extract-doc-cell-label">Expiration Date</div><div class="extract-doc-cell-value">${escapeHtml(data.expiration_date)}</div></div>` : ''}
        ${data.duration && data.duration !== 'Not specified' ? `<div class="extract-doc-cell"><div class="extract-doc-cell-label">Duration</div><div class="extract-doc-cell-value">${escapeHtml(data.duration)}</div></div>` : ''}
        ${data.jurisdiction && data.jurisdiction !== 'Not specified' ? `<div class="extract-doc-cell"><div class="extract-doc-cell-label">Jurisdiction</div><div class="extract-doc-cell-value">${escapeHtml(data.jurisdiction)}</div></div>` : ''}
      </div>
    </div>`;

  const partiesSection = renderExtractSection('Parties', '👥', data.parties, p => `
    <div class="extract-item extract-party">
      <div class="extract-party-header">
        <strong>${escapeHtml(p.name || 'Unknown')}</strong>
        <span class="extract-role-pill">${escapeHtml(p.role || '')}</span>
        ${srcBadge(p.source)}
      </div>
      ${p.responsibilities && p.responsibilities !== 'Not specified' ? `<div class="extract-item-detail">${escapeHtml(p.responsibilities)}</div>` : ''}
    </div>`);

  const financialSection = renderExtractSection('Financial Terms', '💰', data.financial_terms, f => `
    <div class="extract-item">
      <div class="extract-item-row">
        <span class="extract-item-label">${escapeHtml(f.item || '')}</span>
        ${srcBadge(f.source)}
      </div>
      <div class="extract-item-detail">${escapeHtml(f.detail || '')}</div>
    </div>`);

  const makeObligationList = (items, title, colorClass) => {
    if (!items || !items.length) return '';
    const meaningful = items.filter(i => i.obligation && i.obligation !== 'Not specified');
    if (!meaningful.length) return '';
    return `<div class="extract-obligation-group">
      <div class="extract-obligation-group-title ${colorClass}">${title}</div>
      ${meaningful.map(o => `
        <div class="extract-obligation-item">
          <span class="extract-obligation-bullet">›</span>
          <span>${escapeHtml(o.obligation)}</span>
          ${srcBadge(o.source)}
        </div>`).join('')}
    </div>`;
  };

  const obligationsHTML = [
    makeObligationList(data.user_obligations, `My Obligations (${state.currentRole !== 'Not specified' ? state.currentRole : 'User'})`, 'obl-user'),
    makeObligationList(data.other_party_obligations, 'Other Party\'s Obligations', 'obl-other'),
    makeObligationList(data.shared_obligations, 'Shared Obligations', 'obl-shared'),
  ].join('');

  const obligationsSection = obligationsHTML ? `
    <div class="extract-section">
      <div class="extract-section-header">
        <span class="extract-section-icon">✅</span>
        <span class="extract-section-title">Obligations</span>
      </div>
      <div class="extract-section-body">${obligationsHTML}</div>
    </div>` : '';

  const datesSection = renderExtractSection('Key Dates & Deadlines', '📅', data.important_dates, d => `
    <div class="extract-item extract-date-item">
      <div class="extract-date-label">${escapeHtml(d.label || '')}</div>
      <div class="extract-date-value">${escapeHtml(d.date || 'Not specified')}</div>
      ${srcBadge(d.source)}
    </div>`);

  const terminationSection = renderExtractSection('Termination', '🔚', data.termination_terms, t => `
    <div class="extract-item">
      <div class="extract-item-row">
        <span class="extract-item-label">${escapeHtml(t.item || '')}</span>
        ${srcBadge(t.source)}
      </div>
      <div class="extract-item-detail">${escapeHtml(t.detail || '')}</div>
    </div>`);

  const liabilitySection = renderExtractSection('Liability & Protection', '🛡️', data.liability_terms, l => `
    <div class="extract-item">
      <div class="extract-item-row">
        <span class="extract-item-label">${escapeHtml(l.item || '')}</span>
        ${srcBadge(l.source)}
      </div>
      <div class="extract-item-detail">${escapeHtml(l.detail || '')}</div>
    </div>`);

  const restrictionsSection = renderExtractSection('Restrictions', '🔒', data.restrictions, r => `
    <div class="extract-item">
      <div class="extract-item-row">
        <span class="extract-restriction-type">${escapeHtml(r.type || '')}</span>
        ${srcBadge(r.source)}
      </div>
      <div class="extract-item-detail">${escapeHtml(r.detail || '')}</div>
    </div>`);

  const disputesSection = renderExtractSection('Disputes', '⚖️', data.dispute_terms, d => `
    <div class="extract-item">
      <div class="extract-item-row">
        <span class="extract-item-label">${escapeHtml(d.item || '')}</span>
        ${srcBadge(d.source)}
      </div>
      <div class="extract-item-detail">${escapeHtml(d.detail || '')}</div>
    </div>`);

  const importantSection = data.important_provisions && data.important_provisions.length
    ? `<div class="extract-section extract-important">
        <div class="extract-section-header">
          <span class="extract-section-icon">🚨</span>
          <span class="extract-section-title">Unusual & Important Provisions</span>
        </div>
        <div class="extract-section-body">
          ${data.important_provisions.filter(p => p.title && p.title !== 'Not specified').map(p => `
            <div class="extract-item extract-flag">
              <div class="extract-flag-title">${escapeHtml(p.title || '')}</div>
              <div class="extract-item-detail">${escapeHtml(p.detail || '')}</div>
              ${p.reason && p.reason !== 'Not specified' ? `<div class="extract-flag-reason">💡 ${escapeHtml(p.reason)}</div>` : ''}
              ${srcBadge(p.source)}
            </div>`).join('')}
        </div>
      </div>` : '';

  const disclaimer = `
    <div class="extract-disclaimer">
      ⚠️ <strong>Legal information only — not legal advice.</strong>
      This structured extract is based solely on the document text provided.
      Source locations are as indicated in the document; always verify against the original.
      Consult a qualified legal professional before making decisions based on this analysis.
    </div>`;

  // ── Export button ──────────────────────────────────────────────────────
  const exportBtn = `
    <div class="extract-actions">
      <button class="extract-action-btn" onclick="exportExtractJSON()" id="export-json-btn">
        ⬇️ Export JSON
      </button>
      <button class="extract-action-btn" onclick="copyExtractText()" id="copy-extract-btn">
        📋 Copy as Text
      </button>
    </div>`;

  // Store data for export
  state.lastExtract = data;

  div.innerHTML = `
    <div class="extract-panel-inner">
      <div class="extract-panel-header">
        <div class="extract-panel-title">
          <span class="extract-panel-icon">🔍</span>
          Deep Extract — Structured Analysis
        </div>
        <div class="extract-panel-meta">
          ${escapeHtml(data.document_type || 'Legal Document')}
          ${state.documentName ? ' · ' + escapeHtml(state.documentName) : ''}
        </div>
        ${exportBtn}
      </div>
      ${docInfoSection}
      ${partiesSection}
      ${financialSection}
      ${obligationsSection}
      ${datesSection}
      ${terminationSection}
      ${liabilitySection}
      ${restrictionsSection}
      ${disputesSection}
      ${importantSection}
      ${disclaimer}
    </div>`;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  div.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Paste modal ──────────────────────────────────────────────────────────
function openPasteModal() {
  el('paste-modal').classList.remove('hidden');
  el('paste-textarea').value = '';
  el('paste-textarea').focus();
}

function closePasteModal() {
  el('paste-modal').classList.add('hidden');
}

function submitPastedText() {
  const text = el('paste-textarea').value.trim();
  if (!text) { showToast('Please paste some text first.', 'error'); return; }
  loadDocument(text, 'Pasted Document');
  closePasteModal();
}

// ── Settings modal ───────────────────────────────────────────────────────
function openSettingsModal() {
  el('api-key-input').value = state.apiKey;
  el('model-select').value = state.apiModel;
  el('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  el('settings-modal').classList.add('hidden');
}

function saveSettings() {
  const key = el('api-key-input').value.trim();
  const model = el('model-select').value;
  state.apiKey = key;
  state.apiModel = model;
  localStorage.setItem('jenlaw_api_key', key);
  closeSettingsModal();
  showToast(key ? '✅ API key saved!' : 'Settings saved (demo mode)', 'success');
}

// ── View navigation ──────────────────────────────────────────────────────
function showApp() {
  el('landing').classList.add('hidden');
  el('app').classList.remove('hidden');
  state.view = 'app';
  renderChatWelcome();
  el('chat-input').focus();
}

function showLanding() {
  el('app').classList.add('hidden');
  el('landing').classList.remove('hidden');
  state.view = 'landing';
}

// ── Sidebar toggle ───────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = el('sidebar');
  sidebar.classList.toggle('collapsed');
  el('sidebar-toggle-btn').title = sidebar.classList.contains('collapsed') ? 'Show document panel' : 'Hide document panel';
}
