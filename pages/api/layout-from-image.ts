import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
              text: `This is a UI screenshot. Return a JSON array of frames and text nodes with coordinates, sizes, and content, suitable to be recreated in Figma. Use "frame" and "text" as types.`
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

    const layout = gptRes.choices?.[0]?.message?.content;
    const parsed = JSON.parse(layout!);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
}