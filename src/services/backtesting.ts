import fetch from 'node-fetch';

export interface BacktestingResult {
  finalValue: number;
  cagr: number;
  maxDrawdown: number;
}

async function getFundReturns(ticker: string): Promise<any> {
  const response = await fetch(`http://localhost:3001/fund/${ticker}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error fetching data from fund data service');
  }
  return data;
}

export async function runBacktest(
  ticker: string,
  strategy: (returns: number[]) => number[]
): Promise<BacktestingResult> {
  const { series } = await getFundReturns(ticker);
  const returns = series.map((d: any) => d.return).filter((r: any) => r !== null) as number[];

  const strategyReturns = strategy(returns);

  const finalValue = strategyReturns.reduce((acc, r) => acc * (1 + r), 100);
  const years = strategyReturns.length / 12;
  const cagr = Math.pow(finalValue / 100, 1 / years) - 1;

  let peak = 100;
  let maxDD = 0;
  let currentValue = 100;
  for (const r of strategyReturns) {
    currentValue *= 1 + r;
    if (currentValue > peak) peak = currentValue;
    const dd = (peak - currentValue) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return { finalValue, cagr, maxDrawdown: maxDD };
}