import { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Building2,
  Clock3,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Undo2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useGameStore, type StockType } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const presetChanges = [3, 5, 10];

const stockMeta: Record<StockType, { icon: typeof Building2; color: string; surface: string; line: string }> = {
  property: { icon: Building2, color: 'text-blue-600', surface: 'bg-blue-50', line: '#3B82F6' },
  education: { icon: GraduationCap, color: 'text-emerald-600', surface: 'bg-emerald-50', line: '#10B981' },
};

export default function StockMarket() {
  const navigate = useNavigate();
  const { stocks, adjustStockPrice, undoLastOperation, history } = useGameStore();
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [selectedStock, setSelectedStock] = useState<StockType>('property');
  const [isIncrease, setIsIncrease] = useState(true);

  const currentStock = stocks[selectedStock];
  const meta = stockMeta[selectedStock];

  const handlePriceChange = (percentage: number) => {
    adjustStockPrice(selectedStock, isIncrease ? percentage : -percentage);
    toast.success(`${currentStock.name}${isIncrease ? '上涨' : '下跌'}${percentage}%`);
  };

  const handleCustomChange = () => {
    const amount = Number(customAmount[selectedStock] || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('请输入有效的涨跌幅度');
      return;
    }

    handlePriceChange(amount);
    setCustomAmount((current) => ({ ...current, [selectedStock]: '' }));
  };

  const handleUndo = () => {
    if (undoLastOperation()) {
      toast.success('已撤回上一次操作');
    } else {
      toast.error('没有可撤回的操作');
    }
  };

  const chartData = currentStock.history.map((point, index) => ({
    time: index + 1,
    price: point.price,
    timestamp: new Date(point.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
      <header className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="返回首页"
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-500/20">
                <Activity size={21} />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">股票市场</h1>
                <p className="text-xs text-slate-500">价格控制与走势</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 size={16} />
            <span className="hidden sm:inline">撤回</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(stocks).map((stock) => {
            const stockStyle = stockMeta[stock.id];
            const Icon = stockStyle.icon;
            const isSelected = selectedStock === stock.id;
            return (
              <button
                key={stock.id}
                type="button"
                onClick={() => setSelectedStock(stock.id)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-blue-200 bg-white shadow-md shadow-blue-100/60 ring-2 ring-blue-100'
                    : 'border-white bg-white/70 shadow-sm hover:border-slate-200 hover:bg-white',
                )}
              >
                <span className={cn('rounded-xl p-2.5', stockStyle.surface, stockStyle.color)}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-500">{stock.name}</span>
                  <span className="mt-0.5 block text-2xl font-bold tracking-tight text-slate-900">¥{stock.price.toFixed(2)}</span>
                </span>
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />}
              </button>
            );
          })}
        </div>

        <section className="mt-5 rounded-3xl border border-white bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">{currentStock.name}</p>
            <p className="mt-2 text-5xl font-black tracking-[-0.045em] text-slate-900 sm:text-6xl">¥{currentStock.price.toFixed(2)}</p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">调整价格</h2>
                <p className="mt-0.5 text-xs text-slate-500">选择方向和变动幅度</p>
              </div>
              <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-400 shadow-sm sm:block">
                {history.length > 0 ? `可撤回 ${history.length} 次` : '暂无可撤回操作'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1fr_1.15fr] lg:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400">变动方向</p>
                <div className="grid grid-cols-2 rounded-xl bg-slate-200/60 p-1">
                  <button
                    type="button"
                    onClick={() => setIsIncrease(true)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all',
                      isIncrease ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    <TrendingUp size={17} />上涨
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIncrease(false)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all',
                      !isIncrease ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500',
                    )}
                  >
                    <TrendingDown size={17} />下跌
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400">快捷幅度</p>
                <div className="grid grid-cols-3 gap-2">
                  {presetChanges.map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => handlePriceChange(percentage)}
                      className={cn(
                        'h-11 rounded-xl border bg-white text-sm font-bold transition-all',
                        isIncrease
                          ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                          : 'border-red-100 text-red-600 hover:bg-red-50',
                      )}
                    >
                      {isIncrease ? '+' : '-'}{percentage}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="custom-change" className="mb-2 block text-xs font-semibold tracking-wide text-slate-400">自定义幅度</label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      id="custom-change"
                      type="number"
                      value={customAmount[selectedStock] || ''}
                      onChange={(event) => setCustomAmount((current) => ({ ...current, [selectedStock]: event.target.value }))}
                      onKeyDown={(event) => event.key === 'Enter' && handleCustomChange()}
                      min="0.1"
                      step="0.1"
                      placeholder="例如 2.5"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomChange}
                    className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
                  >
                    应用
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">实时走势</h2>
              <p className="mt-0.5 text-xs text-slate-500">每次调价后自动记录价格节点</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', meta.surface, meta.color)}>实时更新</span>
          </div>

          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '价格']}
                  labelFormatter={(label) => `第 ${label} 次变动`}
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={meta.line}
                  strokeWidth={3}
                  dot={{ fill: meta.line, strokeWidth: 3, stroke: '#fff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-white bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">最近价格记录</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {currentStock.history.slice(-6).reverse().map((record, index) => (
              <div key={`${record.timestamp}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
                <span className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</span>
                <span className="font-semibold text-slate-800">¥{record.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
