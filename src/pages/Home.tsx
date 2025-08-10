import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Dice6, ArrowUp, ArrowDown, BarChart3, RotateCcw, Sparkles, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { stocks, players, getPlayerTotalValue, startNewGame } = useGameStore();

  // 计算股票涨跌
  const getStockChange = (stockType: 'property' | 'education') => {
    const stock = stocks[stockType];
    if (stock.history.length < 2) return { change: 0, percentage: 0 };
    
    const current = stock.price;
    const previous = stock.history[stock.history.length - 2].price;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    
    return { change, percentage };
  };

  // 获取玩家排行
  const playersWithAssets = players
    .map(player => ({
      ...player,
      totalValue: getPlayerTotalValue(player.id)
    }))
    .filter(player => player.totalValue > 0 || player.stocks.property > 0 || player.stocks.education > 0)
    .sort((a, b) => b.totalValue - a.totalValue);
  
  // 如果有超过3个玩家拥有股票，显示所有；否则显示前3名
  const playerRanking = playersWithAssets.length > 3 
    ? playersWithAssets 
    : players
        .map(player => ({
          ...player,
          totalValue: getPlayerTotalValue(player.id)
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 3);

  // 处理新一局游戏
  const handleNewGame = () => {
    if (window.confirm('确定要开始新一局游戏吗？这将重置所有数据但保留默认玩家。')) {
      startNewGame();
      toast.success('新一局游戏已开始！');
    }
  };

  const quickActions = [
    { 
      title: '股票市场', 
      description: '管理股票价格', 
      icon: TrendingUp, 
      path: '/stocks',
      color: 'bg-blue-500'
    },
    { 
      title: '玩家管理', 
      description: '管理玩家股票', 
      icon: Users, 
      path: '/players',
      color: 'bg-green-500'
    },
    { 
      title: '官方保险', 
      description: '管理玩家保险费用', 
      icon: Shield, 
      path: '/insurance',
      color: 'bg-indigo-500'
    },
    { 
      title: '机会命运', 
      description: '随机影响股票价格', 
      icon: Sparkles, 
      path: '/chance-fate',
      color: 'bg-pink-500'
    },
    { 
      title: '收益分析', 
      description: '查看股票收益情况', 
      icon: BarChart3, 
      path: '/profit-analysis',
      color: 'bg-orange-500'
    },
    { 
      title: '七星彩', 
      description: '随机轮盘游戏', 
      icon: Dice6, 
      path: '/lottery',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">扫黄之旅辅助工具</h1>
          <p className="text-gray-600 mt-1">陵水县扫黄组制作出品</p>
        </div>

        {/* 股票概览 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">股票概览</h2>
          <div className="space-y-3">
            {Object.values(stocks).map((stock) => {
              const { change, percentage } = getStockChange(stock.id);
              const isPositive = change >= 0;
              
              return (
                <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{stock.name}</h3>
                    <p className="text-2xl font-bold">¥{stock.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                      {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      {percentage.toFixed(2)}%
                    </div>
                    <p className={cn(
                      'text-sm',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                      {isPositive ? '+' : ''}¥{change.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 股票资产概览 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">股票资产概览</h2>
          <div className="space-y-3">
            {playerRanking.map((player) => (
              <div key={player.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-auto text-lg font-bold text-blue-600">
                    ¥{player.totalValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded flex items-center justify-center text-xs font-bold">
                      房
                    </span>
                    <span className="text-gray-600">{player.stocks.property}股</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold">
                      教
                    </span>
                    <span className="text-gray-600">{player.stocks.education}股</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className={cn('p-3 rounded-lg text-white', action.color)}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </button>
              );
            })}
            
            {/* 新一局游戏按钮 */}
            <button
              onClick={handleNewGame}
              className="flex items-center gap-4 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left border-2 border-red-200"
            >
              <div className="p-3 rounded-lg text-white bg-red-500">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="font-medium text-red-700">新一局游戏</h3>
                <p className="text-sm text-red-600">重置所有数据，保留默认玩家</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}