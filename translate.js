export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_TRANSLATE_API_KEY in Vercel Environment Variables.' });
  }

  try {
    const { text, direction } = req.body || {};
    const cleanText = String(text || '').trim();
    const allowedDirection = direction === 'ja-en' ? 'ja-en' : 'en-ja';

    if (!cleanText) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    if (cleanText.length > 1000) {
      return res.status(400).json({ error: 'Text is too long. Keep translations under 1000 characters.' });
    }

    const source = allowedDirection === 'ja-en' ? 'ja' : 'en';
    const target = allowedDirection === 'ja-en' ? 'en' : 'ja';

    const googleResponse = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: cleanText, source, target, format: 'text' })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      const message = data?.error?.message || 'Google Translation API error.';
      return res.status(googleResponse.status).json({ error: message });
    }

    const translatedText = data?.data?.translations?.[0]?.translatedText || '';
    return res.status(200).json({ translatedText, source, target, direction: allowedDirection });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Translation failed.' });
  }
}
