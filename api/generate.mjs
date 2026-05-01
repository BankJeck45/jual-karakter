import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, n = 4, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[DALL·E] Generating:', prompt.substring(0, 100) + '...');

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

    console.log(`[DALL·E] Generated ${results.length} images`);
    res.json({ images: results });
  } catch (err) {
    console.error('[DALL·E Error]', err.message);
    res.status(500).json({
      error: err.message,
      type: err.type || 'unknown',
    });
  }
});

export default app;
