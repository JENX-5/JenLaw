import { useState, useCallback, useMemo } from 'react';
import { callGemini, callGeminiRaw } from '../lib/gemini';
import { QA_PROMPT } from '../lib/prompts';

export function useGeminiChat({ docA, docB, currentRole }) {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize large document slices so we don't recreate them on every render
  const memoizedDocAText = useMemo(() => docA.text ? docA.text.slice(0, 50000) : '', [docA.text]);
  const memoizedDocBText = useMemo(() => docB.text ? docB.text.slice(0, 50000) : '', [docB.text]);

  const addMessage = useCallback((role, content) => {
    setConversationHistory(prev => [...prev, {
      id: Date.now().toString() + '-' + Math.random(),
      role,
      content,
      timestamp: new Date()
    }]);
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
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

      // Inject documents
      const filledPrompt = finalTemplate
        .replace(/\{DOCUMENT_TEXT\}/g, () => memoizedDocAText)
        .replace(/\{DOCUMENT_A\}/g, () => memoizedDocAText)
        .replace(/\{DOCUMENT_B\}/g, () => memoizedDocBText)
        .replace(/\{USER_ROLE\}/g, () => currentRole);

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

      addMessage('model', responseText);
    } catch (error) {
      console.error("API Error in handleRunAction:", error);
      addMessage('model', `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, memoizedDocAText, memoizedDocBText, currentRole, addMessage]);

  const handleSendMessage = useCallback(async (text) => {
    if (isLoading) return;
    
    addMessage('user', text);
    setIsLoading(true);

    try {
      let responseText = null;
      let retries = 0;
      
      while (retries <= 2) {
        try {
          if (memoizedDocAText && !memoizedDocBText) {
            // Use QA format for single document
            const filledPrompt = QA_PROMPT
              .replace(/\{DOCUMENT_TEXT\}/g, () => memoizedDocAText)
              .replace(/\{USER_ROLE\}/g, () => currentRole)
              .replace(/\{QUESTION\}/g, () => text);
            
            responseText = await callGeminiRaw({ fullPrompt: filledPrompt });
          } else {
            // Conversational fallback (handles multi-doc or no doc scenarios)
            let combinedDocs = '';
            if (memoizedDocAText) combinedDocs += `DOCUMENT A:\n${memoizedDocAText}\n\n`;
            if (memoizedDocBText) combinedDocs += `DOCUMENT B:\n${memoizedDocBText}\n\n`;
            
            responseText = await callGemini({
              userMessage: text,
              documentText: combinedDocs,
              currentRole,
              conversationHistory
            });
          }
          break;
        } catch (error) {
          retries++;
          if (retries > 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      addMessage('model', responseText);
    } catch (error) {
      console.error("API Error in handleSendMessage:", error);
      addMessage('model', `## ⚠️ Temporary Issue\n\nI encountered a temporary issue while processing your request. Please try again in a moment.`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, memoizedDocAText, memoizedDocBText, currentRole, conversationHistory, addMessage]);

  return {
    conversationHistory,
    isLoading,
    handleRunAction,
    handleSendMessage,
    clearHistory
  };
}
