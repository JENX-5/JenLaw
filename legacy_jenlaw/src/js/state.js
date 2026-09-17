// ── State ───────────────────────────────────────────────────────────────
let state = {
  view: 'landing',          // 'landing' | 'app'
  documentText: '',
  documentName: '',
  documentType: '',
  conversationHistory: [],  // [{role, content}]
  isLoading: false,
  apiKey: localStorage.getItem('jenlaw_api_key') || '',
  apiModel: 'gemini-2.0-flash',
  currentRole: 'Not specified',
  previewExpanded: false,
};
