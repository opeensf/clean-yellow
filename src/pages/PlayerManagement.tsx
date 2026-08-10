import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit2,
  GraduationCap,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function PlayerManagement() {
  const navigate = useNavigate();
  const { 
    players, 
    stocks, 
    updatePlayer, 
    updatePlayerStocks, 
    sellStocks,
    cashOutStocks,
    removePlayer, 
    addPlayer, 
    getPlayerTotalValue,
    resetToDefaultPlayers 
  } = useGameStore();
  
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#FF6B6B');
  const [stockInputs, setStockInputs] = useState<{ [key: string]: string }>({});
  const [tradeInputs, setTradeInputs] = useState<{ [key: string]: string }>({});
  const [tradeMode, setTradeMode] = useState<{ [key: string]: 'buy' | 'sell' }>({});
  const [selectedStockType, setSelectedStockType] = useState<{ [key: string]: 'property' | 'education' }>({});
  const [lastSellEarnings, setLastSellEarnings] = useState<{ [key: string]: number }>({});
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  // 可选颜色
  const availableColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 切换卡片展开状态
  const toggleCard = (playerId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  // 开始编辑玩家名称
  const startEditPlayer = (playerId: string, currentName: string) => {
    setEditingPlayer(playerId);
    setEditName(currentName);
  };

  // 保存玩家名称
  const savePlayerName = (playerId: string) => {
    if (editName.trim()) {
      updatePlayer(playerId, { name: editName.trim() });
      toast.success('玩家名称已更新');
    }
    setEditingPlayer(null);
    setEditName('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName('');
  };

  // 更新玩家股票
  const handleStockChange = (playerId: string, stockType: 'property' | 'education', change: number) => {
    updatePlayerStocks(playerId, stockType, change);
    const player = players.find(p => p.id === playerId);
    const stockName = stocks[stockType].name;
    if (change > 0) {
      toast.success(`${player?.name} 增加了 ${change} 股 ${stockName}`);
    } else {
      toast.success(`${player?.name} 减少了 ${Math.abs(change)} 股 ${stockName}`);
    }
  };

  // 处理输入框股票变更
  const handleStockInputChange = (playerId: string, stockType: 'property' | 'education', isIncrease: boolean) => {
    const inputKey = `${playerId}-${stockType}`;
    const inputValue = stockInputs[inputKey] || '0';
    const amount = parseInt(inputValue);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的股票数量');
      return;
    }
    
    const player = players.find(p => p.id === playerId);
    const currentStocks = player?.stocks[stockType] || 0;
    
    if (!isIncrease && amount > currentStocks) {
      toast.error('减少数量不能超过当前持有数量');
      return;
    }
    
    if (isIncrease) {
      handleStockChange(playerId, stockType, amount);
    } else {
      // 卖出股票，显示收益
      const earnings = sellStocks(playerId, stockType, amount);
      const stockName = stocks[stockType].name;
      setLastSellEarnings({ ...lastSellEarnings, [`${playerId}-${stockType}`]: earnings });
      toast.success(`${player?.name} 卖出 ${amount} 股 ${stockName}，获得 ¥${earnings.toFixed(2)}`);
      
      // 3秒后清除收益显示
      setTimeout(() => {
        setLastSellEarnings(prev => {
          const newState = { ...prev };
          delete newState[`${playerId}-${stockType}`];
          return newState;
        });
      }, 3000);
    }
    
    setStockInputs({ ...stockInputs, [inputKey]: '' });
  };

  // 删除玩家
  const handleRemovePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (window.confirm(`确定要删除玩家 ${player?.name} 吗？`)) {
      removePlayer(playerId);
      toast.success('玩家已删除');
    }
  };

  // 添加新玩家
  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer({
        name: newPlayerName.trim(),
        color: newPlayerColor,
        cash: 0,
        stocks: { property: 0, education: 0 },
        insuranceFee: 1500,
        insuranceEnabled: false
      });
      toast.success('新玩家已添加');
      setNewPlayerName('');
      setShowAddPlayer(false);
    } else {
      toast.error('请输入玩家名称');
    }
  };

  // 重置为默认玩家
  const handleResetToDefault = () => {
    if (window.confirm('确定要重置为默认玩家吗？这将清除所有当前玩家数据。')) {
      resetToDefaultPlayers();
      toast.success('已重置为默认玩家');
    }
  };

  // 设置交易模式
  const setPlayerTradeMode = (playerId: string, mode: 'buy' | 'sell') => {
    setTradeMode(prev => ({
      ...prev,
      [playerId]: mode
    }));
  };

  // 处理按金额交易
  const handleAmountTrade = (playerId: string) => {
    const inputKey = `trade-${playerId}`;
    const inputValue = tradeInputs[inputKey] || '';
    const targetAmount = parseFloat(inputValue);
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('请输入有效的交易金额');
      return;
    }
    
    const player = players.find(p => p.id === playerId);
    const mode = tradeMode[playerId] || 'sell';
    
    if (mode === 'sell') {
      // 卖出逻辑：根据选择的股票种类按目标金额计算能卖多少股
      const stockType = selectedStockType[playerId] || 'property';
      const stockPrice = stocks[stockType].price;
      const currentHolding = player!.stocks[stockType];
      
      if (currentHolding <= 0) {
        toast.error(`没有${stocks[stockType].name}可以卖出`);
        return;
      }
      
      const maxValue = currentHolding * stockPrice;
      if (targetAmount > maxValue) {
        toast.error(`卖出金额不能超过持有的${stocks[stockType].name}价值 ¥${maxValue.toFixed(2)}`);
        return;
      }
      
      // 计算需要卖出的股数（四舍五入）
      const stocksToSell = Math.round(targetAmount / stockPrice);
      const actualStocksToSell = Math.min(stocksToSell, currentHolding);
      // 用户实际从银行获得目标金额的现金
      const actualCashReceived = targetAmount;
      // 系统中减少的股票价值
      const stockValueReduced = actualStocksToSell * stockPrice;
      // 盈亏 = 实际获得现金 - 系统中减少的股票价值
      const profitLoss = actualCashReceived - stockValueReduced;
      
      // 执行卖出
      handleStockChange(playerId, stockType, -actualStocksToSell);
      
      if (Math.abs(profitLoss) > 0.01) {
        const profitLossText = profitLoss > 0 ? `赚 ¥${profitLoss.toFixed(2)}` : `亏 ¥${Math.abs(profitLoss).toFixed(2)}`;
        toast.success(`${player?.name} 卖出 ${actualStocksToSell} 股 ${stocks[stockType].name}，获得 ¥${actualCashReceived.toFixed(2)} (${profitLossText})`);
      } else {
        toast.success(`${player?.name} 卖出 ${actualStocksToSell} 股 ${stocks[stockType].name}，获得 ¥${actualCashReceived.toFixed(2)}`);
      }
      
      setTradeInputs({ ...tradeInputs, [inputKey]: '' });
    } else {
      // 买入逻辑：按目标金额计算能买多少股
      const stockType = selectedStockType[playerId] || 'property';
      const stockPrice = stocks[stockType].price;
      const stocksToBuy = Math.round(targetAmount / stockPrice); // 四舍五入到整数股
      
      if (stocksToBuy <= 0) {
        toast.error('买入金额太小，无法购买股票');
        return;
      }
      
      // 用户实际花费目标金额
      const actualCashSpent = targetAmount;
      // 系统中增加的股票价值
      const stockValueAdded = stocksToBuy * stockPrice;
      // 盈亏 = 实际花费 - 系统中增加的股票价值
      const profitLoss = actualCashSpent - stockValueAdded;
      
      handleStockChange(playerId, stockType, stocksToBuy);
      
      if (Math.abs(profitLoss) > 0.01) {
        const profitLossText = profitLoss > 0 ? `亏 ¥${profitLoss.toFixed(2)}` : `赚 ¥${Math.abs(profitLoss).toFixed(2)}`;
        toast.success(`${player?.name} 买入 ${stocksToBuy} 股 ${stocks[stockType].name}，花费 ¥${actualCashSpent.toFixed(2)} (${profitLossText})`);
      } else {
        toast.success(`${player?.name} 买入 ${stocksToBuy} 股 ${stocks[stockType].name}，花费 ¥${actualCashSpent.toFixed(2)}`);
      }
      
      setTradeInputs({ ...tradeInputs, [inputKey]: '' });
    }
  };

  // 处理现金调整（通过卖出股票获得现金）
  const handleCashAdjustment = (playerId: string, amount: number) => {
    const player = players.find(p => p.id === playerId);
    const totalValue = getPlayerTotalValue(playerId);
    
    if (amount > totalValue) {
      toast.error('股票价值不足，无法获得该金额');
      return;
    }
    
    try {
      cashOutStocks(playerId, amount);
      toast.success(`${player?.name} 通过卖出股票获得现金 ¥${amount.toFixed(2)}`);
    } catch {
      toast.error('操作失败，请检查股票余额');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
      {/* 头部 */}
      <div className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate('/')}
              aria-label="返回首页"
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-500/20"><Users size={21} /></span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">玩家管理</h1>
              <p className="text-xs text-slate-500">玩家资料与资产配置</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              aria-label="重置默认玩家"
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">重置默认</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddPlayer(true)}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">添加玩家</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="space-y-4">
        {/* 玩家列表 */}
        {players.map((player) => {
          const totalValue = getPlayerTotalValue(player.id);
          const isExpanded = expandedCards[player.id];
          
          return (
            <article key={player.id} className="overflow-hidden rounded-3xl border border-white bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur transition-all duration-300">
              {/* 玩家基本信息 - 可点击展开 */}
              <div 
                className="cursor-pointer p-5 transition-colors hover:bg-slate-50/50"
                onClick={() => toggleCard(player.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm ring-4 ring-white"
                      style={{ backgroundColor: player.color }}
                    >{Array.from(player.name)[0]}</span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">{player.name}</h3>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold text-slate-400">股值</span>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">¥{totalValue.toFixed(2)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">房产 {player.stocks.property} 股 · 教育 {player.stocks.education} 股</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingPlayer !== player.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditPlayer(player.id, player.name);
                          }}
                          aria-label={`编辑${player.name}`}
                          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(player.id);
                          }}
                          aria-label={`删除${player.name}`}
                          className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <span className={cn('rounded-xl bg-slate-100 p-2 text-slate-400 transition-colors', isExpanded && 'bg-blue-50 text-blue-600')}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </div>
                
                {/* 编辑名称 */}
                {editingPlayer === player.id && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onKeyDown={(e) => e.key === 'Enter' && savePlayerName(player.id)}
                      autoFocus
                    />
                    <button
                      onClick={() => savePlayerName(player.id)}
                      className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 展开的详细功能 */}
              {isExpanded && (
                <div className="grid gap-4 border-t border-slate-100 p-4 sm:p-5 lg:grid-cols-2 lg:items-start">
                  {/* 按金额买卖 */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                        {tradeMode[player.id] === 'buy' ? <ShoppingCart size={16} /> : <TrendingUp size={16} />}
                        按金额{tradeMode[player.id] === 'buy' ? '买入' : '卖出'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setPlayerTradeMode(player.id, tradeMode[player.id] === 'buy' ? 'sell' : 'buy')}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                          tradeMode[player.id] === 'buy'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        )}
                      >
                        切换到{tradeMode[player.id] === 'buy' ? '卖出' : '买入'}
                      </button>
                    </div>
                    
                    <div className="space-y-3.5">
                      {/* 股票种类选择 */}
                      <div className="grid grid-cols-2 rounded-xl bg-white/70 p-1">
                        {Object.entries(stocks).map(([stockType, stock]) => (
                          <button
                            key={stockType}
                            onClick={() => setSelectedStockType({
                              ...selectedStockType,
                              [player.id]: stockType as 'property' | 'education'
                            })}
                            className={cn(
                              'rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
                              selectedStockType[player.id] === stockType || (!selectedStockType[player.id] && stockType === 'property')
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            )}
                          >
                            {stock.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* 金额输入和交易按钮 */}
                      <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                          <input
                            type="number"
                            placeholder={`输入${tradeMode[player.id] === 'buy' ? '买入' : '卖出'}金额`}
                            min="0.01"
                            step="0.01"
                            value={tradeInputs[`trade-${player.id}`] || ''}
                            onChange={(e) => setTradeInputs({
                              ...tradeInputs,
                              [`trade-${player.id}`]: e.target.value
                            })}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAmountTrade(player.id)}
                          className={cn(
                            'flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition-colors',
                            tradeMode[player.id] === 'buy'
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : 'bg-rose-500 hover:bg-rose-600'
                          )}
                        >
                          {tradeMode[player.id] === 'buy' ? <ShoppingCart size={14} /> : <TrendingUp size={14} />}
                          {tradeMode[player.id] === 'buy' ? '买入' : '卖出'}
                        </button>
                      </div>
                      
                      <p className="text-xs text-slate-500">
                        {tradeMode[player.id] === 'sell' 
                          ? `${stocks[selectedStockType[player.id] || 'property'].name} 持有: ${player.stocks[selectedStockType[player.id] || 'property']} 股`
                          : `${stocks[selectedStockType[player.id] || 'property'].name} 当前价格: ¥${stocks[selectedStockType[player.id] || 'property'].price.toFixed(2)}/股`
                        }
                      </p>
                    </div>
                    
                    {/* 快捷金额按钮 */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[1000, 2000, 3000, 5000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => {
                            if (tradeMode[player.id] === 'sell') {
                              handleCashAdjustment(player.id, amount);
                            } else {
                              setTradeInputs({ 
                                ...tradeInputs, 
                                [`trade-${player.id}`]: amount.toString() 
                              });
                            }
                          }}
                          className="rounded-lg border border-blue-100 bg-white py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                        >
                          {tradeMode[player.id] === 'sell' ? '卖出' : ''}¥{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 股票持有情况 */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">股票操作</h4>
                      <p className="mt-1 text-xs text-slate-500">按股数直接调整玩家持仓</p>
                    </div>
                    {Object.entries(stocks).map(([stockType, stock]) => {
                      const holdingCount = player.stocks[stockType as 'property' | 'education'];
                      const holdingValue = holdingCount * stock.price;
                      const earningsKey = `${player.id}-${stockType}`;
                      const earnings = lastSellEarnings[earningsKey];
                      
                      return (
                        <div key={stockType} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="mb-3 flex items-center gap-3">
                            <span className={cn('rounded-xl p-2.5', stockType === 'property' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600')}>
                              {stockType === 'property' ? <Building2 size={18} /> : <GraduationCap size={18} />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-slate-800">{stock.name}</h5>
                              <p className="text-xs text-slate-500">
                                {holdingCount} 股 · 股值 ¥{holdingValue.toFixed(2)}
                              </p>
                              {earnings && (
                                <p className="text-xs font-semibold text-emerald-600">
                                  卖出收益: +¥{earnings.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <span className="text-xl font-bold text-slate-800">{holdingCount}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="股数"
                                min="1"
                                value={stockInputs[`${player.id}-${stockType}`] || ''}
                                onChange={(e) => setStockInputs({ 
                                  ...stockInputs, 
                                  [`${player.id}-${stockType}`]: e.target.value 
                                })}
                                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              />
                              <button
                                onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', false)}
                                disabled={holdingCount <= 0}
                                className={cn(
                                  'flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold transition-colors',
                                  holdingCount <= 0
                                    ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                                    : 'border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                )}
                              >
                                <Minus size={14} /><span className="hidden sm:inline">减少</span>
                              </button>
                              <button
                                onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', true)}
                                className="flex h-10 items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
                              >
                                <Plus size={14} /><span className="hidden sm:inline">增加</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        </section>

        {/* 添加玩家弹窗 */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white bg-white/95 p-6 shadow-2xl shadow-slate-900/15 backdrop-blur">
              <div>
                <span className="inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600"><UserPlus size={20} /></span>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">添加新玩家</h3>
                <p className="mt-1 text-sm text-slate-500">设置玩家名称与专属识别色</p>
              </div>
              
              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    玩家名称
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    placeholder="输入玩家名称"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    选择颜色
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {availableColors.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setNewPlayerColor(color)}
                        aria-label={`选择颜色 ${color}`}
                        className={cn(
                          'mx-auto h-9 w-9 rounded-xl border-2 transition-all',
                          newPlayerColor === color
                            ? 'scale-110 border-white ring-2 ring-slate-700 ring-offset-2'
                            : 'border-white hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
