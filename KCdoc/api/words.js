module.exports = async function handler(req, res) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return res.status(500).json({ error: "No Redis URL" });

  // Parse Upstash Redis URL: redis://default:PASSWORD@HOST:PORT
  const url = new URL(redisUrl);
  const password = url.password;
  const host = url.hostname;
  const restUrl = `https://${host}`;

  async function redisGet(key) {
    const r = await fetch(`${restUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${password}` }
    });
    const data = await r.json();
    return data.result;
  }

  async function redisSet(key, value) {
    const r = await fetch(`${restUrl}/set/${key}`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${password}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value })
    });
    return r.json();
  }

  if (req.method === "GET") {
    try {
      const result = await redisGet("words");
      const words = result ? JSON.parse(result) : [];
      res.status(200).json(words);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === "POST") {
    try {
      await redisSet("words", JSON.stringify(req.body));
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
};
