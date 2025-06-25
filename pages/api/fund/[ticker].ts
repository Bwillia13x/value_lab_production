import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { ticker } = req.query;
    
    if (!ticker || typeof ticker !== 'string') {
      res.status(400).json({ error: 'Invalid ticker parameter' });
      return;
    }
    
    const response = await fetch(`http://localhost:3001/fund/${ticker}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error fetching data from fund data service');
    }

    res.status(200).json(data);
  } catch (err: any) {
    console.error(`Error fetching data for ticker ${req.query.ticker}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}