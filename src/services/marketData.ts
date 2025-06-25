import alphavantage from 'alphavantage';

const alpha = alphavantage({ key: process.env.ALPHA_VANTAGE_API_KEY! });

export async function getRealTimeQuote(ticker: string): Promise<any> {
  try {
    const data = await alpha.data.quote(ticker);
    return data;
  } catch (error) {
    console.error('Error fetching real-time quote:', error);
    return null;
  }
}

export async function getFundamentals(ticker: string): Promise<any> {
  try {
    const data = await alpha.fundamental.company_overview(ticker);
    return data;
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    return null;
  }
}