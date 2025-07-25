import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Undo2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function StockMarket() {
  const navigate = useNavigate();
  const { stocks, adjustStockPrice, updateStockPrice, undoLastOperation, history } = useGameStore();
  const [customAmount, setCustomAmount] = useState<{ [key: string]: string }>({});
  const [selectedStock, setSelectedStock] = useState<'property' | 'education'>('property');
  const [isIncrease, setIsIncrease] = useState(true);

  // 预设涨跌幅度
  const presetChanges = [1, 2, 3];

  // 处理预设涨跌
  const handlePresetChange = (stockType: 'property' | 'education', percentage: number, isIncrease: boolean) => {
    const finalPercentage = isIncrease ? percentage : -percentage;
    adjustStockPrice(stockType, finalPercentage);
    toast.success(`${stocks[stockType].name}${isIncrease ? '上涨' : '下跌'}${percentage}%`);
  };

  // 处理自定义涨跌
  const handleCustomChange = (stockType: 'property' | 'education') => {
    const amount = parseFloat(customAmount[stockType] || '0');
    if (isNaN(amount) || amount === 0) {
      toast.error('请输入有效的涨跌幅度');
      return;
    }
    
    const finalAmount = isIncrease ? amount : -amount;
    adjustStockPrice(stockType, finalAmount);
    toast.success(`${stocks[stockType].name}${isIncrease ? '上涨' : '下跌'}${amount}%`);
    setCustomAmount({ ...customAmount, [stockType]: '' });
  };

  // 处理撤回操作
  const handleUndo = () => {
    const success = undoLastOperation();
    if (success) {
      toast.success('已撤回上一次操作');
    } else {
      toast.error('没有可撤回的操作');
    }
  };

  // 处理直接设置价格
  const handleDirectPriceChange = (stockType: 'property' | 'education', newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) return;
    
    updateStockPrice(stockType, price);
    toast.success(`${stocks[stockType].name}价格已设置为¥${price.toFixed(2)}`);
  };

  // 格式化图表数据
  const getChartData = (stockType: 'property' | 'education') => {
    const stock = stocks[stockType];
    return stock.history.map((point, index) => ({
      time: index + 1,
      price: point.price,
      timestamp: new Date(point.timestamp).toLocaleTimeString()
    }));
  };

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
          <h1 className="text-xl font-semibold">股票市场</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* 股票选择 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex gap-2 mb-4">
            {Object.values(stocks).map((stock) => (
              <button
                key={stock.id}
                onClick={() => setSelectedStock(stock.id)}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                  selectedStock === stock.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {stock.name}
              </button>
            ))}
          </div>
        </div>

        {/* 当前股票信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">{stocks[selectedStock].name}</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              ¥{stocks[selectedStock].price.toFixed(2)}
            </div>
            <p className="text-gray-600">当前价格</p>
          </div>
        </div>

        {/* 价格操作 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">价格调整</h3>
          
          {/* 预设涨跌按钮 */}
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">上涨</p>
              <div className="flex gap-2">
                {presetChanges.map((percentage) => (
                  <button
                    key={`up-${percentage}`}
                    onClick={() => handlePresetChange(selectedStock, percentage, true)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <TrendingUp size={16} />
                    +{percentage}%
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">下跌</p>
              <div className="flex gap-2">
                {presetChanges.map((percentage) => (
                  <button
                    key={`down-${percentage}`}
                    onClick={() => handlePresetChange(selectedStock, percentage, false)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <TrendingDown size={16} />
                    -{percentage}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 自定义涨跌 */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">自定义涨跌幅度</p>
            
            {/* 涨跌方向选择 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setIsIncrease(true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-medium transition-colors',
                  isIncrease
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <TrendingUp size={16} />
                上涨
              </button>
              <button
                onClick={() => setIsIncrease(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-medium transition-colors',
                  !isIncrease
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <TrendingDown size={16} />
                下跌
              </button>
            </div>
            
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="输入百分比"
                min="0"
                step="0.1"
                value={customAmount[selectedStock] || ''}
                onChange={(e) => setCustomAmount({ ...customAmount, [selectedStock]: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleCustomChange(selectedStock)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
          
          {/* 撤回操作 */}
          <div className="border-t pt-4">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors',
                history.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              )}
            >
              <Undo2 size={16} />
              撤回上一次操作
            </button>
            {history.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                可撤回 {history.length} 次操作
              </p>
            )}
          </div>
        </div>

        {/* 价格走势图 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">价格走势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData(selectedStock)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip 
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '价格']}
                  labelFormatter={(label) => `第${label}次变动`}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={selectedStock === 'property' ? '#3B82F6' : '#10B981'}
                  strokeWidth={2}
                  dot={{ fill: selectedStock === 'property' ? '#3B82F6' : '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 历史记录 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">历史记录</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stocks[selectedStock].history.slice(-10).reverse().map((record, index) => (
              <div key={record.timestamp} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-600">
                  {new Date(record.timestamp).toLocaleString()}
                </span>
                <span className="font-medium">¥{record.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}