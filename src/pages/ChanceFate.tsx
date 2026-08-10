import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Dice6,
  GraduationCap,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, type StockType } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// 事件类型定义
interface ChanceEvent {
  id: string;
  description: string;
  effects: {
    stockType: 'property' | 'education';
    change: number; // 百分比变化
  }[];
}

// 贴近中国大学生生活的机会命运事件（32个，完全均衡，期望值为正）
const chanceEvents: ChanceEvent[] = [
  // 房产股+3%，教育股-2%（8个事件）
  {
    id: 'dormitory_wifi_down',
    description: '宿舍WiFi大面积故障，学生涌向网吧和咖啡厅',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'campus_renovation',
    description: '多所高校同时进行校园改造，建筑材料需求暴涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'internship_housing',
    description: '实习季到来，一线城市短租房需求暴涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'startup_boom',
    description: '大学生创业政策利好，众创空间和孵化器需求激增',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'milk_tea_craze',
    description: '新式茶饮店在校园周边疯狂扩张，商铺租金上涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'esports_tournament',
    description: '大学生电竞联赛火爆，网吧和电竞馆生意兴隆',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'housing_policy',
    description: '人才引进政策出台，大学生购房补贴推动房地产市场',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'campus_expansion',
    description: '多所大学宣布扩建计划，周边土地价值水涨船高',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  
  // 教育股+3%，房产股-2%（8个事件）
  {
    id: 'final_exam_week',
    description: '期末考试周来临，图书馆爆满，教育培训需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'scholarship_policy',
    description: '国家奖学金政策调整，学生学习积极性大幅提升',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'graduate_job_fair',
    description: '春招秋招火爆，职业培训和简历辅导需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'civil_service_exam',
    description: '公务员考试报名人数创新高，公考培训机构爆满',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'study_group_trend',
    description: '学习小组和读书会成为新潮流，图书馆座位一位难求',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'education_reform',
    description: '教育部发布新政策，职业教育和技能培训获得大力支持',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'campus_5g_upgrade',
    description: '校园5G网络全覆盖，智慧教室和VR教学设备需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'mental_health_awareness',
    description: '心理健康教育受到重视，相关课程和咨询服务需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  
  // 房产股+1%，教育股+1%（8个事件）
  {
    id: 'dating_app_boom',
    description: '校园交友软件用户激增，约会场所和娱乐设施需求增加',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'new_iphone_release',
    description: '苹果发布新款iPhone，学生消费热情高涨带动整体市场',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'fitness_trend',
    description: '健身成为大学生新时尚，运动场馆和健康教育双双受益',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'idol_concert',
    description: '知名偶像团体校园巡演，带动周边商业和文化教育发展',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'campus_festival',
    description: '校园文化节盛大举办，商业区和教育活动同时繁荣',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'summer_vacation_travel',
    description: '暑期旅游hotspot，住宿业火爆，旅游教育课程也受欢迎',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'graduation_season',
    description: '毕业季到来，租房需求激增，职业规划课程也很热门',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'winter_olympics_effect',
    description: '冬奥会效应持续，体育场馆建设和体育教育双双受益',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  
  // 教育股-1%，房产股-1%（8个事件）
  {
    id: 'online_course_boom',
    description: '袁大屎买了恒大烂尾楼',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'traditional_culture_revival',
    description: '田琳会见许家印',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'language_learning_trend',
    description: '多语言学习成为趋势，语言培训机构和学习空间都很火爆',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'skill_certification_boom',
    description: '职业技能认证需求激增，培训中心和考试场地都很紧俏',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'research_competition',
    description: '大学生科研竞赛火热，学术培训和实验室空间需求上升',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'art_education_trend',
    description: '艺术教育受到重视，艺术培训和创作空间都很受欢迎',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'entrepreneurship_education',
    description: '创业教育兴起，相关课程火爆，创业空间也供不应求',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'digital_literacy_push',
    description: '数字素养教育推广，计算机培训和数字化场所双双受益',
    effects: [
      { stockType: 'education', change: -1},
      { stockType: 'property', change: -1}
    ]
  }
];

const stockDisplay: Record<StockType, {
  icon: typeof Building2;
  color: string;
  surface: string;
}> = {
  property: { icon: Building2, color: 'text-blue-600', surface: 'bg-blue-50' },
  education: { icon: GraduationCap, color: 'text-emerald-600', surface: 'bg-emerald-50' },
};

const stockOrder: StockType[] = ['property', 'education'];

export default function ChanceFate() {
  const navigate = useNavigate();
  const { stocks, adjustStockPrice } = useGameStore();
  const [isRolling, setIsRolling] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ChanceEvent | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastPriceChanges, setLastPriceChanges] = useState<Partial<Record<StockType, number>>>({});
  const [previousPrices, setPreviousPrices] = useState<Partial<Record<StockType, number>>>({});

  const handleChanceFate = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setShowResult(false);
    setCurrentEvent(null);
    setPreviousPrices({
      property: stocks.property.price,
      education: stocks.education.price,
    });

    await new Promise((resolve) => setTimeout(resolve, 1600));

    const event = chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
    const changes: Partial<Record<StockType, number>> = {};
    event.effects.forEach((effect) => {
      changes[effect.stockType] = effect.change;
      adjustStockPrice(effect.stockType, effect.change);
    });

    setCurrentEvent(event);
    setLastPriceChanges(changes);
    setShowResult(true);
    setIsRolling(false);
    toast.success('本轮市场变化已生效');
  };

  const resetState = () => {
    setCurrentEvent(null);
    setShowResult(false);
    setLastPriceChanges({});
    setPreviousPrices({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/35 to-rose-50/50">
      <header className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button type="button" onClick={() => navigate('/')} aria-label="返回首页" className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2.5 text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={21} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">机会命运</h1>
            <p className="text-xs text-slate-500">随机事件与市场变化</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-3 sm:grid-cols-2">
          {stockOrder.map((stockType) => {
            const stock = stocks[stockType];
            const display = stockDisplay[stockType];
            const Icon = display.icon;
            return (
              <div key={stockType} className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm backdrop-blur">
                <span className={cn('rounded-xl p-2.5', display.surface, display.color)}><Icon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">{stock.name}</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">¥{stock.price.toFixed(2)}</p>
                </div>
                {showResult && lastPriceChanges[stockType] !== undefined && (
                  <span className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold',
                    lastPriceChanges[stockType]! > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
                  )}>
                    {lastPriceChanges[stockType]! > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {lastPriceChanges[stockType]! > 0 ? '+' : ''}{lastPriceChanges[stockType]}%
                  </span>
                )}
              </div>
            );
          })}
        </section>

        <section className="relative mt-5 overflow-hidden rounded-3xl border border-white bg-white/90 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-rose-100/60 blur-3xl" />

          {!showResult || !currentEvent ? (
            <div className="relative flex min-h-[430px] flex-col items-center justify-center text-center">
              <div className={cn(
                'relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-2xl shadow-violet-500/25 transition-transform',
                isRolling && 'animate-spin',
              )}>
                <Dice6 size={48} />
                <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-amber-400 text-white shadow-sm">
                  <Sparkles size={16} />
                </span>
              </div>
              <span className="mt-8 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">32 个随机事件 · 同时影响两类股票</span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">让市场迎来一次转折</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">触发一项随机事件，并立即结算房产股与教育股的价格变化。</p>
              <button
                type="button"
                onClick={handleChanceFate}
                disabled={isRolling}
                className="mt-7 flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-violet-600 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-300"
              >
                <Dice6 size={18} />{isRolling ? '正在揭晓...' : '触发机会命运'}
              </button>
            </div>
          ) : (
            <div className="relative animate-fade-in">
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600"><Sparkles size={13} />本轮命运事件</span>
                <h2 className="mt-4 text-xl font-bold leading-8 tracking-tight text-slate-900 sm:text-2xl">{currentEvent.description}</h2>
                <p className="mt-2 text-sm text-slate-500">市场价格已完成结算</p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {stockOrder.map((stockType) => {
                  const stock = stocks[stockType];
                  const display = stockDisplay[stockType];
                  const Icon = display.icon;
                  const change = lastPriceChanges[stockType] ?? 0;
                  const isPositive = change > 0;
                  const DirectionIcon = isPositive ? TrendingUp : TrendingDown;
                  return (
                    <article key={stockType} className={cn(
                      'overflow-hidden rounded-2xl border p-5',
                      isPositive ? 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white' : 'border-rose-100 bg-gradient-to-br from-rose-50 to-white',
                    )}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={cn('rounded-xl bg-white p-2.5 shadow-sm', display.color)}><Icon size={20} /></span>
                          <p className="font-semibold text-slate-800">{stock.name}</p>
                        </div>
                        <span className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                          isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                        )}>
                          <DirectionIcon size={14} />{isPositive ? '上涨' : '下跌'}
                        </span>
                      </div>
                      <div className="mt-6 flex items-end justify-between gap-4">
                        <p className={cn('text-5xl font-black tracking-tighter', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                          {isPositive ? '+' : ''}{change}%
                        </p>
                        <div className="flex items-center gap-2 pb-1 text-sm font-semibold">
                          <span className="text-slate-400">¥{(previousPrices[stockType] ?? stock.price).toFixed(2)}</span>
                          <ArrowRight size={15} className="text-slate-300" />
                          <span className="text-slate-800">¥{stock.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <button type="button" onClick={handleChanceFate} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-violet-600">
                  <RotateCcw size={16} />再触发一次
                </button>
                <button type="button" onClick={resetState} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">收起结果</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
