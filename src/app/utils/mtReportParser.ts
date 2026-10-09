import type { Trade } from '../data/types';

function determineTradeSession(d: Date): 'New York' | 'London' | 'Tokyo' | 'Sydney' {
  const h = d.getUTCHours();
  if (h >= 13 && h < 21) return 'New York';
  if (h >= 7 && h < 15) return 'London';
  if (h >= 0 && h < 9) return 'Tokyo';
  return 'Sydney';
}

export interface ParsedMtReport {
  trades: Trade[];
  balance?: number;
  equity?: number;
}

export function parseMtReport(text: string, accountId: string): ParsedMtReport {
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || trimmed.includes('<html') || trimmed.includes('<table')) {
    return parseMtHtmlReport(trimmed, accountId);
  }
  return parseMtCsvReport(trimmed, accountId);
}

function parseMtHtmlReport(html: string, accountId: string): ParsedMtReport {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const trades: Trade[] = [];
  let detectedBalance: number | undefined;

  const rows = Array.from(doc.querySelectorAll('tr'));
  let inPositionsSection = false;
  let inDealsSection = false;

  for (const row of rows) {
    const text = row.textContent?.toLowerCase() || '';
    if (text.includes('positions') || text.includes('closed transactions') || text.includes('closed trades')) {
      inPositionsSection = true;
      inDealsSection = false;
      continue;
    }
    if (text.includes('deals') || text.includes('orders')) {
      inDealsSection = true;
      inPositionsSection = false;
      continue;
    }
    if (text.includes('balance:') || text.includes('closed p/l:')) {
      const match = row.textContent?.match(/balance:\s*([\d,\.\-]+)/i) || row.textContent?.match(/closed p\/l:\s*([\d,\.\-]+)/i);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) detectedBalance = val;
      }
    }

    const cells = Array.from(row.querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
    if (cells.length < 9) continue;

    // Check if cell 0 or 1 is a ticket number
    const firstCell = cells[0].replace('#', '');
    const isTicket = /^\d{5,12}$/.test(firstCell);
    if (!isTicket) continue;

    const ticket = firstCell;
    // MT4/MT5 position table format usually:
    // Ticket | Open Time | Type | Volume | Symbol | Price | S/L | T/P | Close Time | Price | Commission | Taxes | Swap | Profit
    // Or MT5:
    // Position | Time | Type | Volume | Price | S/L | T/P | Time | Price | Commission | Swap | Profit
    let openTimeStr = '';
    let typeStr = '';
    let volume = 0;
    let symbol = '';
    let openPrice = 0;
    let closeTimeStr = '';
    let closePrice = 0;
    let commission = 0;
    let swap = 0;
    let profit = 0;

    for (let i = 1; i < cells.length; i++) {
      const c = cells[i];
      if (/^\d{4}\.\d{2}\.\d{2}/.test(c) || /^\d{4}-\d{2}-\d{2}/.test(c)) {
        if (!openTimeStr) openTimeStr = c.replace(/\./g, '-');
        else if (!closeTimeStr) closeTimeStr = c.replace(/\./g, '-');
      } else if (c.toLowerCase() === 'buy' || c.toLowerCase() === 'sell') {
        typeStr = c.toLowerCase() === 'buy' ? 'Buy' : 'Sell';
      } else if (/^[A-Z0-9_\.]{3,10}$/.test(c) && !symbol && isNaN(Number(c))) {
        symbol = c.toUpperCase();
      }
    }

    // Profit is almost always the last numeric cell
    const lastCellVal = parseFloat(cells[cells.length - 1].replace(/,/g, ''));
    if (!isNaN(lastCellVal)) {
      profit = lastCellVal;
    }

    // Try finding commission & swap in cells before last
    const secondLast = parseFloat(cells[cells.length - 2]?.replace(/,/g, ''));
    const thirdLast = parseFloat(cells[cells.length - 3]?.replace(/,/g, ''));
    if (!isNaN(secondLast)) swap = secondLast;
    if (!isNaN(thirdLast) && thirdLast < 0) commission = thirdLast;

    if (!symbol) symbol = 'FOREX';
    if (!typeStr) typeStr = 'Buy';

    const openDate = openTimeStr ? new Date(openTimeStr) : new Date();
    const closeDate = closeTimeStr ? new Date(closeTimeStr) : undefined;
    const totalPnl = Number((profit + commission + swap).toFixed(2));
    const result = totalPnl > 0 ? ('WIN' as const) : totalPnl < 0 ? ('LOSS' as const) : ('BE' as const);

    trades.push({
      id: `mt-${ticket}`,
      brokerTradeId: ticket,
      accountId,
      date: isNaN(openDate.getTime()) ? new Date().toISOString().split('T')[0] : openDate.toISOString().split('T')[0],
      pair: symbol,
      trend: typeStr === 'Buy' ? ('Bullish' as const) : ('Bearish' as const),
      orderType: typeStr as 'Buy' | 'Sell',
      session: determineTradeSession(openDate),
      strategy: 'Imported Deal',
      bais: 'Funding Pips Sync',
      mentalFocus: 8,
      confluences: 3,
      buyLowSellHigh: 8,
      bias: 8,
      risk: 1.0,
      rrRatio: 2.0,
      score: 80,
      decision: 'TAKE' as const,
      result,
      pnl: totalPnl,
      status: 'CLOSED' as const,
      createdAt: isNaN(openDate.getTime()) ? new Date().toISOString() : openDate.toISOString(),
      closedAt: closeDate && !isNaN(closeDate.getTime()) ? closeDate.toISOString() : undefined,
      entryPrice: openPrice || undefined,
      exitPrice: closePrice || undefined,
      quantity: volume || 1.0,
      commission,
      swap,
      notes: `Imported MT ticket #${ticket} (${symbol} ${typeStr})`,
    });
  }

  trades.sort((a, b) => {
    const timeA = new Date(a.closedAt || a.createdAt || a.date).getTime();
    const timeB = new Date(b.closedAt || b.createdAt || b.date).getTime();
    return timeB - timeA;
  });

  return { trades, balance: detectedBalance };
}

function parseMtCsvReport(csv: string, accountId: string): ParsedMtReport {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const trades: Trade[] = [];

  for (const line of lines) {
    const parts = line.split(/[,\t;]/).map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 8) continue;

    const first = parts[0];
    if (!/^\d{5,12}$/.test(first)) continue;

    const ticket = first;
    let type: 'Buy' | 'Sell' = 'Buy';
    let symbol = 'FOREX';
    let profit = 0;
    let openTime = '';
    let closeTime = '';

    for (const p of parts) {
      if (p.toLowerCase() === 'buy') type = 'Buy';
      if (p.toLowerCase() === 'sell') type = 'Sell';
      if (/^[A-Z0-9_\.]{3,10}$/.test(p) && isNaN(Number(p)) && p.toUpperCase() !== 'BUY' && p.toUpperCase() !== 'SELL') {
        symbol = p.toUpperCase();
      }
      if (/^\d{4}[\.\-\/]\d{2}[\.\-\/]\d{2}/.test(p)) {
        if (!openTime) openTime = p.replace(/[\.\/]/g, '-');
        else if (!closeTime) closeTime = p.replace(/[\.\/]/g, '-');
      }
    }

    const lastNum = parseFloat(parts[parts.length - 1]);
    if (!isNaN(lastNum)) profit = lastNum;

    const openDate = openTime ? new Date(openTime) : new Date();
    const closeDate = closeTime ? new Date(closeTime) : undefined;
    const totalPnl = Number(profit.toFixed(2));
    const result = totalPnl > 0 ? ('WIN' as const) : totalPnl < 0 ? ('LOSS' as const) : ('BE' as const);

    trades.push({
      id: `mt-${ticket}`,
      brokerTradeId: ticket,
      accountId,
      date: isNaN(openDate.getTime()) ? new Date().toISOString().split('T')[0] : openDate.toISOString().split('T')[0],
      pair: symbol,
      trend: type === 'Buy' ? ('Bullish' as const) : ('Bearish' as const),
      orderType: type,
      session: determineTradeSession(openDate),
      strategy: 'Imported Deal',
      bais: 'Funding Pips Sync',
      mentalFocus: 8,
      confluences: 3,
      buyLowSellHigh: 8,
      bias: 8,
      risk: 1.0,
      rrRatio: 2.0,
      score: 80,
      decision: 'TAKE' as const,
      result,
      pnl: totalPnl,
      status: 'CLOSED' as const,
      createdAt: isNaN(openDate.getTime()) ? new Date().toISOString() : openDate.toISOString(),
      closedAt: closeDate && !isNaN(closeDate.getTime()) ? closeDate.toISOString() : undefined,
      quantity: 1.0,
      notes: `Imported ticket #${ticket} (${symbol})`,
    });
  }

  trades.sort((a, b) => {
    const timeA = new Date(a.closedAt || a.createdAt || a.date).getTime();
    const timeB = new Date(b.closedAt || b.createdAt || b.date).getTime();
    return timeB - timeA;
  });

  return { trades };
}
