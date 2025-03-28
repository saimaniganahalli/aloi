import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // ✅ Allow origin for POST requests too
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageDataURL } = req.body;

  if (!imageDataURL) {
    return res.status(400).json({ error: 'Missing imageDataURL' });
  }

  try {
    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You're a layout parser. Convert this screenshot into a JSON array of layout elements. Use only valid JSON — no explanation, just a parseable array.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataURL,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const raw = gptRes.choices?.[0]?.message?.content;
    console.log("GPT raw response:", raw);

    const cleaned = raw?.replace(/[“”]/g, '"');
    const layout = JSON.parse(cleaned!);

    return res.status(200).json(layout);
  } catch (err) {
    console.error("Layout from image failed:", err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
}
