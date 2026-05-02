module.exports = async function handler(req, res) {
  const redisUrl = process.env.STORAGE_URL;
  if (!redisUrl) return res.status(500).json({ error: "No Redis URL" });

  // Simple Redis HTTP helper using Upstash REST API
  const redisRestUrl = redisUrl.replace("redis://", "https://").replace("rediss://", "https://");
  
  async function redisCmd(...args) {
    const url = redisUrl;
    // Use ioredis-compatible REST via Upstash
    const response = await fetch(`${redisRestUrl}`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    return response.json();
  }

  if (req.method === "GET") {
    // Get all words
    try {
      const result = await redisCmd("GET", "words");
      const words = result.result ? JSON.parse(result.result) : [];
      res.status(200).json(words);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else if (req.method === "POST") {
    // Save all words
    try {
      await redisCmd("SET", "words", JSON.stringify(req.body));
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).end();
  }
};
