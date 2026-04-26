export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], system = '', temperature = 0.7 } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  // Build history for Gemini
  const contents = [];

  for (const h of history) {
    contents.push({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text || '' }]
    });
  }

  // Current user message
  contents.push({ role: 'user', parts: [{ text: message }] });

  const body = {
    contents,
    generationConfig: { temperature, maxOutputTokens: 4096 },
    systemInstruction: system ? { parts: [{ text: system }] } : undefined
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';

    return res.status(200).json({ answer });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
                                              }
