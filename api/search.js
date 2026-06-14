export default async function handler(req, res) {
  const query = req.query?.q || '';

  if (!query) {
    res.status(400).json({ error: 'Missing query' });
    return;
  }

  try {
    const proxyUrl = `https://r.jina.ai/http://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(proxyUrl, { cache: 'no-store' });

    if (!response.ok) {
      res.status(response.status).json({ error: 'Proxy fetch failed' });
      return;
    }

    const text = await response.text();
    res.status(200).json({ text });
  } catch (error) {
    console.error('Search API error', error);
    res.status(502).json({ error: 'Search API unavailable' });
  }
}
