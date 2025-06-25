import { mean, std } from 'mathjs';

// Calculate Value at Risk (VaR)
export function calculateVaR(returns: number[], confidenceLevel = 0.95): number {
  if (returns.length === 0) return 0;
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  return sortedReturns[index];
}

// Calculate Expected Shortfall (ES)
export function calculateES(returns: number[], confidenceLevel = 0.95): number {
  if (returns.length === 0) return 0;
  const varValue = calculateVaR(returns, confidenceLevel);
  const tailReturns = returns.filter(r => r < varValue);
  if (tailReturns.length === 0) return 0;
  return mean(...tailReturns);
}

// Calculate Beta
export function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  const assetMean = mean(...assetReturns);
  const marketMean = mean(...marketReturns);
  let covariance = 0;
  let marketVariance = 0;

  for (let i = 0; i < assetReturns.length; i++) {
    covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
  }

  return covariance / marketVariance;
}

// Calculate Sharpe Ratio
export function calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
  if (returns.length === 0) return 0;
  const excessReturns = returns.map(r => r - riskFreeRate);
  const excessMean = mean(...excessReturns);
  const excessStd = std(...excessReturns);
  if (excessStd === 0) return 0;
  return excessMean / excessStd;
}