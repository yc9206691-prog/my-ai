export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], system = '', temperature = 0.7 } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  // Build messages array for OpenAI
  const messages = [];

  // System prompt
  if (system) {
    messages.push({ role: 'system', content: system });
  }

  // Chat history
  for (const h of history) {
    messages.push({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text || ''
    });
  }

  // Current user message
  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'OpenAI API error' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response received.';

    return res.status(200).json({ answer });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
