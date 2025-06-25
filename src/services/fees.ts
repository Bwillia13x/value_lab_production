export interface AumFee {
  type: 'aum';
  rate: number; // Annual rate, e.g., 0.01 for 1%
}

export interface PerformanceFee {
  type: 'performance';
  rate: number; // e.g., 0.2 for 20%
  hurdleRate: number; // Annual rate, e.g., 0.05 for 5%
}

export type Fee = AumFee | PerformanceFee;

export function calculateAumFee(aum: number, fee: AumFee): number {
  return aum * fee.rate;
}

export function calculatePerformanceFee(
  aum: number,
  returns: number[],
  fee: PerformanceFee
): number {
  const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const excessReturn = totalReturn - fee.hurdleRate;
  if (excessReturn <= 0) return 0;

  return aum * excessReturn * fee.rate;
}