export interface DcfInputs {
  currentEps: number;
  growthRate: number;
  discountRate: number;
  terminalGrowthRate: number;
  years: number;
}

export function runDcfModel(inputs: DcfInputs): number {
  const { currentEps, growthRate, discountRate, terminalGrowthRate, years } = inputs;

  let futureEps = currentEps;
  let discountedFutureEps = 0;

  for (let i = 0; i < years; i++) {
    futureEps *= 1 + growthRate;
    discountedFutureEps += futureEps / Math.pow(1 + discountRate, i + 1);
  }

  const terminalValue = (futureEps * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, years);

  return discountedFutureEps + discountedTerminalValue;
}