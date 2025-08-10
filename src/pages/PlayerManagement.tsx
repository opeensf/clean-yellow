import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Edit2, Trash2, UserPlus, RotateCcw, DollarSign, Banknote, ChevronDown, ChevronUp, ShoppingCart, TrendingUp } from 'lucide-react';
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
    updatePlayerCash,
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

  // 切换交易模式
  const toggleTradeMode = (playerId: string) => {
    setTradeMode(prev => ({
      ...prev,
      [playerId]: prev[playerId] === 'buy' ? 'sell' : 'buy'
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
    } catch (error) {
      toast.error('操作失败，请检查股票余额');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100/80 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">玩家管理</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm"
            >
              <RotateCcw size={16} />
              重置默认
            </button>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
            >
              <UserPlus size={16} />
              添加玩家
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* 玩家列表 */}
        {players.map((player) => {
          const totalValue = getPlayerTotalValue(player.id);
          const isExpanded = expandedCards[player.id];
          
          return (
            <div key={player.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-xl">
              {/* 玩家基本信息 - 可点击展开 */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleCard(player.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" 
                      style={{ backgroundColor: player.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{player.name}</h3>
                      <p className="text-sm text-gray-600">股票价值: ¥{totalValue.toFixed(2)}</p>
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
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(player.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>
                
                {/* 编辑名称 */}
                {editingPlayer === player.id && (
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && savePlayerName(player.id)}
                      autoFocus
                    />
                    <button
                      onClick={() => savePlayerName(player.id)}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 展开的详细功能 */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                  {/* 按金额买卖 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        {tradeMode[player.id] === 'buy' ? <ShoppingCart size={16} /> : <TrendingUp size={16} />}
                        按金额{tradeMode[player.id] === 'buy' ? '买入' : '卖出'}
                      </h4>
                      <button
                        onClick={() => toggleTradeMode(player.id)}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200',
                          tradeMode[player.id] === 'buy'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        )}
                      >
                        切换到{tradeMode[player.id] === 'buy' ? '卖出' : '买入'}
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* 股票种类选择 */}
                      <div className="flex gap-2">
                        {Object.entries(stocks).map(([stockType, stock]) => (
                          <button
                            key={stockType}
                            onClick={() => setSelectedStockType({
                              ...selectedStockType,
                              [player.id]: stockType as 'property' | 'education'
                            })}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                              selectedStockType[player.id] === stockType || (!selectedStockType[player.id] && stockType === 'property')
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            )}
                          >
                            {stock.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* 金额输入和交易按钮 */}
                      <div className="flex items-center gap-2">
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAmountTrade(player.id)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                            tradeMode[player.id] === 'buy'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-sm'
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm'
                          )}
                        >
                          {tradeMode[player.id] === 'buy' ? <ShoppingCart size={14} /> : <TrendingUp size={14} />}
                          {tradeMode[player.id] === 'buy' ? '买入' : '卖出'}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        {tradeMode[player.id] === 'sell' 
                          ? `${stocks[selectedStockType[player.id] || 'property'].name} 持有: ${player.stocks[selectedStockType[player.id] || 'property']} 股`
                          : `${stocks[selectedStockType[player.id] || 'property'].name} 当前价格: ¥${stocks[selectedStockType[player.id] || 'property'].price.toFixed(2)}/股`
                        }
                      </p>
                    </div>
                    
                    {/* 快捷金额按钮 */}
                    <div className="flex gap-2 mt-3">
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
                          className="px-2 py-1 bg-white/80 text-gray-700 rounded text-xs hover:bg-white transition-colors border border-gray-200"
                        >
                          {tradeMode[player.id] === 'sell' ? '卖出' : ''}¥{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 股票持有情况 */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">股票操作</h4>
                    {Object.entries(stocks).map(([stockType, stock]) => {
                      const holdingCount = player.stocks[stockType as 'property' | 'education'];
                      const holdingValue = holdingCount * stock.price;
                      const earningsKey = `${player.id}-${stockType}`;
                      const earnings = lastSellEarnings[earningsKey];
                      
                      return (
                        <div key={stockType} className="bg-gray-50/80 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-800">{stock.name}</h5>
                              <p className="text-sm text-gray-600">
                                持有: {holdingCount} 股 | 价值: ¥{holdingValue.toFixed(2)}
                              </p>
                              {earnings && (
                                <p className="text-sm text-green-600 font-medium">
                                  卖出收益: +¥{earnings.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-center font-medium text-gray-700">
                              {holdingCount} 股
                            </div>
                            
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
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', false)}
                                disabled={holdingCount <= 0}
                                className={cn(
                                  'px-3 py-1 rounded text-sm transition-colors',
                                  holdingCount <= 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                )}
                              >
                                减少
                              </button>
                              <button
                                onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', true)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                增加
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 添加玩家弹窗 */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">添加新玩家</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    玩家名称
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="输入玩家名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择颜色
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewPlayerColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          newPlayerColor === color
                            ? 'border-gray-800 scale-110 ring-2 ring-gray-300'
                            : 'border-gray-300 hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPlayer}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}