import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  CreditCard,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';
import { useGameStore, type StockType } from '../store/gameStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const stockMeta: Record<StockType, { icon: typeof Building2; color: string; surface: string }> = {
  property: { icon: Building2, color: 'text-blue-600', surface: 'bg-blue-50' },
  education: { icon: GraduationCap, color: 'text-emerald-600', surface: 'bg-emerald-50' },
};

export default function Home() {
  const navigate = useNavigate();
  const { stocks, players, getPlayerTotalValue, startNewGame } = useGameStore();

  const getStockChange = (stockType: StockType) => {
    const stock = stocks[stockType];
    if (stock.history.length < 2) return { change: 0, percentage: 0 };

    const current = stock.price;
    const previous = stock.history[stock.history.length - 2].price;
    return {
      change: current - previous,
      percentage: previous === 0 ? 0 : ((current - previous) / previous) * 100,
    };
  };

  const playersWithAssets = players
    .map((player) => ({ ...player, totalValue: getPlayerTotalValue(player.id) }))
    .filter((player) => player.totalValue > 0 || player.stocks.property > 0 || player.stocks.education > 0)
    .sort((a, b) => b.totalValue - a.totalValue);

  const playerRanking = playersWithAssets.length > 3
    ? playersWithAssets
    : players
        .map((player) => ({ ...player, totalValue: getPlayerTotalValue(player.id) }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 3);

  const handleNewGame = () => {
    if (window.confirm('确定要开始新一局游戏吗？这将重置所有数据但保留默认玩家。')) {
      startNewGame();
      toast.success('新一局游戏已开始！');
    }
  };

  const quickActions = [
    {
      title: '欠债管理',
      description: '记录与管理玩家欠款',
      icon: CreditCard,
      path: '/debts',
      color: 'text-indigo-600',
      surface: 'bg-indigo-50',
    },
    {
      title: '收益分析',
      description: '查看股票收益情况',
      icon: BarChart3,
      path: '/profit-analysis',
      color: 'text-orange-600',
      surface: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <img
                src={`${import.meta.env.BASE_URL}clean-yellow-team-logo.png`}
                alt="陵水县黎族自治县扫黄大队标志"
                className="absolute max-w-none"
                style={{ width: 180, left: -64, top: -14 }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">扫黄之旅辅助工具</h1>
              <p className="mt-1 truncate text-sm text-slate-500">陵水县扫黄组开发制作</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNewGame}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50"
          >
            <RotateCcw size={17} />
            <span className="hidden sm:inline">新一局</span>
          </button>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">股票概览</h2>
                <p className="mt-1 text-sm text-slate-500">当前价格与最近一次变动</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/stocks')}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                管理
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.values(stocks).map((stock) => {
                const { change, percentage } = getStockChange(stock.id);
                const isPositive = change >= 0;
                const meta = stockMeta[stock.id];
                const Icon = meta.icon;

                return (
                  <button
                    key={stock.id}
                    type="button"
                    onClick={() => navigate('/stocks')}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn('rounded-xl p-2.5', meta.surface, meta.color)}>
                        <Icon size={20} />
                      </span>
                      <span className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                      )}>
                        {isPositive ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        {Math.abs(percentage).toFixed(2)}%
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-500">{stock.name}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">¥{stock.price.toFixed(2)}</p>
                    <p className={cn('mt-2 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                      较上次 {isPositive ? '+' : '-'}¥{Math.abs(change).toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">快速操作</h2>
            <p className="mt-1 text-sm text-slate-500">常用的辅助功能</p>
            <div className="mt-5 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                  >
                    <span className={cn('rounded-xl p-2.5', action.surface, action.color)}>
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-800">{action.title}</span>
                      <span className="block truncate text-xs text-slate-500">{action.description}</span>
                    </span>
                    <ArrowRight size={17} className="text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-3xl border border-white bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">玩家股票资产</h2>
              <p className="mt-1 text-sm text-slate-500">按当前股票价值排序</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{players.length} 名玩家</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {playerRanking.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {Array.from(player.name)[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{player.name}</p>
                    <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">房产 {player.stocks.property} 股 · 教育 {player.stocks.education} 股</p>
                </div>
                <p className="shrink-0 font-bold text-blue-600">¥{player.totalValue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
