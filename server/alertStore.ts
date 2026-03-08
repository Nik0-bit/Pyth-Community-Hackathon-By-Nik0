import { randomUUID } from 'crypto';

export type AlertCondition = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'cancelled';

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  email: string;
  note: string;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  progress: number;
}

const alerts: Map<string, PriceAlert> = new Map();

export function createAlert(params: {
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  email: string;
  note?: string;
}): PriceAlert {
  const alert: PriceAlert = {
    id: randomUUID(),
    symbol: params.symbol.toUpperCase(),
    condition: params.condition,
    targetPrice: params.targetPrice,
    currentPrice: params.currentPrice,
    email: params.email,
    note: params.note || '',
    status: 'active',
    createdAt: Date.now(),
    progress: calculateProgress(params.condition, params.currentPrice, params.targetPrice),
  };
  alerts.set(alert.id, alert);
  return alert;
}

export function getAlerts(): PriceAlert[] {
  return Array.from(alerts.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getActiveAlerts(): PriceAlert[] {
  return getAlerts().filter(a => a.status === 'active');
}

export function deleteAlert(id: string): boolean {
  return alerts.delete(id);
}

export function updateAlertPrice(id: string, currentPrice: number): PriceAlert | null {
  const alert = alerts.get(id);
  if (!alert || alert.status !== 'active') return null;
  alert.currentPrice = currentPrice;
  alert.progress = calculateProgress(alert.condition, currentPrice, alert.targetPrice);
  return alert;
}

export function triggerAlert(id: string): PriceAlert | null {
  const alert = alerts.get(id);
  if (!alert) return null;
  alert.status = 'triggered';
  alert.triggeredAt = Date.now();
  return alert;
}

export function checkAlertCondition(alert: PriceAlert, price: number): boolean {
  if (alert.status !== 'active') return false;
  if (alert.condition === 'above') return price >= alert.targetPrice;
  if (alert.condition === 'below') return price <= alert.targetPrice;
  return false;
}

function calculateProgress(condition: AlertCondition, current: number, target: number): number {
  if (condition === 'above') {
    return Math.min(100, Math.max(0, (current / target) * 100));
  } else {
    if (target === 0) return 100;
    return Math.min(100, Math.max(0, (1 - (current - target) / current) * 100));
  }
}
