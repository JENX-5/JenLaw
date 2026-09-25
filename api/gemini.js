/**
 * Vercel Serverless Function — Gemini API Proxy
 *
 * This function acts as a secure proxy between the client and the
 * Google Gemini API, keeping API keys server-side. It includes:
 * - Request validation (method, body)
 * - API key load balancing across multiple keys
 * - Request size limits to prevent abuse
 * - Generic error responses to avoid leaking internals
 */

/** Maximum allowed request body size in bytes (1MB) */
const MAX_BODY_SIZE = 1_048_576;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal Server Error: AI service unavailable.' }));
  }

  // Randomly select a key to distribute load across projects
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  try {
    const { apiModel = 'gemini-3.6-flash', requestBody } = req.body;

    if (!requestBody) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Missing requestBody' }));
    }

    // Validate request size to prevent abuse
    const bodyStr = JSON.stringify(requestBody);
    if (bodyStr.length > MAX_BODY_SIZE) {
      res.statusCode = 413;
      return res.end(JSON.stringify({ error: 'Request too large. Please reduce document size.' }));
    }

    // Validate model name to prevent path traversal
    const MODEL_PATTERN = /^[a-z0-9.-]+$/;
    if (!MODEL_PATTERN.test(apiModel)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid model name.' }));
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      res.statusCode = response.status || 500;
      return res.end(JSON.stringify({ error: data.error?.message || 'Gemini API Error' }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (error) {
    console.error('[JenLaw API] Internal error:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal server error. Please try again.' }));
  }
}
