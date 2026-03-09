const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1';

export const TOKEN_MINTS: Record<string, string> = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  ETH:  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  BTC:  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGs1X9UKNjJNBVxdqL4k6VWovxXN8YJHa',
  BNB:  '9gP2kCy3wA1ctvYWQk75guqXuzoJGLnMQhxKqnZbEFYS',
  ADA:  '3SQU5CVPTN31VJFU11f5NHCAM5DaJRPfMhAMMnE1WKEG',
};

const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9, USDC: 6, USDT: 6, ETH: 8, BTC: 8, JUP: 6, PYTH: 6, BNB: 8, ADA: 6,
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

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps = 50
): Promise<SwapQuote> {
  const fromUpper = fromToken.toUpperCase();
  const toUpper = toToken.toUpperCase();
  const inputMint = TOKEN_MINTS[fromUpper];
  const outputMint = TOKEN_MINTS[toUpper];

  if (!inputMint) throw new Error(`Unsupported input token: ${fromToken}`);
  if (!outputMint) throw new Error(`Unsupported output token: ${toToken}`);

  const decimals = TOKEN_DECIMALS[fromUpper] ?? 9;
  const lamports = Math.floor(amount * Math.pow(10, decimals));

  const url = `${JUPITER_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippageBps}`;

  const res = await globalThis.fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jupiter quote failed: ${err}`);
  }
  const quote = await res.json() as any;

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
  const res = await globalThis.fetch(`${JUPITER_QUOTE_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
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
