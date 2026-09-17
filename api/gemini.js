export default async function handler(req, res) {
  // Pure Node HTTP methods for compatibility with both Vercel and local Vite proxy
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      res.statusCode = response.status || 500;
      return res.end(JSON.stringify({ error: data.error?.message || 'Gemini API Error' }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: error.message }));
  }
}
