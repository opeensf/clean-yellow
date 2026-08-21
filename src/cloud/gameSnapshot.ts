import {
  useGameStore,
  type DebtRecord,
  type HistoryRecord,
  type Player,
  type Stock,
  type StockType,
  type TradeRecord,
} from '../store/gameStore';

export const GAME_SNAPSHOT_VERSION = 1;

export interface GameSnapshot {
  schemaVersion: typeof GAME_SNAPSHOT_VERSION;
  stocks: Record<StockType, Stock>;
  players: Player[];
  history: HistoryRecord[];
  debts: DebtRecord[];
  tradeRecords: TradeRecord[];
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createGameSnapshot(): GameSnapshot {
  const state = useGameStore.getState();

  return clone({
    schemaVersion: GAME_SNAPSHOT_VERSION,
    stocks: state.stocks,
    players: state.players,
    history: state.history,
    debts: state.debts,
    tradeRecords: state.tradeRecords,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseGameSnapshot(value: unknown): GameSnapshot {
  if (!isRecord(value)) {
    throw new Error('云端存档格式无效');
  }

  const stocks = value.stocks;
  const hasStocks = isRecord(stocks)
    && isRecord(stocks.property)
    && isRecord(stocks.education);

  if (
    value.schemaVersion !== GAME_SNAPSHOT_VERSION
    || !hasStocks
    || !Array.isArray(value.players)
    || !Array.isArray(value.history)
    || !Array.isArray(value.debts)
    || !Array.isArray(value.tradeRecords)
  ) {
    throw new Error('云端存档版本不受支持');
  }

  return clone(value as unknown as GameSnapshot);
}

export function applyGameSnapshot(snapshot: GameSnapshot): void {
  const safeSnapshot = parseGameSnapshot(snapshot);
  useGameStore.setState({
    stocks: safeSnapshot.stocks,
    players: safeSnapshot.players,
    history: safeSnapshot.history,
    debts: safeSnapshot.debts,
    tradeRecords: safeSnapshot.tradeRecords,
  });
}

export function serializeGameSnapshot(snapshot = createGameSnapshot()): string {
  return JSON.stringify(snapshot);
}
