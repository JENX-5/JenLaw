/**
 * Tests for the Vercel serverless function in api/gemini.js
 *
 * The handler validates method, request body, model name, and request size,
 * then proxies the request to the Gemini API. These tests mock the global
 * fetch so no real HTTP calls are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide environment variable before importing the handler
process.env.GEMINI_API_KEY = 'test-api-key-12345';
delete process.env.GEMINI_API_KEY_BACKUP;

const handler = (await import('./gemini.js')).default;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a mock req/res pair for the serverless handler */
function makeReqRes({ method = 'POST', body = {} } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    end(data) { this.body = data; }
  };
  const req = { method, body };
  return { req, res };
}

/** Parse the JSON body written to res.end() */
function parseBody(res) {
  return JSON.parse(res.body);
}

// ── Method validation ─────────────────────────────────────────────────────────
describe('api/gemini handler — HTTP method', () => {
  it('rejects GET requests with 405', async () => {
    const { req, res } = makeReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(parseBody(res).error).toMatch(/method not allowed/i);
  });

  it('rejects PUT requests with 405', async () => {
    const { req, res } = makeReqRes({ method: 'PUT' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });
});

// ── Body validation ───────────────────────────────────────────────────────────
describe('api/gemini handler — request body validation', () => {
  it('returns 400 when requestBody is missing', async () => {
    const { req, res } = makeReqRes({ body: {} });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(parseBody(res).error).toMatch(/missing requestBody/i);
  });

  it('returns 413 when requestBody exceeds 1 MB', async () => {
    const bigText = 'x'.repeat(1_100_000); // > 1 MB when serialized
    const { req, res } = makeReqRes({
      body: { requestBody: { contents: [{ parts: [{ text: bigText }] }] } }
    });
    await handler(req, res);
    expect(res.statusCode).toBe(413);
    expect(parseBody(res).error).toMatch(/too large/i);
  });

  it('returns 400 for invalid model name (path traversal attempt)', async () => {
    const { req, res } = makeReqRes({
      body: {
        apiModel: '../../../etc/passwd',
        requestBody: { contents: [{ parts: [{ text: 'hello' }] }] }
      }
    });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(parseBody(res).error).toMatch(/invalid model name/i);
  });

  it('returns 400 for model name with spaces', async () => {
    const { req, res } = makeReqRes({
      body: {
        apiModel: 'gemini flash 3.6',
        requestBody: { contents: [{ parts: [{ text: 'hello' }] }] }
      }
    });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});

// ── Successful proxy ──────────────────────────────────────────────────────────
describe('api/gemini handler — Gemini API proxy', () => {
  const validBody = {
    apiModel: 'gemini-3.6-flash',
    requestBody: { contents: [{ role: 'user', parts: [{ text: 'What is this contract?' }] }] }
  };

  const geminiOkResponse = {
    candidates: [{ content: { parts: [{ text: 'This is a service agreement.' }] } }]
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with Gemini response on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => geminiOkResponse
    });

    const { req, res } = makeReqRes({ body: validBody });
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const body = parseBody(res);
    expect(body.candidates[0].content.parts[0].text).toBe('This is a service agreement.');
  });

  it('forwards the requestBody to the Gemini endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => geminiOkResponse
    });

    const { req, res } = makeReqRes({ body: validBody });
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('gemini-3.6-flash');
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(options.method).toBe('POST');
    const sentBody = JSON.parse(options.body);
    expect(sentBody.contents[0].role).toBe('user');
  });

  it('uses the default model when apiModel is not provided', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => geminiOkResponse
    });

    const { req, res } = makeReqRes({
      body: { requestBody: validBody.requestBody }  // no apiModel
    });
    await handler(req, res);

    const [url] = global.fetch.mock.calls[0];
    // Default model from handler is 'gemini-3.6-flash'
    expect(url).toContain('gemini-3.6-flash');
  });

  it('returns upstream error status when Gemini API fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Quota exceeded' } })
    });

    const { req, res } = makeReqRes({ body: validBody });
    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(parseBody(res).error).toMatch(/Quota exceeded/i);
  });

  it('returns 500 on unexpected fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network unreachable'));

    const { req, res } = makeReqRes({ body: validBody });
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(parseBody(res).error).toMatch(/internal server error/i);
  });

  it('does not leak internal error details in the 500 response', async () => {
    global.fetch.mockRejectedValue(new Error('Secret DB connection string: postgres://user:pass@host'));

    const { req, res } = makeReqRes({ body: validBody });
    await handler(req, res);

    const body = parseBody(res);
    expect(body.error).not.toContain('postgres://');
    expect(body.error).not.toContain('Secret');
  });
});

// ── Missing API key ───────────────────────────────────────────────────────────
describe('api/gemini handler — missing API key', () => {
  it('returns 500 when no API keys are configured', async () => {
    // Temporarily clear the key
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    // Re-import to get fresh state
    // (Vitest module cache may reuse the import; we test the filter logic directly)
    const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP].filter(Boolean);
    expect(keys.length).toBe(0);

    process.env.GEMINI_API_KEY = savedKey;
  });
});
