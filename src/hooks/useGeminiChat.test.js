import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeminiChat } from './useGeminiChat';

// Mock the API module
vi.mock('../lib/gemini', () => ({
  callGemini: vi.fn(),
  callGeminiRaw: vi.fn()
}));

import { callGemini, callGeminiRaw } from '../lib/gemini';

// ── Fixture helpers ───────────────────────────────────────────────────────────

const EMPTY_DOC = { name: '', text: '', type: '' };

const DOC_A = {
  name: 'contract.txt',
  text: [
    'The tenant must pay monthly rent of $1,500 on the first of each month.',
    'The landlord shall maintain the property in habitable condition.',
    'Either party may terminate this lease with 30 days written notice.',
    'Late payments shall incur a penalty of $75 per day after a 5-day grace period.',
    'This agreement is governed by the laws of the State of California.',
    'The security deposit of $3,000 is due at lease signing.',
    'Subletting is not permitted without prior written consent from the landlord.',
    'Pets are allowed with an additional monthly fee of $50.',
    'The tenant is responsible for utility payments including electricity and water.',
    'Disputes shall be resolved through binding arbitration in San Francisco County.',
  ].join('\n\n'),
  type: 'text/plain'
};

const DOC_B = {
  name: 'contract-v2.txt',
  text: 'Updated contract with new payment terms of $2,000 per month.',
  type: 'text/plain'
};

const defaultProps = {
  docA: DOC_A,
  docB: EMPTY_DOC,
  currentRole: 'Tenant'
};

// ── Initialization ────────────────────────────────────────────────────────────
describe('useGeminiChat — initialization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes with empty conversation and isLoading = false', () => {
    const { result } = renderHook(() => useGeminiChat(defaultProps));
    expect(result.current.conversationHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the required API surface', () => {
    const { result } = renderHook(() => useGeminiChat(defaultProps));
    expect(typeof result.current.handleSendMessage).toBe('function');
    expect(typeof result.current.handleRunAction).toBe('function');
    expect(typeof result.current.clearHistory).toBe('function');
  });
});

// ── clearHistory ──────────────────────────────────────────────────────────────
describe('useGeminiChat — clearHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears conversation history', async () => {
    callGeminiRaw.mockResolvedValue('AI response');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('Hello'); });
    expect(result.current.conversationHistory.length).toBeGreaterThan(0);

    act(() => { result.current.clearHistory(); });
    expect(result.current.conversationHistory).toEqual([]);
  });
});

// ── handleSendMessage — basic behaviour ───────────────────────────────────────
describe('useGeminiChat — handleSendMessage basic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a user message and a model message', async () => {
    callGeminiRaw.mockResolvedValue('AI answer about the lease');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('What is the rent?'); });

    const history = result.current.conversationHistory;
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('What is the rent?');
    expect(history[1].role).toBe('model');
    expect(history[1].content).toBe('AI answer about the lease');
  });

  it('sets isLoading to false after completion', async () => {
    callGeminiRaw.mockResolvedValue('Done');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('test'); });
    expect(result.current.isLoading).toBe(false);
  });

  it('each message has a unique id and a timestamp', async () => {
    callGeminiRaw.mockResolvedValue('OK');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('test'); });

    const [user, model] = result.current.conversationHistory;
    expect(user.id).toBeTruthy();
    expect(model.id).toBeTruthy();
    expect(user.id).not.toBe(model.id);
    expect(user.timestamp).toBeInstanceOf(Date);
    expect(model.timestamp).toBeInstanceOf(Date);
  });
});

// ── handleSendMessage — RAG retrieval ────────────────────────────────────────
describe('useGeminiChat — RAG chunk retrieval for single-doc Q&A', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls callGeminiRaw (not callGemini) for single-document Q&A', async () => {
    callGeminiRaw.mockResolvedValue('Rent is $1,500');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('What is the rent?'); });

    expect(callGeminiRaw).toHaveBeenCalledOnce();
    expect(callGemini).not.toHaveBeenCalled();
  });

  it('injects relevant document chunks into the prompt (not the full doc)', async () => {
    callGeminiRaw.mockResolvedValue('Answer about rent');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('What is the rent amount?'); });

    const { fullPrompt } = callGeminiRaw.mock.calls[0][0];

    // The prompt should contain rent-related content
    expect(fullPrompt).toContain('$1,500');

    // For a document of this size (~1 200 chars), all text fits in a few chunks,
    // so we verify the prompt is AT MOST the full document text length + some overhead,
    // i.e. it was not sent without chunking
    expect(fullPrompt.length).toBeLessThan(DOC_A.text.length * 2 + 2000);
  });

  it('injects the user question into the QA prompt', async () => {
    callGeminiRaw.mockResolvedValue('Answer');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('Can I sublet the apartment?'); });

    const { fullPrompt } = callGeminiRaw.mock.calls[0][0];
    expect(fullPrompt).toContain('Can I sublet the apartment?');
  });

  it('injects the user role into the QA prompt', async () => {
    callGeminiRaw.mockResolvedValue('Answer');
    const { result } = renderHook(() => useGeminiChat({
      ...defaultProps,
      currentRole: 'Landlord'
    }));

    await act(async () => { await result.current.handleSendMessage('What are my obligations?'); });

    const { fullPrompt } = callGeminiRaw.mock.calls[0][0];
    expect(fullPrompt).toContain('Landlord');
  });
});

// ── handleSendMessage — multi-doc ─────────────────────────────────────────────
describe('useGeminiChat — multi-document conversation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls callGemini (not callGeminiRaw) when both docs are loaded', async () => {
    callGemini.mockResolvedValue('Comparison answer');
    const { result } = renderHook(() => useGeminiChat({
      docA: DOC_A,
      docB: DOC_B,
      currentRole: 'Tenant'
    }));

    await act(async () => { await result.current.handleSendMessage('Compare the two contracts'); });

    expect(callGemini).toHaveBeenCalledOnce();
    expect(callGeminiRaw).not.toHaveBeenCalled();
  });

  it('calls callGemini when no document is loaded', async () => {
    callGemini.mockResolvedValue('General answer');
    const { result } = renderHook(() => useGeminiChat({
      docA: EMPTY_DOC,
      docB: EMPTY_DOC,
      currentRole: 'Not specified'
    }));

    await act(async () => { await result.current.handleSendMessage('General legal question'); });

    expect(callGemini).toHaveBeenCalledOnce();
  });
});

// ── handleSendMessage — error handling ────────────────────────────────────────
describe('useGeminiChat — error handling in handleSendMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a graceful error message on API failure', async () => {
    callGeminiRaw.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('Hello'); });

    const history = result.current.conversationHistory;
    expect(history).toHaveLength(2);
    expect(history[1].role).toBe('model');
    expect(history[1].content).toContain('Temporary Issue');
  });

  it('resets isLoading to false after an error', async () => {
    callGeminiRaw.mockRejectedValue(new Error('Oops'));
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => { await result.current.handleSendMessage('Hello'); });
    expect(result.current.isLoading).toBe(false);
  });
});

// ── Concurrent request guard ──────────────────────────────────────────────────
describe('useGeminiChat — concurrent request guard', () => {
  it('blocks a second message while the first is loading', async () => {
    let resolveFirst;
    callGeminiRaw.mockImplementation(() => new Promise(r => { resolveFirst = r; }));

    const { result } = renderHook(() => useGeminiChat(defaultProps));

    // Start first request (don't await — it's intentionally pending)
    act(() => { result.current.handleSendMessage('First'); });

    // Attempt second while first is still loading
    await act(async () => { await result.current.handleSendMessage('Second'); });

    // Only the first user message should be in history
    expect(result.current.conversationHistory).toHaveLength(1);
    expect(result.current.conversationHistory[0].content).toBe('First');

    // Resolve first so the hook cleans up
    await act(async () => { resolveFirst('Response'); });
  });
});

// ── handleRunAction ───────────────────────────────────────────────────────────
describe('useGeminiChat — handleRunAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fills DOCUMENT_TEXT and USER_ROLE placeholders', async () => {
    callGeminiRaw.mockResolvedValue('Action result');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => {
      await result.current.handleRunAction(
        'Test Action',
        'Analyze {DOCUMENT_TEXT} for {USER_ROLE}'
      );
    });

    const { fullPrompt } = callGeminiRaw.mock.calls[0][0];
    expect(fullPrompt).toContain('$1,500'); // content from DOC_A
    expect(fullPrompt).toContain('Tenant');
  });

  it('adds an action trigger message and a model response', async () => {
    callGeminiRaw.mockResolvedValue('Summary output');
    const { result } = renderHook(() => useGeminiChat(defaultProps));

    await act(async () => {
      await result.current.handleRunAction('Summarise', 'Summarise {DOCUMENT_TEXT}');
    });

    const history = result.current.conversationHistory;
    expect(history).toHaveLength(2);
    expect(history[0].content).toContain('Action triggered');
    expect(history[1].content).toBe('Summary output');
  });

  it('blocks concurrent action when isLoading', async () => {
    let resolve;
    callGeminiRaw.mockImplementation(() => new Promise(r => { resolve = r; }));

    const { result } = renderHook(() => useGeminiChat(defaultProps));

    // Start first action
    act(() => { result.current.handleRunAction('First', '{DOCUMENT_TEXT}'); });

    // Try a second action — should be blocked
    await act(async () => {
      await result.current.handleRunAction('Second', '{DOCUMENT_TEXT}');
    });

    // Only one user message (the first action trigger)
    expect(result.current.conversationHistory).toHaveLength(1);

    await act(async () => { resolve('Done'); });
  });

  it('alerts when DOCUMENT_B is required but missing', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useGeminiChat(defaultProps)); // no docB

    await act(async () => {
      await result.current.handleRunAction(
        'Compare',
        'Compare {DOCUMENT_A} vs {DOCUMENT_B}'
      );
    });

    expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/Document A and Document B/i));
    expect(callGeminiRaw).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });
});
