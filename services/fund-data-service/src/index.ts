import express, { RequestHandler } from 'express';
import { getFundReturns } from './fundFetcher';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 3001;
const redis = new Redis(process.env.REDIS_URL!);

const getFundDataHandler: RequestHandler = async (req, res) => {
  try {
    const { ticker } = req.params;
    const cacheKey = `fund:${ticker}:returns`;

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    const data = await getFundReturns(ticker, req);
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400); // Cache for 24 hours

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

app.get('/fund/:ticker', getFundDataHandler);

app.listen(port, () => {
  console.log(`Fund data service listening on http://localhost:${port}`);
});