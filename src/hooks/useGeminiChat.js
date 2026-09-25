import { useState, useCallback, useMemo, useRef } from 'react';
import { callGemini, callGeminiRaw } from '../lib/gemini';
import { QA_PROMPT } from '../lib/prompts';
import { chunkText, retrieveRelevantChunks } from '../lib/utils';

/**
 * Custom hook that encapsulates all Gemini AI chat logic.
 * Manages conversation state, API calls with retry logic,
 * and document-aware prompt construction.
 *
 * For single-document Q&A, uses a RAG-style retrieval approach:
 *   chunk → retrieve relevant chunks → send only relevant context to LLM
 * This dramatically reduces token usage vs. sending the full document.
 *
 * @param {Object} params
 * @param {Object} params.docA - Primary document { name, text, type }
 * @param {Object} params.docB - Secondary document for comparison
 * @param {string} params.currentRole - User's selected role context
 * @returns {Object} Chat state and action handlers
 */
export function useGeminiChat({ docA, docB, currentRole }) {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref for conversationHistory inside async callbacks to avoid
  // stale closures and unnecessary re-creation of memoized callbacks.
  const historyRef = useRef(conversationHistory);
  historyRef.current = conversationHistory;

  // Memoize document slices for action prompts (need fuller context).
  // Cap at 40 000 chars (~10 000 tokens) — sufficient for most legal docs.
  const memoizedDocAText = useMemo(() => docA.text ? docA.text.slice(0, 40000) : '', [docA.text]);
  const memoizedDocBText = useMemo(() => docB.text ? docB.text.slice(0, 40000) : '', [docB.text]);

  // Pre-chunk documents for RAG Q&A retrieval.
  // useMemo ensures re-chunking only happens when the document changes,
  // not on every render or every user message.
  const docAChunks = useMemo(() => chunkText(docA.text || ''), [docA.text]);
  const docBChunks = useMemo(() => chunkText(docB.text || ''), [docB.text]);

  const addMessage = useCallback((role, content) => {
    setConversationHistory(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role,
      content,
      timestamp: new Date()
    }]);
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  /**
   * Executes a retry loop for API calls.
   * Does not sleep between retries — the model fallback chain in gemini.js
   * already handles transient failures by switching models, so sleeping here
   * only adds unnecessary latency.
   *
   * @param {Function} apiCallFn - Async function that performs the API call
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<string>} The API response text
   */
  const executeWithRetry = useCallback(async (apiCallFn, maxRetries = 1) => {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCallFn();
      } catch (error) {
        lastError = error;
        // Don't retry on bad request errors — the prompt itself is the problem
        if (
          error.message?.includes('HTTP 400') ||
          error.message?.includes('INVALID_ARGUMENT') ||
          error.message?.includes('Request too large')
        ) {
          throw error;
        }
      }
    }
    throw lastError;
  }, []);

  const handleRunAction = useCallback(async (label, template) => {
    if (isLoading) return;
    
    if (template.includes('{DOCUMENT_B}') && (!memoizedDocAText || !memoizedDocBText)) {
      alert("This action requires both Document A and Document B to be loaded.");
      return;
    }

    addMessage('user', `> **Action triggered:** ${label}`);
    setIsLoading(true);

    try {
      let finalTemplate = template;
      
      if (finalTemplate.includes('{SCENARIO}')) {
        const scenarioText = window.prompt("Describe the hypothetical scenario you want to test against this document:");
        if (!scenarioText || !scenarioText.trim()) {
          setIsLoading(false);
          return;
        }
        finalTemplate = finalTemplate.replace(/\{SCENARIO\}/g, () => scenarioText);
      }

      // Inject documents using function replacers to prevent regex injection
      const filledPrompt = finalTemplate
        .replace(/\{DOCUMENT_TEXT\}/g, () => memoizedDocAText)
        .replace(/\{DOCUMENT_A\}/g, () => memoizedDocAText)
        .replace(/\{DOCUMENT_B\}/g, () => memoizedDocBText)
        .replace(/\{USER_ROLE\}/g, () => currentRole);

      const responseText = await executeWithRetry(() =>
        callGeminiRaw({ fullPrompt: filledPrompt })
      );

      addMessage('model', responseText);
    } catch (error) {
      console.error("[JenLaw] API Error in handleRunAction:", error);
      addMessage('model', `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, memoizedDocAText, memoizedDocBText, currentRole, addMessage, executeWithRetry]);

  const handleSendMessage = useCallback(async (text) => {
    if (isLoading) return;
    
    addMessage('user', text);
    setIsLoading(true);

    try {
      const responseText = await executeWithRetry(() => {
        if (docAChunks.length > 0 && docBChunks.length === 0) {
          // RAG-style single-document Q&A:
          // Retrieve only the most relevant chunks instead of the full document.
          // This reduces token usage from ~10 000+ tokens to ~1 500 tokens per request.
          const relevantContext = retrieveRelevantChunks(docAChunks, text);
          const filledPrompt = QA_PROMPT
            .replace(/\{DOCUMENT_TEXT\}/g, () => relevantContext)
            .replace(/\{USER_ROLE\}/g, () => currentRole)
            .replace(/\{QUESTION\}/g, () => text);
          
          return callGeminiRaw({ fullPrompt: filledPrompt });
        } else {
          // Conversational fallback (handles multi-doc or no doc scenarios).
          // For multi-doc we still send sliced full text as the comparison
          // prompt needs broad document coverage.
          let combinedDocs = '';
          if (memoizedDocAText) combinedDocs += `DOCUMENT A:\n${memoizedDocAText}\n\n`;
          if (memoizedDocBText) combinedDocs += `DOCUMENT B:\n${memoizedDocBText}\n\n`;
          
          return callGemini({
            userMessage: text,
            documentText: combinedDocs,
            currentRole,
            conversationHistory: historyRef.current
          });
        }
      });

      addMessage('model', responseText);
    } catch (error) {
      console.error("[JenLaw] API Error in handleSendMessage:", error);
      addMessage('model', `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, docAChunks, docBChunks, memoizedDocAText, memoizedDocBText, currentRole, addMessage, executeWithRetry]);

  return {
    conversationHistory,
    isLoading,
    handleRunAction,
    handleSendMessage,
    clearHistory
  };
}
