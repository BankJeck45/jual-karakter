import OpenAI from 'openai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, n = 4, size = '1024x1024' } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const results = [];
    const callsNeeded = Math.min(n, 4);

    for (let i = 0; i < callsNeeded; i++) {
      let success = false;
      let attempts = 0;
      let currentPrompt = prompt;
      let style = 'natural';
      let quality = 'hd';

      while (!success && attempts < 2) {
        try {
          const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: currentPrompt,
            n: 1,
            size,
            quality,
            style,
          });

          results.push({
            url: response.data[0].url,
            revised_prompt: response.data[0].revised_prompt,
          });
          success = true;
        } catch (err) {
          attempts++;
          if (err.status === 400 && err.message?.includes('content_filter')) {
            // On filter block, strip everything to safe minimal prompt
            currentPrompt = 'A casual candid photo of a real person, everyday outfit, natural lighting, realistic photography,真人';
            style = 'natural';
            quality = 'standard';
          } else if (attempts >= 2) {
            throw err;
          }
        }
      }
    }

    return res.status(200).json({ images: results });
  } catch (err) {
    console.error('[DALL·E Error]', err.status, err.message);
    return res.status(err.status || 500).json({
      error: err.message,
      type: err.type || 'unknown',
    });
  }
}
