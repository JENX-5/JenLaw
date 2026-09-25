/**
 * Gemini API Client
 *
 * Provides functions for communicating with the Gemini AI backend.
 * Includes automatic model fallback: if the primary model fails,
 * the client retries with progressively older/smaller models.
 */
import { JENLAW_SYSTEM_PROMPT } from './prompts';

const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.0-flash'
];

async function attemptApiCall(requestBody, initialModel) {
  // Try the initial model first, then the fallbacks
  const modelsToTry = [...new Set([initialModel, ...FALLBACK_MODELS])];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiModel: model, requestBody }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from API.');
      
      console.log(`[JenLaw API] Successfully used model: ${model}`);
      return text;
    } catch (error) {
      console.warn(`[JenLaw API] Failed with model ${model}:`, error.message);
      lastError = error;
      
      // If it's a 400 Bad Request, there's a problem with the prompt itself, don't retry.
      if (error.message.includes('HTTP 400') || error.message.includes('INVALID_ARGUMENT')) {
        throw error;
      }
    }
  }
  
  throw new Error(`All fallback models failed. Please try again later. Last error: ${lastError?.message}`);
}

export async function callGemini({
  userMessage,
  apiModel = 'gemini-3.6-flash',
  documentText = '',
  currentRole = 'Not specified',
  conversationHistory = []
}) {
  const roleContext = currentRole !== 'Not specified'
    ? `\n\n[USER CONTEXT: The user's role in this document is: ${currentRole}]`
    : '';

  const docContext = documentText
    ? `\n\n[DOCUMENT PROVIDED BY USER — base your analysis on this text]:\n\n${documentText.slice(0, 50000)}`
    : '\n\n[No document has been provided yet. Ask the user to upload or paste a document if needed.]';

  const contents = conversationHistory.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

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

  return attemptApiCall(requestBody, apiModel);
}

export async function callGeminiRaw({ fullPrompt, apiModel = 'gemini-3.6-flash' }) {
  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    }
  };

  return attemptApiCall(requestBody, apiModel);
}
