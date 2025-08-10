import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 股票类型
export type StockType = 'property' | 'education';

// 股票信息
export interface Stock {
  id: StockType;
  name: string;
  price: number;
  history: { timestamp: number; price: number }[];
}

// 玩家信息
export interface Player {
  id: string;
  name: string;
  color: string;
  cash: number; // 现金余额
  stocks: {
    property: number;
    education: number;
  };
  insuranceFee: number; // 保险费
  insuranceEnabled: boolean; // 保险状态
}

// 债务记录
export interface DebtRecord {
  id: string;
  debtorId: string; // 债务人ID
  creditorId: string; // 债权人ID (玩家ID或'bank')
  originalAmount: number; // 原始欠款金额
  remainingAmount: number; // 剩余未还金额
  createdAt: number; // 创建时间戳
  updatedAt: number; // 最后更新时间戳
}

// 交易记录
export interface TradeRecord {
  id: string;
  playerId: string;
  stockType: StockType;
  type: 'buy' | 'sell';
  quantity: number;
  price: number; // 交易时的股价
  timestamp: number;
}

// 历史操作记录
interface HistoryRecord {
  timestamp: number;
  type: 'stock_price';
  data: {
    stockType: StockType;
    oldPrice: number;
    newPrice: number;
  };
}

// 游戏状态
interface GameState {
  // 股票相关
  stocks: Record<StockType, Stock>;
  updateStockPrice: (stockType: StockType, newPrice: number) => void;
  adjustStockPrice: (stockType: StockType, percentage: number) => void;
  
  // 历史记录和撤回
  history: HistoryRecord[];
  undoLastOperation: () => boolean;
  
  // 交易记录
  tradeRecords: TradeRecord[];
  addTradeRecord: (record: Omit<TradeRecord, 'id' | 'timestamp'>) => void;
  getPlayerTradeRecords: (playerId: string) => TradeRecord[];
  calculateRealizedProfit: (playerId: string) => number;
  
  // 玩家相关
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updatePlayerStocks: (playerId: string, stockType: StockType, amount: number) => void;
  updatePlayerCash: (playerId: string, amount: number) => void;
  removePlayer: (playerId: string) => void;
  
  // 股票操作
  sellStocks: (playerId: string, stockType: StockType, amount: number) => number; // 返回卖出收益
  cashOutStocks: (playerId: string, cashAmount: number) => boolean; // 提现功能
  
  // 计算玩家总资产
  getPlayerTotalValue: (playerId: string) => number;
  
  // 欠债管理
  debts: DebtRecord[];
  addDebt: (debtorId: string, creditorId: string, amount: number) => void;
  repayDebt: (debtId: string, amount?: number) => void; // 不传amount表示全部偿还
  removeDebt: (debtId: string) => void;
  getPlayerDebts: (playerId: string) => { asDebtor: DebtRecord[]; asCreditor: DebtRecord[] };
  
  // 重置游戏
  resetGame: () => void;
  
  // 新一局游戏
  startNewGame: () => void;
  
  // 重置为默认玩家
  resetToDefaultPlayers: () => void;
  
  // 保险相关
  updatePlayerInsuranceFee: (playerId: string, amount: number) => void;
  togglePlayerInsurance: (playerId: string) => void;
  increaseAllInsuranceFees: () => void;
}

// 默认玩家颜色
const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

// 默认玩家名字
const defaultPlayerNames = ['林觉睿', '韩江涛', '吴元祺', '符文威', '欧哲优'];

// 初始状态
const initialState = {
  stocks: {
    property: {
      id: 'property' as StockType,
      name: '房产股',
      price: 100,
      history: [{ timestamp: Date.now(), price: 100 }]
    },
    education: {
      id: 'education' as StockType,
      name: '教育股',
      price: 100,
      history: [{ timestamp: Date.now(), price: 100 }]
    }
  },
  players: defaultColors.slice(0, 5).map((color, index) => ({
    id: `player-${index + 1}`,
    name: defaultPlayerNames[index] || `玩家${index + 1}`,
    color,
    cash: 0, // 初始现金为0
    stocks: {
      property: 0,
      education: 0
    },
    insuranceFee: 1500, // 初始保险费
    insuranceEnabled: false // 初始保险状态为关闭
  })),
  history: [] as HistoryRecord[],
  debts: [] as DebtRecord[],
  tradeRecords: [] as TradeRecord[]
};

export const useGameStore = create<GameState>()(persist(
  (set, get) => ({
    ...initialState,
    
    
      
      updateStockPrice: (stockType, newPrice) => {
      set((state) => {
        const stock = state.stocks[stockType];
        const oldPrice = stock.price;
        const finalPrice = Math.max(0.01, newPrice); // 确保价格不为负数或零
        
        const updatedStock = {
          ...stock,
          price: finalPrice,
          history: [...stock.history, { timestamp: Date.now(), price: finalPrice }]
        };
        
        // 添加到历史记录
        const historyRecord: HistoryRecord = {
          timestamp: Date.now(),
          type: 'stock_price',
          data: {
            stockType,
            oldPrice,
            newPrice: finalPrice
          }
        };
        
        return {
          stocks: {
            ...state.stocks,
            [stockType]: updatedStock
          },
          history: [...state.history, historyRecord]
        };
      });
    },
    
    adjustStockPrice: (stockType, percentage) => {
      const currentPrice = get().stocks[stockType].price;
      const newPrice = Math.round(currentPrice * (1 + percentage / 100)); // 保留整数
      get().updateStockPrice(stockType, newPrice);
    },
    
    undoLastOperation: () => {
      const state = get();
      if (state.history.length === 0) return false;
      
      const lastRecord = state.history[state.history.length - 1];
      
      if (lastRecord.type === 'stock_price') {
        const { stockType, oldPrice } = lastRecord.data;
        const stock = state.stocks[stockType];
        
        set((state) => {
          const updatedStock = {
            ...stock,
            price: oldPrice,
            history: [...stock.history, { timestamp: Date.now(), price: oldPrice }]
          };
          
          return {
            stocks: {
              ...state.stocks,
              [stockType]: updatedStock
            },
            history: state.history.slice(0, -1) // 移除最后一条记录
          };
        });
        
        return true;
      }
      
      return false;
    },
    
    addPlayer: (player) => {
      set((state) => ({
        players: [...state.players, {
          ...player,
          id: `player-${Date.now()}`
        }]
      }));
    },
    
    updatePlayer: (playerId, updates) => {
      set((state) => ({
        players: state.players.map(player => 
          player.id === playerId ? { ...player, ...updates } : player
        )
      }));
    },
    
    updatePlayerStocks: (playerId, stockType, amount) => {
      set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? {
                ...player,
                stocks: {
                  ...player.stocks,
                  [stockType]: Math.max(0, player.stocks[stockType] + amount)
                }
              }
            : player
        )
      }));
      
      // 记录交易（买入或卖出）
      if (amount !== 0) {
        const currentPrice = get().stocks[stockType].price;
        get().addTradeRecord({
          playerId,
          stockType,
          type: amount > 0 ? 'buy' : 'sell',
          quantity: Math.abs(amount),
          price: currentPrice
        });
      }
    },
    
    updatePlayerCash: (playerId, amount) => {
      set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? { ...player, cash: Math.max(0, player.cash + amount) }
            : player
        )
      }));
    },
    
    sellStocks: (playerId, stockType, amount) => {
      const state = get();
      const player = state.players.find(p => p.id === playerId);
      if (!player || player.stocks[stockType] < amount) return 0;
      
      const stockPrice = state.stocks[stockType].price;
      const earnings = Math.round(amount * stockPrice * 100) / 100; // 精确到百位，四舍五入
      
      // 减少股票数量，增加现金
      get().updatePlayerStocks(playerId, stockType, -amount);
      get().updatePlayerCash(playerId, earnings);
      
      return earnings;
    },
    
    cashOutStocks: (playerId, cashAmount) => {
      const state = get();
      const player = state.players.find(p => p.id === playerId);
      if (!player) return false;
      
      const roundedCashAmount = Math.round(cashAmount * 100) / 100; // 精确到百位，四舍五入
      
      // 计算玩家当前股票总价值
      const propertyPrice = state.stocks.property.price;
      const educationPrice = state.stocks.education.price;
      const totalStockValue = player.stocks.property * propertyPrice + player.stocks.education * educationPrice;
      
      // 检查股票价值是否足够提现
      if (totalStockValue < roundedCashAmount) {
        return false;
      }
      
      let remainingCash = roundedCashAmount;
      let propertyToSell = 0;
      let educationToSell = 0;
      
      // 优先卖出房产股
      if (remainingCash > 0 && player.stocks.property > 0) {
        const stocksNeeded = Math.ceil(remainingCash / propertyPrice); // 向上取整，确保能提现足够金额
        propertyToSell = Math.min(player.stocks.property, stocksNeeded);
        remainingCash -= propertyToSell * propertyPrice;
      }
      
      // 如果还需要更多现金，卖出教育股
      if (remainingCash > 0 && player.stocks.education > 0) {
        const stocksNeeded = Math.ceil(remainingCash / educationPrice); // 向上取整
        educationToSell = Math.min(player.stocks.education, stocksNeeded);
        remainingCash -= educationToSell * educationPrice;
      }
      
      // 计算实际获得的现金（可能会比请求的多一点，因为向上取整）
      const actualCashOut = propertyToSell * propertyPrice + educationToSell * educationPrice;
      
      // 执行卖出操作
      if (propertyToSell > 0) {
        get().updatePlayerStocks(playerId, 'property', -propertyToSell);
      }
      if (educationToSell > 0) {
        get().updatePlayerStocks(playerId, 'education', -educationToSell);
      }
      
      // 增加现金（精确到百位）
      const finalCashAmount = Math.round(actualCashOut * 100) / 100;
      get().updatePlayerCash(playerId, finalCashAmount);
      
      return true;
    },
    
    removePlayer: (playerId) => {
      set((state) => ({
        players: state.players.filter(player => player.id !== playerId)
      }));
    },
    
    // 交易记录方法
    addTradeRecord: (record) => {
      const newRecord: TradeRecord = {
        ...record,
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      set((state) => ({
        tradeRecords: [...state.tradeRecords, newRecord]
      }));
    },
    
    getPlayerTradeRecords: (playerId) => {
      const state = get();
      return state.tradeRecords.filter(record => record.playerId === playerId);
    },
    
    calculateRealizedProfit: (playerId) => {
      const trades = get().getPlayerTradeRecords(playerId);
      const stockTypes: StockType[] = ['property', 'education'];
      let totalProfit = 0;
      
      stockTypes.forEach(stockType => {
        const stockTrades = trades.filter(trade => trade.stockType === stockType);
        const buyTrades = stockTrades.filter(trade => trade.type === 'buy');
        const sellTrades = stockTrades.filter(trade => trade.type === 'sell');
        
        // 使用FIFO（先进先出）方法计算已实现收益
        let buyQueue = [...buyTrades].sort((a, b) => a.timestamp - b.timestamp);
        let totalSellQuantity = 0;
        let totalBuyCost = 0;
        let totalSellRevenue = 0;
        
        sellTrades.forEach(sellTrade => {
          let remainingSellQuantity = sellTrade.quantity;
          totalSellRevenue += sellTrade.quantity * sellTrade.price;
          
          while (remainingSellQuantity > 0 && buyQueue.length > 0) {
            const buyTrade = buyQueue[0];
            const quantityToMatch = Math.min(remainingSellQuantity, buyTrade.quantity);
            
            totalBuyCost += quantityToMatch * buyTrade.price;
            totalSellQuantity += quantityToMatch;
            
            buyTrade.quantity -= quantityToMatch;
            remainingSellQuantity -= quantityToMatch;
            
            if (buyTrade.quantity === 0) {
              buyQueue.shift();
            }
          }
        });
        
        totalProfit += (totalSellRevenue - totalBuyCost);
      });
      
      return Math.round(totalProfit * 100) / 100;
    },
    
    getPlayerTotalValue: (playerId) => {
      const state = get();
      const player = state.players.find(p => p.id === playerId);
      if (!player) return 0;
      
      return (
        player.stocks.property * state.stocks.property.price +
        player.stocks.education * state.stocks.education.price
      );
    },
    
    resetGame: () => {
      set(initialState);
    },
    
    // 新一局游戏：重置所有数据但保留默认玩家
    startNewGame: () => {
      set((state) => ({
        ...initialState,
        players: defaultColors.slice(0, 5).map((color, index) => ({
          id: `player-${index + 1}`,
          name: defaultPlayerNames[index] || `玩家${index + 1}`,
          color,
          cash: 0,
          stocks: {
            property: 0,
            education: 0
          },
          insuranceFee: 1500,
          insuranceEnabled: false
        }))
      }));
    },
    
    resetToDefaultPlayers: () => {
      set((state) => ({
        ...state,
        players: defaultColors.slice(0, 5).map((color, index) => ({
          id: `player-${index + 1}`,
          name: defaultPlayerNames[index] || `玩家${index + 1}`,
          color,
          cash: 0,
          stocks: {
            property: 0,
            education: 0
          },
          insuranceFee: 1500,
          insuranceEnabled: false
        }))
      }));
    },
    
    // 欠债管理方法
    addDebt: (debtorId, creditorId, amount) => {
      const now = Date.now();
      const newDebt: DebtRecord = {
        id: `debt-${now}`,
        debtorId,
        creditorId,
        originalAmount: amount,
        remainingAmount: amount,
        createdAt: now,
        updatedAt: now
      };
      
      set((state) => ({
        debts: [...state.debts, newDebt]
      }));
    },
    
    repayDebt: (debtId, amount) => {
      set((state) => {
        const debtIndex = state.debts.findIndex(debt => debt.id === debtId);
        if (debtIndex === -1) return state;
        
        const debt = state.debts[debtIndex];
        const repayAmount = amount || debt.remainingAmount; // 如果没有指定金额，则全部偿还
        const newRemainingAmount = Math.max(0, debt.remainingAmount - repayAmount);
        
        if (newRemainingAmount === 0) {
          // 完全偿还，删除债务记录
          return {
            debts: state.debts.filter(debt => debt.id !== debtId)
          };
        } else {
          // 部分偿还，更新债务记录
          const updatedDebts = [...state.debts];
          updatedDebts[debtIndex] = {
            ...debt,
            remainingAmount: newRemainingAmount,
            updatedAt: Date.now()
          };
          return {
            debts: updatedDebts
          };
        }
      });
    },
    
    removeDebt: (debtId) => {
      set((state) => ({
        debts: state.debts.filter(debt => debt.id !== debtId)
      }));
    },
    
    getPlayerDebts: (playerId) => {
      const state = get();
      return {
        asDebtor: state.debts.filter(debt => debt.debtorId === playerId),
        asCreditor: state.debts.filter(debt => debt.creditorId === playerId)
      };
    },
    
    // 保险相关方法
    updatePlayerInsuranceFee: (playerId, amount) => {
      set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? { ...player, insuranceFee: Math.max(0, player.insuranceFee + amount) }
            : player
        )
      }));
    },
    
    increaseAllInsuranceFees: () => {
      set((state) => ({
        players: state.players.map(player => ({
          ...player,
          insuranceFee: player.insuranceFee + 1500
        }))
      }));
    },
    
    togglePlayerInsurance: (playerId) => {
      set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? { ...player, insuranceEnabled: !player.insuranceEnabled }
            : player
        )
      }));
    }
  }),
  {
    name: 'monopoly-game-storage',
    version: 2,
    migrate: (persistedState: any, version: number) => {
      // 如果是从版本1升级到版本2，重置玩家数据
      if (version < 2) {
        return {
          ...persistedState,
          players: defaultColors.slice(0, 5).map((color, index) => ({
            id: `player-${index + 1}`,
            name: defaultPlayerNames[index] || `玩家${index + 1}`,
            color,
            cash: 0,
            stocks: {
              property: 0,
              education: 0
            },
            insuranceFee: 1500,
            insuranceEnabled: false
          }))
        };
      }
      // 确保所有玩家都有insuranceFee和insuranceEnabled属性
      if (persistedState.players) {
        persistedState.players = persistedState.players.map((player: any) => ({
          ...player,
          insuranceFee: player.insuranceFee ?? 1500,
          insuranceEnabled: player.insuranceEnabled ?? false
        }));
      }
      return persistedState;
    }
  }
));