import OpenAI from 'openai';

function sanitizePrompt(prompt) {
  // Remove triggering words that cause content filter blocks
  let safe = prompt
    .replace(/\bsexy\b/gi, 'stylish')
    .replace(/\bseksi\b/gi, 'stylish')
    .replace(/\brevealing\b/gi, 'fashionable')
    .replace(/\bcleavage\b/gi, 'neckline')
    .replace(/\bbusty\b/gi, 'elegant')
    .replace(/\bbikini\b/gi, 'swimwear')
    .replace(/\bbodycon\b/gi, 'fitted dress')
    .replace(/\btight\b/gi, 'well-fitted')
    .replace(/\bhotpants\b/gi, 'shorts')
    .replace(/\bsport bra\b/gi, 'athletic top')
    .replace(/\blegging\b/gi, 'yoga pants')
    .replace(/\bswimsuit\b/gi, 'beachwear')
    .replace(/\b8K\b/gi, '')
    .replace(/\bcinematic\b/gi, 'natural')
    .replace(/masterpiece/gi, '')
    .replace(/photorealistic/gi, 'high quality');
  
  // Ensure safe content keyword
  if (!safe.toLowerCase().includes('safe content') && !safe.toLowerCase().includes('modest')) {
    safe += ', modest fashion, family-friendly content';
  }
  
  return safe.replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let { prompt, n = 4, size = '1024x1024' } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Try vivid first, fallback to natural if blocked
    let style = 'vivid';
    let quality = 'standard';
    
    // Sanitize prompt
    prompt = sanitizePrompt(prompt);
    
    const results = [];
    const callsNeeded = Math.min(n, 4);

    for (let i = 0; i < callsNeeded; i++) {
      let success = false;
      let attempts = 0;
      const maxAttempts = 2;

      while (!success && attempts < maxAttempts) {
        try {
          const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt,
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
          // If content filter blocks, switch to natural style + even safer prompt
          if (err.status === 400 && err.message?.includes('content_filter')) {
            style = 'natural';
            quality = 'standard';
            // Strip everything remotely risqué
            prompt = prompt
              .replace(/fitted/gi, 'casual')
              .replace(/elegant/gi, '')
              .replace(/fashion/gi, 'clothing')
              .replace(/adorable/gi, '')
              .replace(/beautiful/gi, '')
              .replace(/stylish/gi, 'casual');
            prompt = 'A portrait photo of a person wearing casual clothing, neutral background, natural lighting, everyday look, safe content, G-rated';
          } else if (attempts >= maxAttempts) {
            throw err; // Give up
          }
        }
      }
    }

    return res.status(200).json({ images: results });
  } catch (err) {
    console.error('[DALL·E Error]', err.status, err.message);
    return res.status(err.status || 500).json({
      error: err.message,
      type: err.type || 'content_filter',
      hint: 'Try a simpler prompt without revealing or suggestive clothing descriptions.',
    });
  }
}
