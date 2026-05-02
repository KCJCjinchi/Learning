module.exports = async function handler(req, res) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return res.status(500).json({ error: "No Redis URL" });

  // Parse redis://default:PASSWORD@HOST:PORT
  const url = new URL(redisUrl);
  const host = url.hostname;
  const port = url.port || 6379;
  const password = url.password;

  // Use Upstash-compatible REST via direct TCP is not possible in serverless
  // Use node's net module won't work either - use ioredis via dynamic import
  // Instead, use a simple HTTP-based Redis REST approach with redislabs
  // Actually use the @upstash/redis pattern with fetch to Redis REST API

  // For Redis Labs, we need to use a different approach
  // Let's use a simple in-memory workaround with Vercel's built-in storage
  // by calling redis commands via HTTP using the redis-cli REST endpoint

  const { createClient } = await import('redis');
  
  const client = createClient({ url: redisUrl });
  await client.connect();

  try {
    if (req.method === "GET") {
      const result = await client.get("words");
      const words = result ? JSON.parse(result) : [];
      await client.disconnect();
      res.status(200).json(words);
    } else if (req.method === "POST") {
      await client.set("words", JSON.stringify(req.body));
      await client.disconnect();
      res.status(200).json({ ok: true });
    } else {
      await client.disconnect();
      res.status(405).end();
    }
  } catch (e) {
    await client.disconnect().catch(() => {});
    res.status(500).json({ error: e.message });
  }
};
