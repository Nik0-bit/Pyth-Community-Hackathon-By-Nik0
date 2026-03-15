const LITE_API = 'https://lite-api.jup.ag/swap/v1';
const MAIN_API = 'https://api.jup.ag/swap/v1';

const LITE_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

function getJupiterConfig(): { baseUrl: string; headers: Record<string, string>; isMain: boolean } {
  let apiKey = (process.env.JUPITER_API_KEY || '').trim();
  if (apiKey.startsWith('-')) apiKey = apiKey.slice(1).trim();
  if (apiKey) {
    return { baseUrl: MAIN_API, headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, isMain: true };
  }
  return { baseUrl: LITE_API, headers: LITE_HEADERS, isMain: false };
}

// Solana network only. Any token from another network (BTC, ETH, BNB, ADA, etc.) — request rejected.
export const TOKEN_MINTS: Record<string, string> = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF:  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JTO:  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  RAY:  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  SRM:  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  MNGO: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3zFkGM4kpBq8Ly2U',
  stSOL: '7dHbWXmni3pP2L1YojcCQQ6eUBv27Z9Fg9L4mqpBxKah',
  LDO:  'HZRCwxP2Yiq5RW5PVFVtbzEY3BUMadq8ZR4kZaqzQqXE',
};

const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9, USDC: 6, USDT: 6, JUP: 6, PYTH: 6, BONK: 5, WIF: 6, JTO: 9, RAY: 6, ORCA: 6,
  SRM: 6, MNGO: 6, mSOL: 9, stSOL: 9, LDO: 8,
};

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputToken: string;
  outputToken: string;
  inAmount: number;
  outAmount: number;
  outAmountFormatted: number;
  priceImpactPct: number;
  routePlan: string[];
  slippageBps: number;
  quoteResponse: any;
}

export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

const ALIASES: Record<string, string> = { WSOL: 'SOL', USD: 'USDC' };

function resolveSymbol(sym: string): string {
  const u = sym.toUpperCase();
  return ALIASES[u] || u;
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps = 50
): Promise<SwapQuote> {
  const fromUpper = resolveSymbol(fromToken);
  const toUpper = resolveSymbol(toToken);
  const inputMint = TOKEN_MINTS[fromUpper];
  const outputMint = TOKEN_MINTS[toUpper];

  if (!inputMint) throw new Error(`Solana network only. Token "${fromToken}" is not supported — swaps are for Solana network tokens only.`);
  if (!outputMint) throw new Error(`Solana network only. Token "${toToken}" is not supported — swaps are for Solana network tokens only.`);

  const decimals = TOKEN_DECIMALS[fromUpper] ?? 9;
  const lamports = Math.floor(amount * Math.pow(10, decimals));

  let baseUrl: string;
  let headers: Record<string, string>;
  let usedLite = false;

  const config = getJupiterConfig();
  baseUrl = config.baseUrl;
  headers = config.headers;

  const url = `${baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippageBps}`;
  let res = await globalThis.fetch(url, { headers });
  let raw = await res.text();

  if (!res.ok && (res.status === 401 || res.status === 481) && config.isMain) {
    baseUrl = LITE_API;
    headers = LITE_HEADERS;
    usedLite = true;
    res = await globalThis.fetch(url, { headers });
    raw = await res.text();
  }

  if (!res.ok) {
    try {
      const body = JSON.parse(raw) as { error?: string; errorCode?: string; code?: number };
      if (body.errorCode === 'TOKEN_NOT_TRADABLE' || (body.error && body.error.includes('not tradable'))) {
        throw new Error('This token is not currently available for swap on Jupiter. Try another Solana network token.');
      }
      if ((res.status === 401 || res.status === 481) && !usedLite) {
        throw new Error('Jupiter API key invalid or unauthorized. Remove JUPITER_API_KEY from .env to use the limited lite API (no PYTH), or get a valid key at https://portal.jup.ag/api-keys');
      }
    } catch (e: any) {
      if (e.message?.includes('not currently available') || e.message?.includes('Jupiter API key')) throw e;
    }
    throw new Error(`Jupiter quote failed: ${raw.slice(0, 200)}`);
  }
  const quote = JSON.parse(raw) as any;
  if (usedLite) quote._usedLite = true;

  const outDecimals = TOKEN_DECIMALS[toUpper] ?? 6;
  const outAmountFormatted = parseInt(quote.outAmount) / Math.pow(10, outDecimals);

  const routePlan: string[] = (quote.routePlan || []).map((step: any) => {
    const label = step.swapInfo?.label || step.ammKey?.slice(0, 8) || 'DEX';
    return label;
  });

  return {
    inputMint,
    outputMint,
    inputToken: fromUpper,
    outputToken: toUpper,
    inAmount: amount,
    outAmount: parseInt(quote.outAmount),
    outAmountFormatted: parseFloat(outAmountFormatted.toFixed(6)),
    priceImpactPct: parseFloat(parseFloat(quote.priceImpactPct || '0').toFixed(4)),
    routePlan: routePlan.length > 0 ? routePlan : ['Jupiter Aggregator'],
    slippageBps,
    quoteResponse: quote,
  };
}

export async function buildSwapTransaction(
  quoteResponse: any,
  userPublicKey: string
): Promise<SwapTransaction> {
  const useLite = quoteResponse && quoteResponse._usedLite === true;
  const config = getJupiterConfig();
  const baseUrl = useLite ? LITE_API : config.baseUrl;
  const headers = useLite ? LITE_HEADERS : config.headers;
  const cleanQuote = { ...quoteResponse };
  delete cleanQuote._usedLite;
  const res = await globalThis.fetch(`${baseUrl}/swap`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      quoteResponse: cleanQuote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter swap tx failed: ${err}`);
  }

  const data = await res.json() as any;
  return {
    swapTransaction: data.swapTransaction,
    lastValidBlockHeight: data.lastValidBlockHeight,
  };
}

export function getSupportedSwapTokens(): string[] {
  return Object.keys(TOKEN_MINTS);
}
