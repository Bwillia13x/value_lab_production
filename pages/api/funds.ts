import type { NextApiRequest, NextApiResponse } from 'next';
import { funds } from '../../src/config/funds';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(funds);
}