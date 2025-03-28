import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { imageDataURL } = req.body;

  if (!imageDataURL) {
    return res.status(400).json({ error: 'Image data missing' });
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
              text: `This is a UI screenshot. Return a clean JSON array of layout blocks with frame and text types. Use only valid double quotes and make sure it's JSON.parse safe.`
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
    const cleaned = raw?.replace(/[“”]/g, '"');
    const layout = JSON.parse(cleaned!);

    return res.status(200).json(layout);
  } catch (err) {
    console.error("OpenAI/CORS error:", err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
}