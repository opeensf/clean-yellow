import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

export default function StockProfitAnalysis() {
  const navigate = useNavigate();
  const { players, stocks, getPlayerTotalValue, calculateRealizedProfit } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  // 计算未实现收益（当前持有股票的盈亏）
  const calculateUnrealizedProfit = (playerId?: string) => {
    const targetPlayers = playerId && playerId !== 'all' ? [players.find(p => p.id === playerId)!] : players;
    
    return targetPlayers.reduce((total, player) => {
      if (!player) return total;
      
      // 假设买入价格为100（初始价格），实际应该记录每个玩家的买入价格
      const propertyBuyPrice = 100;
      const educationBuyPrice = 100;
      
      const propertyProfit = (stocks.property.price - propertyBuyPrice) * player.stocks.property;
      const educationProfit = (stocks.education.price - educationBuyPrice) * player.stocks.education;
      
      return total + propertyProfit + educationProfit;
    }, 0);
  };

  // 计算已实现收益（基于交易记录）
  const calculateRealizedProfitLocal = (playerId?: string) => {
    if (playerId && playerId !== 'all') {
      return calculateRealizedProfit(playerId);
    }
    
    // 计算所有玩家的已实现收益
    return players.reduce((total, player) => {
      return total + calculateRealizedProfit(player.id);
    }, 0);
  };

  // 获取玩家收益数据
  const getPlayerProfitData = useMemo(() => {
    return players.map(player => {
      const unrealizedProfit = calculateUnrealizedProfit(player.id);
      const realizedProfit = calculateRealizedProfit(player.id);
      const totalProfit = unrealizedProfit + realizedProfit;
      
      return {
        id: player.id,
        name: player.name,
        unrealizedProfit,
        realizedProfit,
        totalProfit,
        propertyStocks: player.stocks.property,
        educationStocks: player.stocks.education,
        propertyValue: player.stocks.property * stocks.property.price,
        educationValue: player.stocks.education * stocks.education.price,
        totalValue: getPlayerTotalValue(player.id)
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [players, stocks, getPlayerTotalValue]);

  // 获取股票类型收益分布
  const getStockTypeProfitData = useMemo(() => {
    const targetPlayers = selectedPlayer === 'all' ? players : [players.find(p => p.id === selectedPlayer)!].filter(Boolean);
    
    const propertyProfit = targetPlayers.reduce((sum, player) => {
      const propertyBuyPrice = 100; // 假设买入价格为100
      return sum + (stocks.property.price - propertyBuyPrice) * player.stocks.property;
    }, 0);
    
    const educationProfit = targetPlayers.reduce((sum, player) => {
      const educationBuyPrice = 100; // 假设买入价格为100
      return sum + (stocks.education.price - educationBuyPrice) * player.stocks.education;
    }, 0);
    
    return [
      { name: '房地产', value: propertyProfit, color: '#3B82F6' },
      { name: '教育', value: educationProfit, color: '#10B981' }
    ];
  }, [players, stocks, selectedPlayer]);

  // 获取收益趋势数据（基于股票价格历史）
  const getProfitTrendData = useMemo(() => {
    const maxLength = Math.max(stocks.property.history.length, stocks.education.history.length);
    
    return Array.from({ length: maxLength }, (_, index) => {
      const propertyPrice = stocks.property.history[index]?.price || stocks.property.price;
      const educationPrice = stocks.education.history[index]?.price || stocks.education.price;
      
      const targetPlayers = selectedPlayer === 'all' ? players : [players.find(p => p.id === selectedPlayer)!].filter(Boolean);
      
      const totalProfit = targetPlayers.reduce((sum, player) => {
        const propertyBuyPrice = 100; // 假设买入价格为100
        const educationBuyPrice = 100; // 假设买入价格为100
        const propertyProfit = (propertyPrice - propertyBuyPrice) * player.stocks.property;
        const educationProfit = (educationPrice - educationBuyPrice) * player.stocks.education;
        return sum + propertyProfit + educationProfit;
      }, 0);
      
      return {
        time: index + 1,
        profit: totalProfit,
        timestamp: stocks.property.history[index]?.timestamp || stocks.education.history[index]?.timestamp || Date.now()
      };
    });
  }, [players, stocks, selectedPlayer]);

  const totalUnrealizedProfit = calculateUnrealizedProfit(selectedPlayer === 'all' ? undefined : selectedPlayer);
  const totalRealizedProfit = calculateRealizedProfitLocal(selectedPlayer === 'all' ? undefined : selectedPlayer);
  const totalProfit = totalUnrealizedProfit + totalRealizedProfit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">股票收益分析</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 玩家筛选 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">玩家筛选</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPlayer('all')}
              className={cn(
                'px-3 py-2 rounded-lg font-medium transition-colors',
                selectedPlayer === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              全部玩家
            </button>
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={cn(
                  'px-3 py-2 rounded-lg font-medium transition-colors',
                  selectedPlayer === player.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>

        {/* 收益概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <h3 className="font-semibold">未实现收益</h3>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {totalUnrealizedProfit >= 0 ? '+' : ''}¥{totalUnrealizedProfit.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">当前持有股票盈亏</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <h3 className="font-semibold">已实现收益</h3>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              totalRealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {totalRealizedProfit >= 0 ? '+' : ''}¥{totalRealizedProfit.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">已提现金额</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <h3 className="font-semibold">总收益</h3>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">总盈亏情况</p>
          </div>
        </div>

        {/* 玩家收益排行 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">玩家收益排行</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPlayerProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const label = name === 'unrealizedProfit' ? '未实现收益' : 
                                 name === 'realizedProfit' ? '已实现收益' : '总收益';
                    return [`¥${value.toFixed(2)}`, label];
                  }}
                />
                <Bar dataKey="unrealizedProfit" fill="#10B981" name="未实现收益" />
                <Bar dataKey="realizedProfit" fill="#3B82F6" name="已实现收益" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 股票类型收益分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-4">股票类型收益分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getStockTypeProfitData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ¥${value.toFixed(2)}`}
                  >
                    {getStockTypeProfitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 收益趋势 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-4">收益趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getProfitTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '收益']}
                    labelFormatter={(label) => `第${label}次变动`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 详细数据表格 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">详细数据</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">玩家</th>
                  <th className="text-right py-2 px-3">房地产股数</th>
                  <th className="text-right py-2 px-3">教育股数</th>
                  <th className="text-right py-2 px-3">未实现收益</th>
                  <th className="text-right py-2 px-3">已实现收益</th>
                  <th className="text-right py-2 px-3">总收益</th>
                  <th className="text-right py-2 px-3">总价值</th>
                </tr>
              </thead>
              <tbody>
                {getPlayerProfitData.map(player => (
                  <tr key={player.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{player.name}</td>
                    <td className="text-right py-2 px-3">{player.propertyStocks}</td>
                    <td className="text-right py-2 px-3">{player.educationStocks}</td>
                    <td className={cn(
                      'text-right py-2 px-3 font-medium',
                      player.unrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {player.unrealizedProfit >= 0 ? '+' : ''}¥{player.unrealizedProfit.toFixed(2)}
                    </td>
                    <td className={cn(
                      'text-right py-2 px-3 font-medium',
                      player.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {player.realizedProfit >= 0 ? '+' : ''}¥{player.realizedProfit.toFixed(2)}
                    </td>
                    <td className={cn(
                      'text-right py-2 px-3 font-bold',
                      player.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {player.totalProfit >= 0 ? '+' : ''}¥{player.totalProfit.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-3 font-medium">¥{player.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}