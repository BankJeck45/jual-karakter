import OpenAI from 'openai';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, n = 4, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const results = [];
    const callsNeeded = Math.min(n, 4);

    for (let i = 0; i < callsNeeded; i++) {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        style: 'vivid',
      });

      results.push({
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
      });
    }

    return res.status(200).json({ images: results });
  } catch (err) {
    console.error('[DALL·E Error]', err.message);
    return res.status(500).json({
      error: err.message,
      type: err.type || 'unknown',
    });
  }
}
