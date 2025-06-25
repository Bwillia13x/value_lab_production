import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePdfReport(
  fundData: any,
  metrics: any,
  simulationResults: any
): jsPDF {
  const doc = new jsPDF();

  doc.text('Value Lab Report', 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [['Ticker', 'CAGR', 'Max Drawdown', 'VaR (95%)', 'ES (95%)', 'Beta', 'Sharpe Ratio']],
    body: Object.keys(metrics).map(ticker => [
      ticker,
      `${(metrics[ticker].cagr * 100).toFixed(2)} %`,
      `${(metrics[ticker].maxDD * 100).toFixed(2)} %`,
      `${(metrics[ticker].var * 100).toFixed(2)} %`,
      `${(metrics[ticker].es * 100).toFixed(2)} %`,
      metrics[ticker].beta.toFixed(2),
      metrics[ticker].sharpe.toFixed(2),
    ]),
  });

  doc.addPage();
  doc.text('Monte Carlo Simulation', 14, 16);

  // Note: This is a simplified representation of the simulation data.
  // A more advanced implementation would include a chart image.
  autoTable(doc, {
    startY: 22,
    head: [['Simulation', 'Final Value']],
    body: simulationResults.map((sim: any, i: number) => [
      `Simulation ${i + 1}`,
      sim[sim.length - 1].value.toFixed(2),
    ]),
  });

  return doc;
}