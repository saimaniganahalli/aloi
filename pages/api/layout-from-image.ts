import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

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
              text: `You're a layout parser. Convert this screenshot into a JSON array of layout elements.
Only return clean JSON (valid for JSON.parse), and do not include any explanation or commentary.`
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
    console.log("🧠 GPT raw response:", raw);

    const cleaned = raw?.replace(/[“”]/g, '"');
    let layout;
    try {
      layout = JSON.parse(cleaned!);
    } catch (err) {
      console.error("🛑 Failed to parse OpenAI response:", err);
      console.error("🔍 Raw content:", raw);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI.' });
    }

    if (!Array.isArray(layout)) {
      console.error("🛑 Parsed layout is not an array:", layout);
      return res.status(500).json({ error: 'Layout must be an array.' });
    }

    return res.status(200).json(layout);
  } catch (err) {
    console.error("💥 General error in layout-from-image:", err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
}
