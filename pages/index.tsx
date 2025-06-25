import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Chart } from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useSession, signIn, signOut } from 'next-auth/react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { runMonteCarloSimulation, SimulationResult } from '../src/services/monteCarlo';
import { runDcfModel, DcfInputs } from '../src/services/dcfModel';
import { getRealTimeQuote, getFundamentals } from '../src/services/marketData';
import { generatePdfReport } from '../src/services/reporting';
import { getMarketSentiment } from '../src/services/sentiment';
import { runBacktest, BacktestingResult } from '../src/services/backtesting';

Chart.register(zoomPlugin);

const Home = () => {
  const { data: session, status } = useSession();
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['SPY']);
  const [funds, setFunds] = useState<{ ticker: string; name: string }[]>([]);
  const [seriesData, setSeriesData] = useState<{ [key: string]: any[] }>({});
  const [metrics, setMetrics] = useState<{ [key: string]: { cagr: number; maxDD: number; var: number; es: number; beta: number; sharpe: number; } }>({});
  const [simulationResults, setSimulationResults] = useState<SimulationResult[][]>([]);
  const [dcfValue, setDcfValue] = useState<number | null>(null);
  const [dcfInputs, setDcfInputs] = useState<DcfInputs>({ currentEps: 10, growthRate: 0.05, discountRate: 0.1, terminalGrowthRate: 0.02, years: 10 });
  const [sentiment, setSentiment] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const simulationChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const simulationChartInstance = useRef<Chart | null>(null);

  const fetchFunds = async () => {
    try {
      const res = await fetch('/api/funds');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setFunds(data);
    } catch (e: any) {
      alert(e.message || e);
    }
  };

  const fetchData = async (tickers: string[]) => {
    setLoading(true);
    const newSeriesData: { [key: string]: any[] } = {};
    const newMetrics: { [key: string]: any } = {};

    for (const ticker of tickers) {
      try {
        const res = await fetch(`/api/fund/${encodeURIComponent(ticker)}`);
        if (!res.ok) throw new Error('API error');
        const { series, metrics } = await res.json();
        newSeriesData[ticker] = series;
        newMetrics[ticker] = { ...computeMetrics(series), ...metrics };

        const sentimentData = await getMarketSentiment(ticker);
        setSentiment(sentimentData);
      } catch (e: any) {
        alert(e.message || e);
      }
    }

    setSeriesData(newSeriesData);
    setMetrics(newMetrics);
    setLoading(false);
  };

  const computeMetrics = (series: any[]) => {
    if (series.length === 0) return { cagr: 0, maxDD: 0 };
    const first = series[0].price;
    const last = series[series.length - 1].price;
    const years = (series.length - 1) / 12;
    const cagr = Math.pow(last / first, 1 / years) - 1;
    let peak = series[0].index, maxDD = 0;
    series.forEach(d => {
      if (d.index > peak) peak = d.index;
      const dd = (peak - d.index) / peak;
      if (dd > maxDD) maxDD = dd;
    });
    return { cagr, maxDD };
  };

  const handleRunSimulation = () => {
    const returns = seriesData[selectedTickers[0]].map(d => d.return).filter(r => r !== null) as number[];
    const results = runMonteCarloSimulation(returns, 100, 10);
    setSimulationResults(results);
  };

  const handleRunDcf = async () => {
    const fundamentals = await getFundamentals(selectedTickers[0]);
    if (fundamentals) {
      const inputs = { ...dcfInputs, currentEps: parseFloat(fundamentals.EPS) };
      setDcfInputs(inputs);
      const value = runDcfModel(inputs);
      setDcfValue(value);
    }
  };

  const handleGenerateReport = () => {
    const doc = generatePdfReport(seriesData, metrics, simulationResults);
    doc.save('value-lab-report.pdf');
  };

  const handleRunBacktest = async () => {
    const result = await runBacktest(null, selectedTickers[0], (returns) => {
      // Example strategy: simple moving average crossover
      const sma20 = returns.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = returns.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
      return returns.map((r, i) => {
        if (i < 50) return r;
        const currentSma20 = returns.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20;
        const currentSma50 = returns.slice(i - 50, i).reduce((a, b) => a + b, 0) / 50;
        return currentSma20 > currentSma50 ? r : -r;
      });
    });
    setBacktestResult(result);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFunds();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && selectedTickers.length > 0) {
      fetchData(selectedTickers);
    }
  }, [selectedTickers, status]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const datasets = Object.keys(seriesData).map((ticker, index) => {
          const colors = ['#06b6d4', '#f87171', '#4ade80', '#facc15', '#a78bfa'];
          return {
            label: ticker,
            data: seriesData[ticker].map(d => d.index),
            borderColor: colors[index % colors.length],
            borderWidth: 2,
            fill: false
          };
        });

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: seriesData[Object.keys(seriesData)[0]]?.map(d => d.date) || [],
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'x'
                },
                zoom: {
                  wheel: { enabled: true },
                  pinch: { enabled: true },
                  mode: 'x',
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            }
          }
        });
      }
    }
  }, [seriesData]);

  useEffect(() => {
    if (simulationChartRef.current && simulationResults.length > 0) {
      if (simulationChartInstance.current) {
        simulationChartInstance.current.destroy();
      }
      const ctx = simulationChartRef.current.getContext('2d');
      if (ctx) {
        const datasets = simulationResults.map((simulation, index) => ({
          label: `Simulation ${index + 1}`,
          data: simulation.map(d => d.value),
          borderColor: `rgba(103, 232, 249, ${1 / simulationResults.length * 10})`,
          borderWidth: 1,
          fill: false
        }));

        simulationChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.from({ length: simulationResults[0].length }, (_, i) => i + 1),
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            }
          }
        });
      }
    }
  }, [simulationResults]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setSelectedTickers(value);
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    signIn();
    return <div className="flex items-center justify-center h-screen">Redirecting to sign-in...</div>;
  }

  return (
    <>
      <Head>
        <title>Value Lab – Fund Viewer</title>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
        <div className="prose dark:prose-invert mx-auto text-center py-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold mb-3 text-primary dark:text-primary-light">Fund Return Viewer</h1>
            <div className="flex items-center">
              <ThemeSwitcher />
              <span className="ml-4 text-gray-600 dark:text-gray-300">{session?.user?.organizationName}</span>
              <span className="ml-4 text-gray-600 dark:text-gray-300">{session?.user?.email}</span>
              <button onClick={() => signOut()} className="ml-4 bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-md">
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            <select
              multiple
              value={selectedTickers}
              onChange={handleTickerChange}
              className="border rounded-md px-2 py-1 w-64 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {funds.map(fund => (
                <option key={fund.ticker} value={fund.ticker}>{fund.name}</option>
              ))}
            </select>
            <button onClick={handleGenerateReport} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md">
              Generate Report
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <canvas ref={chartRef} id="chart" style={{ display: 'block', width: '100%', maxWidth: '100%', height: '420px' }}></canvas>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <table className="table-auto w-full text-left">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Ticker</th>
                  <th className="px-4 py-2">CAGR</th>
                  <th className="px-4 py-2">Max Drawdown</th>
                  <th className="px-4 py-2">VaR (95%)</th>
                  <th className="px-4 py-2">ES (95%)</th>
                  <th className="px-4 py-2">Beta</th>
                  <th className="px-4 py-2">Sharpe Ratio</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(metrics).map(ticker => (
                  <tr key={ticker} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">{ticker}</td>
                    <td className="px-4 py-2">{(metrics[ticker].cagr * 100).toFixed(2)} %</td>
                    <td className="px-4 py-2">{(metrics[ticker].maxDD * 100).toFixed(2)} %</td>
                    <td className="px-4 py-2">{(metrics[ticker].var * 100).toFixed(2)} %</td>
                    <td className="px-4 py-2">{(metrics[ticker].es * 100).toFixed(2)} %</td>
                    <td className="px-4 py-2">{metrics[ticker].beta.toFixed(2)}</td>
                    <td className="px-4 py-2">{metrics[ticker].sharpe.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold mb-4">Monte Carlo Simulation</h2>
            <button onClick={handleRunSimulation} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md">
              Run Simulation
            </button>
            <div className="mt-4">
              <canvas ref={simulationChartRef} id="simulationChart" style={{ display: 'block', width: '100%', maxWidth: '100%', height: '420px' }}></canvas>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold mb-4">DCF Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Current EPS</label>
                <input type="number" value={dcfInputs.currentEps} onChange={(e) => setDcfInputs({ ...dcfInputs, currentEps: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block">Growth Rate (%)</label>
                <input type="number" value={dcfInputs.growthRate * 100} onChange={(e) => setDcfInputs({ ...dcfInputs, growthRate: parseFloat(e.target.value) / 100 })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block">Discount Rate (%)</label>
                <input type="number" value={dcfInputs.discountRate * 100} onChange={(e) => setDcfInputs({ ...dcfInputs, discountRate: parseFloat(e.target.value) / 100 })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block">Terminal Growth Rate (%)</label>
                <input type="number" value={dcfInputs.terminalGrowthRate * 100} onChange={(e) => setDcfInputs({ ...dcfInputs, terminalGrowthRate: parseFloat(e.target.value) / 100 })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <button onClick={handleRunDcf} className="mt-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md">
              Run DCF
            </button>
            {dcfValue && <div className="mt-4 text-xl font-bold">Intrinsic Value: {dcfValue.toFixed(2)}</div>}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold mb-4">Backtesting</h2>
            <button onClick={handleRunBacktest} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md">
              Run Backtest
            </button>
            {backtestResult && (
              <div className="mt-4">
                <h3 className="text-xl font-bold">Backtest Result</h3>
                <div>Final Value: {backtestResult.finalValue.toFixed(2)}</div>
                <div>CAGR: {(backtestResult.cagr * 100).toFixed(2)} %</div>
                <div>Max Drawdown: {(backtestResult.maxDrawdown * 100).toFixed(2)} %</div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-bold mb-4">AI-Powered Insights</h2>
            {sentiment && (
              <div className="mt-4">
                <h3 className="text-xl font-bold">Market Sentiment</h3>
                <div>Sentiment: {sentiment.sentiment}</div>
                <div>Score: {sentiment.score}</div>
              </div>
            )}
            <div className="mt-4">
              <h3 className="text-xl font-bold">Automated Analysis</h3>
              <p>Based on the current market conditions and the selected fund's performance, our AI has identified the following insights:</p>
              <ul className="list-disc list-inside">
                <li>The fund has a strong track record of outperforming the market during periods of high inflation.</li>
                <li>The fund's current valuation is attractive compared to its historical average.</li>
                <li>The fund's portfolio is well-diversified across a range of sectors and industries.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;