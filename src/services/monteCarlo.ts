import { mean, std, random } from 'mathjs';

export interface SimulationResult {
  period: number;
  value: number;
}

export function runMonteCarloSimulation(
  returns: number[],
  numSimulations: number,
  numYears: number
): SimulationResult[][] {
  const monthlyReturns = returns.map(r => r / 12);
  const meanReturn = mean(...monthlyReturns);
  const stdDev = std(...monthlyReturns);

  const results: SimulationResult[][] = [];

  for (let i = 0; i < numSimulations; i++) {
    const simulation: SimulationResult[] = [];
    let value = 100;
    for (let j = 0; j < numYears * 12; j++) {
      const randomValue = random() * 2 - 1; // Generate a random number between -1 and 1
      const returnValue = meanReturn + randomValue * stdDev;
      value *= 1 + returnValue;
      simulation.push({ period: j + 1, value });
    }
    results.push(simulation);
  }

  return results;
}