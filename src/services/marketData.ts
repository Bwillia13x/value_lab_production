import alphavantage from 'alphavantage';

type AlphaVantageInstance = ReturnType<typeof alphavantage> | null;

let alpha: AlphaVantageInstance = null;

function getAlpha(): AlphaVantageInstance {
  if (!alpha && process.env.ALPHA_VANTAGE_API_KEY) {
    alpha = alphavantage({ key: process.env.ALPHA_VANTAGE_API_KEY });
  }
  return alpha;
}

export async function getRealTimeQuote(ticker: string): Promise<any> {
  try {
    const alphaInstance = getAlpha();
    if (!alphaInstance) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }
    const data = await alphaInstance.data.quote(ticker);
    return data;
  } catch (error) {
    console.error('Error fetching real-time quote:', error);
    return null;
  }
}

export async function getFundamentals(ticker: string): Promise<any> {
  try {
    const alphaInstance = getAlpha();
    if (!alphaInstance) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }
    const data = await alphaInstance.fundamental.company_overview(ticker);
    return data;
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    return null;
  }
}