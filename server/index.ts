import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env file
config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// POST endpoint for rewriting a prompt using OpenAI
app.post('/api/gpt-rewrite', async (req: express.Request, res: express.Response) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check (optional)
app.get('/', (_req, res) => {
  res.send('ClarityHQ API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
