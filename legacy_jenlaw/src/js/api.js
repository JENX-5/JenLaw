// ── Gemini API ───────────────────────────────────────────────────────────
async function callGemini(userMessage) {
  if (!state.apiKey) {
    openSettingsModal();
    throw new Error('API key required. Please add your Gemini API key in Settings.');
  }

  const roleContext = state.currentRole !== 'Not specified'
    ? `\n\n[USER CONTEXT: The user's role in this document is: ${state.currentRole}]`
    : '';

  const docContext = state.documentText
    ? `\n\n[DOCUMENT PROVIDED BY USER — base your analysis on this text]:\n\n${state.documentText.slice(0, 50000)}`
    : '\n\n[No document has been provided yet. Ask the user to upload or paste a document if needed.]';

  // Build conversation contents
  const contents = state.conversationHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: JENLAW_SYSTEM_PROMPT + roleContext + docContext }]
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API.');
  return text;
}

// ── Gemini raw call (for structured/JSON extraction) ────────────────────
async function callGeminiRaw(fullPrompt) {
  if (!state.apiKey) {
    openSettingsModal();
    throw new Error('API key required. Please add your Gemini API key in Settings.');
  }

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API.');
  return text;
}
