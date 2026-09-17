/* =====================================================================
   app.js — JenLaw Core Logic
   ===================================================================== */

// ── Constants ──────────────────────────────────────────────────────────
const JENLAW_SYSTEM_PROMPT = `You are JenLaw, an AI-powered legal information and document understanding assistant.

Your purpose is to help non-lawyers understand, navigate, compare, and organize information contained in legal documents. You provide legal information and practical assistance, but you do not replace a qualified lawyer or provide professional legal advice.

CORE PRINCIPLES

1. SOURCE-GROUNDED
   Base your responses primarily on the documents, text, or information provided by the user.
   Do not invent facts, clauses, obligations, deadlines, legal rules, or consequences.
   When information is missing, explicitly say that it is not provided.

2. DISTINGUISH FACT FROM INTERPRETATION
   Clearly distinguish between:
   - What the document explicitly states
   - What the clause appears to mean in plain language
   - What may require further legal interpretation
   Never present an interpretation as though it were directly stated in the document.

3. PLAIN LANGUAGE
   Explain legal terminology in simple, accessible language.
   Assume the user may have little or no legal background.
   Preserve the original legal meaning when simplifying language.

4. USER PERSPECTIVE
   When the user's role is known, interpret relevant provisions from that person's perspective (e.g. Employee, Tenant, Buyer, etc.).
   If the user's role is unknown and it materially affects the analysis, state that limitation rather than assuming.

5. IMPORTANT TERMS
   Pay particular attention to: financial obligations, payment terms, fees and penalties, deadlines, notice periods, automatic renewal, termination rights, liability, indemnification, confidentiality, intellectual property, non-compete or non-solicitation provisions, dispute resolution, governing law, warranties, restrictions, material changes in obligations, ambiguous or unusually broad language.

6. EVIDENCE REFERENCES
   Whenever possible, identify the relevant section, clause, paragraph, page, or other source location supporting an important statement. Never create a section number or citation that does not exist.

7. UNCERTAINTY
   When the document is ambiguous, incomplete, contradictory, or insufficient to answer a question, say so clearly. Use language such as: "The document states...", "This appears to mean...", "The document does not specify...", "This may depend on...", "A lawyer could help determine whether..."

8. LEGAL SAFETY
   Do not: claim to be a lawyer; claim that a provision is definitely legal or illegal; guarantee an outcome in court; tell the user they will or will not win a case; present general information as personalized legal advice; encourage the user to ignore professional legal advice when professional review is appropriate.

9. ACTIONABLE HELP
   Whenever appropriate, turn analysis into useful outputs such as: plain-English explanations, key-term summaries, obligation lists, important-date lists, questions to ask, items to clarify, items to negotiate, review checklists, questions to raise with a legal professional.

10. RESPONSE QUALITY
    Be concise but sufficiently detailed. Prioritize information that could materially affect the user's understanding, obligations, cost, rights, deadlines, or decisions. Do not overwhelm the user with unnecessary legal terminology.

DEFAULT RESPONSE STRUCTURE
When analyzing a document, organize the response where relevant into:
1. What this document is
2. What it means in plain English
3. Your key obligations
4. The other party's key obligations
5. Important dates and money
6. Clauses that deserve attention
7. What the document does not tell us
8. Questions the user may want to ask
9. Questions to consider asking a legal professional

Always adapt the structure to the user's actual question.

FINAL RULE
Your goal is not simply to summarize legal text. Your goal is to help the user understand: "What am I agreeing to, what could materially affect me, what do I need to clarify, and what should I discuss with a qualified professional?"

FORMATTING
Use Markdown formatting for clarity: headers (##, ###), bold, bullet lists. Keep responses structured and easy to scan.`;

const QUICK_ACTIONS = [
  { id: 'summarize',    icon: '📋', label: 'Summarize Document',   prompt: 'Please provide a structured summary of this document following your default response structure: what it is, what it means in plain English, key obligations, important dates and money, and clauses that deserve attention.' },
  { id: 'obligations',  icon: '✅', label: 'My Key Obligations',    prompt: 'List all of my key obligations under this document in a clear, numbered list. Include deadlines, payment obligations, notice requirements, and any ongoing duties. Identify the relevant section for each obligation.' },
  { id: 'dates',        icon: '📅', label: 'Key Dates & Deadlines', prompt: 'Extract and list all important dates, deadlines, notice periods, and time-sensitive obligations from this document. Include effective dates, termination dates, renewal dates, and any payment deadlines.' },
  { id: 'money',        icon: '💰', label: 'Money & Fees',          prompt: 'Identify all financial obligations, payment terms, fees, penalties, and costs mentioned in this document. Who pays what, when, and under what conditions?' },
  { id: 'questions',    icon: '❓', label: 'Questions to Ask',      prompt: 'Based on this document, what are the most important questions I should ask the other party to clarify or negotiate? Also, what questions should I consider raising with a legal professional?' },
  { id: 'termination',  icon: '🔚', label: 'How to Exit',           prompt: 'Explain all termination, cancellation, and exit provisions in this document. How can I exit this agreement? What notice is required? Are there any penalties for early termination?' },
  { id: 'negotiate',    icon: '🤝', label: 'What to Negotiate',     prompt: 'Based on this document, what clauses are most important to try to negotiate or modify? What terms are typically negotiable in this type of agreement?' },
];

// ── Document loading ─────────────────────────────────────────────────────
async function loadDocument(text, name) {
  state.documentText = text;
  state.documentName = name;
  state.documentType = detectDocType(text);
  state.conversationHistory = [];
  renderDocPreview();
  updateDocTitleDisplay();
  showToast(`✅ Document loaded: ${name}`, 'success');
}

function clearDocument() {
  state.documentText = '';
  state.documentName = '';
  state.documentType = '';
  state.conversationHistory = [];
  renderDocPreview();
  updateDocTitleDisplay();
  clearChat();
  showToast('Document cleared', 'default');
}

// ── Generic templated action runner ──────────────────────────────────────────
// Fills {DOCUMENT_TEXT} and {USER_ROLE} placeholders then sends as a chat
// message. Displays a short user-facing label in the chat bubble.
async function runTemplatedAction(displayLabel, promptTemplate, demoResponse) {
  if (state.isLoading) return;

  if (!state.documentText) {
    showToast('⚠️ Please load a document first.', 'error');
    return;
  }

  el('chat-input').value = '';
  autoResizeTextarea(el('chat-input'));
  el('send-btn').disabled = true;
  state.isLoading = true;

  const container = el('chat-messages');
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  // User trigger bubble (short label, not the full 100-line prompt)
  const triggerDiv = document.createElement('div');
  triggerDiv.className = 'msg user';
  triggerDiv.innerHTML = `
    <div class="msg-avatar user">U</div>
    <div class="msg-content">
      <div class="msg-bubble">${escapeHtml(displayLabel)}</div>
      <div class="msg-time">${formatTime(new Date())}</div>
    </div>`;
  container.appendChild(triggerDiv);
  container.scrollTop = container.scrollHeight;

  const loadingId = appendMessage('ai', '', true);

  try {
    let responseText;

    if (state.apiKey) {
      // Fill placeholders and call Gemini (standard markdown call, no JSON mode)
      const filledPrompt = promptTemplate
        .replace('{DOCUMENT_TEXT}', state.documentText.slice(0, 50000))
        .replace('{USER_ROLE}', state.currentRole);

      // Call Gemini without the system prompt — the template is self-contained
      responseText = await callGeminiRaw(filledPrompt);
    } else {
      await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
      responseText = demoResponse;
    }

    removeMessage(loadingId);
    appendMessage('ai', responseText);

    state.conversationHistory.push({ role: 'user', content: displayLabel });
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

// ── Plain English runner ───────────────────────────────────────────────────
function runPlainEnglish() {
  runTemplatedAction(
    '📖 Plain English Explanation — full A–I walkthrough',
    PLAIN_ENGLISH_PROMPT,
    DEMO_PLAIN_ENGLISH
  );
}

// ── Red Flags runner ───────────────────────────────────────────────────────
function runRedFlags() {
  runTemplatedAction(
    '🚩 Red Flags & Risks — detailed analysis',
    RED_FLAGS_PROMPT,
    DEMO_RED_FLAGS
  );
}


// ── Red Flags runner ───────────────────────────────────────────────────────
function runRedFlags() {
  runTemplatedAction(
    '🚩 Red Flags & Risks — detailed analysis',
    RED_FLAGS_PROMPT,
    DEMO_RED_FLAGS
  );
}

// ── Deep Extract ─────────────────────────────────────────────────────────
async function runDeepExtract() {
  if (state.isLoading) return;

  if (!state.documentText) {
    showToast('⚠️ Please load a document first.', 'error');
    return;
  }

  state.isLoading = true;
  el('send-btn').disabled = true;

  // Announce in chat
  const container = el('chat-messages');
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  // User-style trigger bubble
  const triggerDiv = document.createElement('div');
  triggerDiv.className = 'msg user';
  triggerDiv.innerHTML = `
    <div class="msg-avatar user">U</div>
    <div class="msg-content">
      <div class="msg-bubble">🔍 Run Deep Extract — full structured analysis</div>
      <div class="msg-time">${formatTime(new Date())}</div>
    </div>`;
  container.appendChild(triggerDiv);

  // Loading indicator
  const loadingId = appendMessage('ai', '', true);
  container.scrollTop = container.scrollHeight;

  try {
    let extractData;

    if (state.apiKey) {
      // Build the full prompt with substitutions
      const filledPrompt = DEEP_EXTRACT_PROMPT
        .replace('{DOCUMENT_TEXT}', state.documentText.slice(0, 50000))
        .replace('{USER_ROLE}', state.currentRole);

      const rawJson = await callGeminiRaw(filledPrompt);

      // Strip any accidental markdown fences
      const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      extractData = JSON.parse(cleaned);
    } else {
      // Demo mode
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      extractData = DEMO_EXTRACT_JSON;
    }

    removeMessage(loadingId);
    renderExtractPanel(extractData);

    // Add a summary note to conversation history so follow-up questions work
    state.conversationHistory.push({
      role: 'user',
      content: 'Please run a deep structured extraction of this document.'
    });
    state.conversationHistory.push({
      role: 'model',
      content: `I ran a full structured extraction of "${state.documentName}". The results are displayed below in the extract panel. Feel free to ask follow-up questions about any specific clause or section.`
    });

  } catch (err) {
    removeMessage(loadingId);
    if (err instanceof SyntaxError) {
      appendMessage('ai', `## ⚠️ Could not parse extraction result\n\nThe AI returned a response that couldn't be parsed as JSON. Try again, or use the Summarize quick action instead.\n\n**Error:** ${err.message}`);
    } else {
      appendMessage('ai', `## ⚠️ Extraction Error\n\n${err.message}\n\nPlease check your API key in ⚙️ Settings and try again.`);
    }
  } finally {
    state.isLoading = false;
    el('send-btn').disabled = false;
    el('chat-input').focus();
  }
}

// ── Export helpers ────────────────────────────────────────────────────────
function exportExtractJSON() {
  if (!state.lastExtract) return;
  const blob = new Blob([JSON.stringify(state.lastExtract, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.documentName || 'document').replace(/\.[^.]+$/, '') + '_extract.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ JSON exported!', 'success');
}

function copyExtractText() {
  if (!state.lastExtract) return;
  const d = state.lastExtract;
  const lines = [
    `DEEP EXTRACT — ${d.document_type || 'Legal Document'}`,
    `Document: ${state.documentName || 'Untitled'}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `DOCUMENT INFORMATION`,
    `Type: ${d.document_type}`,
    `Title: ${d.document_title}`,
    `Purpose: ${d.purpose}`,
    `Effective Date: ${d.effective_date}`,
    `Duration: ${d.duration}`,
    `Jurisdiction: ${d.jurisdiction}`,
    '',
    `PARTIES`,
    ...(d.parties || []).map(p => `  • ${p.name} (${p.role}): ${p.responsibilities}`),
    '',
    `FINANCIAL TERMS`,
    ...(d.financial_terms || []).map(f => `  • ${f.item}: ${f.detail} [${f.source}]`),
    '',
    `MY OBLIGATIONS`,
    ...(d.user_obligations || []).map(o => `  • ${o.obligation} [${o.source}]`),
    '',
    `OTHER PARTY OBLIGATIONS`,
    ...(d.other_party_obligations || []).map(o => `  • ${o.obligation} [${o.source}]`),
    '',
    `KEY DATES`,
    ...(d.important_dates || []).map(dt => `  • ${dt.label}: ${dt.date} [${dt.source}]`),
    '',
    `IMPORTANT PROVISIONS`,
    ...(d.important_provisions || []).map(p => `  • ${p.title}: ${p.detail} — ${p.reason} [${p.source}]`),
    '',
    '---',
    'JenLaw — Legal information only. Not legal advice.',
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('📋 Copied to clipboard!', 'success');
  }).catch(() => showToast('Could not copy — try exporting JSON instead.', 'error'));
}

// ── Quick Actions ────────────────────────────────────────────────────────
function buildQuickActionsBar() {
  const bar = el('quick-actions-bar');
  bar.innerHTML = `<span class="qa-label">Quick Actions:</span>`;

  // Deep Extract button first — distinctive styling
  const extractBtn = document.createElement('button');
  extractBtn.className = 'qa-btn qa-btn-extract';
  extractBtn.id = 'qa-deep-extract';
  extractBtn.innerHTML = '🔍 Deep Extract';
  extractBtn.title = 'Run a full structured JSON extraction of all key legal information';
  extractBtn.onclick = () => runDeepExtract();
  bar.appendChild(extractBtn);

  // Plain English button — second primary action
  const plainBtn = document.createElement('button');
  plainBtn.className = 'qa-btn qa-btn-plain';
  plainBtn.id = 'qa-plain-english';
  plainBtn.innerHTML = '📖 Plain English';
  plainBtn.title = 'Get a full plain-English walkthrough of the document (sections A–I)';
  plainBtn.onclick = () => runPlainEnglish();
  bar.appendChild(plainBtn);

  const flagsBtn = document.createElement('button');
  flagsBtn.className = 'qa-btn qa-btn-flags';
  flagsBtn.style.color = 'var(--danger)';
  flagsBtn.style.borderColor = 'var(--danger-border)';
  flagsBtn.style.backgroundColor = 'var(--danger-subtle)';
  flagsBtn.id = 'qa-red-flags';
  flagsBtn.innerHTML = '🚩 Red Flags & Risks';
  flagsBtn.title = 'Identify clauses that need your careful review';
  flagsBtn.onclick = () => runRedFlags();
  bar.appendChild(flagsBtn);




  // Red Flags button — third primary action


  // Red Flags button — third primary action


  // Separator
  const sep = document.createElement('div');
  sep.className = 'qa-sep';
  bar.appendChild(sep);

  QUICK_ACTIONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'qa-btn';
    btn.id = `qa-${action.id}`;
    btn.innerHTML = `${action.icon} ${action.label}`;
    btn.onclick = () => sendMessage(action.prompt);
    bar.appendChild(btn);
  });
}

// ── Role selector ────────────────────────────────────────────────────────
function buildRoleSelect() {
  const sel = el('role-select');
  ROLES.forEach(role => {
    const opt = document.createElement('option');
    opt.value = role;
    opt.textContent = role;
    sel.appendChild(opt);
  });
  sel.value = state.currentRole;
  sel.addEventListener('change', () => {
    state.currentRole = sel.value;
    showToast(`Role set: ${state.currentRole}`, 'success');
  });
}

// ── Textarea auto-resize ─────────────────────────────────────────────────
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
}

// ── File upload ──────────────────────────────────────────────────────────
function setupUploadZone() {
  const zone = el('upload-zone');
  const input = el('file-input');

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragging');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));

  zone.addEventListener('drop', async e => {
    e.preventDefault();
    zone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) await handleFileUpload(file);
  });

  input.addEventListener('change', async () => {
    if (input.files[0]) await handleFileUpload(input.files[0]);
    input.value = '';
  });
}

async function handleFileUpload(file) {
  const allowedTypes = ['application/pdf', 'text/plain', 'text/html'];
  if (!file.type && !file.name.match(/\.(pdf|txt|md)$/i)) {
    showToast('⚠️ Please upload a PDF or text file.', 'error');
    return;
  }

  showToast('📖 Processing document…', 'default', 8000);

  try {
    let text = '';
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      text = await extractPdfText(file);
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      showToast('⚠️ Could not extract text from this file.', 'error');
      return;
    }

    await loadDocument(text, file.name);
  } catch (err) {
    console.error(err);
    showToast(`⚠️ Error reading file: ${err.message}`, 'error');
  }
}

// ── Init ─────────────────────────────────────────────────────────────────
function init() {
  // Build dynamic components
  buildQuickActionsBar();
  buildRoleSelect();
  setupUploadZone();

  // Chat input
  const chatInput = el('chat-input');
  chatInput.addEventListener('input', () => autoResizeTextarea(chatInput));
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Show appropriate view
  el('app').classList.add('hidden');
  renderDocPreview();
  updateDocTitleDisplay();

  // API key status
  if (!state.apiKey) {
    console.info('[JenLaw] No API key found — running in demo mode.');
  }
}

document.addEventListener('DOMContentLoaded', init);
