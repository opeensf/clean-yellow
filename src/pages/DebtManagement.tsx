import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Plus,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';

const QUICK_AMOUNTS = [1000, 3000, 5000];
const GRAPH_WIDTH = 600;
const GRAPH_HEIGHT = 520;
const GRAPH_CENTER = { x: 300, y: 250 };
const PLAYER_RADIUS = 190;
const NODE_RADIUS = 38;

interface Point {
  x: number;
  y: number;
}

interface EdgeGeometry {
  path: string;
  labelX: number;
  labelY: number;
}

function getCurveGeometry(from: Point, to: Point, curveOffset: number, labelPosition = 0.5): EdgeGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const unitX = dx / distance;
  const unitY = dy / distance;
  const start = { x: from.x + unitX * NODE_RADIUS, y: from.y + unitY * NODE_RADIUS };
  const end = { x: to.x - unitX * (NODE_RADIUS + 4), y: to.y - unitY * (NODE_RADIUS + 4) };
  const control = {
    x: (start.x + end.x) / 2 - unitY * curveOffset,
    y: (start.y + end.y) / 2 + unitX * curveOffset,
  };
  const inverseLabelPosition = 1 - labelPosition;
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    labelX: inverseLabelPosition ** 2 * start.x
      + 2 * inverseLabelPosition * labelPosition * control.x
      + labelPosition ** 2 * end.x,
    labelY: inverseLabelPosition ** 2 * start.y
      + 2 * inverseLabelPosition * labelPosition * control.y
      + labelPosition ** 2 * end.y,
  };
}

function getReadableLineColor(hexColor: string): string {
  const normalized = hexColor.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#64748B';

  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    if (maximum === blue) hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  const readableSaturation = Math.max(58, Math.round(saturation * 100));
  const readableLightness = Math.min(56, Math.max(42, Math.round(lightness * 100)));
  return `hsl(${Math.round(hue)} ${readableSaturation}% ${readableLightness}%)`;
}

export default function DebtManagement() {
  const navigate = useNavigate();
  const { players, debts, addDebt, repayDebt, removeDebt } = useGameStore();
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [selectedCreditor, setSelectedCreditor] = useState<string | null>(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({});

  const totalRemaining = debts.reduce((total, debt) => total + debt.remainingAmount, 0);
  const getPlayer = (playerId: string) => players.find((player) => player.id === playerId);
  const getPartyName = (partyId: string) => partyId === 'bank' ? '银行' : getPlayer(partyId)?.name || '未知';
  const getInitial = (name: string) => Array.from(name.trim())[0] || '玩';

  const playerPositions = new Map(
    players.map((player, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(players.length, 1);
      return [player.id, {
        x: GRAPH_CENTER.x + Math.cos(angle) * PLAYER_RADIUS,
        y: GRAPH_CENTER.y + Math.sin(angle) * PLAYER_RADIUS,
      }] as const;
    }),
  );

  const getPartyPosition = (partyId: string): Point => partyId === 'bank'
    ? GRAPH_CENTER
    : playerPositions.get(partyId) || GRAPH_CENTER;

  const resetSelection = () => {
    setSelectedDebtor(null);
    setSelectedCreditor(null);
    setDebtAmount('');
  };

  const handlePlayerClick = (playerId: string) => {
    const playerName = getPlayer(playerId)?.name;
    if (!selectedDebtor || selectedCreditor) {
      setSelectedDebtor(playerId);
      setSelectedCreditor(null);
      setDebtAmount('');
      toast.info(`已选择债务人：${playerName}`);
      return;
    }
    if (playerId === selectedDebtor) {
      toast.error('债务人和债权人不能是同一人');
      return;
    }
    setSelectedCreditor(playerId);
    toast.info(`已选择债权人：${playerName}`);
  };

  const handleBankClick = () => {
    if (!selectedDebtor) {
      toast.error('请先选择债务人');
      return;
    }
    setSelectedCreditor('bank');
    toast.info('已选择债权人：银行');
  };

  const handleAddDebt = () => {
    const amount = Number(debtAmount);
    if (!selectedDebtor || !selectedCreditor) {
      toast.error('请先选择债务人和债权人');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('请输入有效的欠款金额');
      return;
    }
    addDebt(selectedDebtor, selectedCreditor, amount);
    toast.success('欠款记录已添加');
    resetSelection();
  };

  const handlePartialRepay = (debtId: string) => {
    const amount = Number(repayAmounts[debtId] || 0);
    const debt = debts.find((item) => item.id === debtId);
    if (!debt || !Number.isFinite(amount) || amount <= 0) {
      toast.error('请输入有效的偿还金额');
      return;
    }
    if (amount > debt.remainingAmount) {
      toast.error('偿还金额不能超过剩余欠款');
      return;
    }
    repayDebt(debtId, amount);
    setRepayAmounts((current) => ({ ...current, [debtId]: '' }));
    toast.success(`已偿还 ¥${amount.toLocaleString()}`);
  };

  const handleFullRepay = (debtId: string) => {
    repayDebt(debtId);
    toast.success('债务已全部偿还');
  };

  const handleRemoveDebt = (debtId: string) => {
    if (window.confirm('确定要删除这条债务记录吗？')) {
      removeDebt(debtId);
      toast.success('债务记录已删除');
    }
  };

  const selectionLabel = !selectedDebtor
    ? '点击外围头像确定债务人'
    : !selectedCreditor
      ? '再点击另一位玩家或中央银行确定债权人'
      : `${getPartyName(selectedDebtor)} 欠 ${getPartyName(selectedCreditor)}`;

  const previewGeometry = selectedDebtor && selectedCreditor
    ? getCurveGeometry(
        getPartyPosition(selectedDebtor),
        getPartyPosition(selectedCreditor),
        selectedCreditor === 'bank' ? -18 : 200,
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/40 to-blue-50/60">
      <header className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/')} aria-label="返回首页" className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-gradient-to-br from-red-500 to-pink-600 p-2.5 text-white shadow-lg shadow-red-500/20"><CreditCard size={22} /></span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">欠债管理</h1>
                <p className="text-xs text-slate-500">点击节点建立债务关系</p>
              </div>
            </div>
          </div>
          <span className="hidden rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 sm:block">{debts.length} 条债务</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><WalletCards size={17} className="text-red-500" />待偿还总额</div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">¥{totalRemaining.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><Users size={17} className="text-blue-500" />债务关系</div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{debts.length}<span className="ml-1 text-sm font-medium text-slate-400">条</span></p>
          </div>
        </div>

        <section className="mt-5 rounded-3xl border border-white bg-white/90 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">债务关系图</h2>
              <p className="mt-1 text-sm text-slate-500">{selectionLabel}</p>
            </div>
            {(selectedDebtor || selectedCreditor) && (
              <button type="button" onClick={resetSelection} className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200">重新选择</button>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
            <svg viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} className="h-[390px] w-full sm:h-[470px]" role="img" aria-label="债务关系图">
              <defs>
                {debts.map((debt) => {
                  const debtorColor = getReadableLineColor(getPlayer(debt.debtorId)?.color || '#64748B');
                  return (
                    <marker key={debt.id} id={`arrow-${debt.id}`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L8,3 z" fill={debtorColor} />
                    </marker>
                  );
                })}
                <marker id="arrow-preview" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L8,3 z" fill="#8B5CF6" />
                </marker>
                <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#64748B" floodOpacity="0.16" />
                </filter>
              </defs>

              <ellipse cx={GRAPH_CENTER.x} cy={GRAPH_CENTER.y} rx={PLAYER_RADIUS + 30} ry={PLAYER_RADIUS + 18} fill="none" stroke="#E2E8F0" strokeDasharray="4 8" />

              {debts.map((debt, index) => {
                const isBankDebt = debt.creditorId === 'bank';
                const geometry = getCurveGeometry(
                  getPartyPosition(debt.debtorId),
                  getPartyPosition(debt.creditorId),
                  isBankDebt ? ((index % 3) - 1) * 18 : 205 + (index % 2) * 24,
                  isBankDebt ? 0.42 : 0.24,
                );
                const color = getReadableLineColor(getPlayer(debt.debtorId)?.color || '#64748B');
                const label = `¥${debt.remainingAmount.toLocaleString()}`;
                const labelWidth = Math.max(54, label.length * 9 + 18);
                return (
                  <g key={debt.id}>
                    <title>{getPartyName(debt.debtorId)} 欠 {getPartyName(debt.creditorId)} {label}</title>
                    <path d={geometry.path} fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.78" markerEnd={`url(#arrow-${debt.id})`} />
                    <rect x={geometry.labelX - labelWidth / 2} y={geometry.labelY - 14} width={labelWidth} height="28" rx="14" fill="white" stroke={color} strokeOpacity="0.3" />
                    <text x={geometry.labelX} y={geometry.labelY + 5} textAnchor="middle" fill={color} fontSize="13" fontWeight="700">{label}</text>
                  </g>
                );
              })}

              {previewGeometry && (
                <path d={previewGeometry.path} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="8 7" markerEnd="url(#arrow-preview)" />
              )}

              <g
                role="button"
                tabIndex={0}
                aria-label="选择银行为债权人"
                onClick={handleBankClick}
                onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && handleBankClick()}
                className="cursor-pointer outline-none"
                transform={`translate(${GRAPH_CENTER.x} ${GRAPH_CENTER.y})`}
              >
                <rect x="-49" y="-34" width="98" height="68" rx="20" fill="#3B82F6" filter="url(#node-shadow)" stroke={selectedCreditor === 'bank' ? '#8B5CF6' : 'white'} strokeWidth={selectedCreditor === 'bank' ? 6 : 4} />
                <Building2 x="-12" y="-20" width="24" height="24" color="white" />
                <text y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">银行</text>
              </g>

              {players.map((player) => {
                const position = getPartyPosition(player.id);
                const isDebtor = selectedDebtor === player.id;
                const isCreditor = selectedCreditor === player.id;
                const stroke = isDebtor ? '#F43F5E' : isCreditor ? '#3B82F6' : 'white';
                return (
                  <g
                    key={player.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`选择${player.name}`}
                    onClick={() => handlePlayerClick(player.id)}
                    onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && handlePlayerClick(player.id)}
                    className="cursor-pointer outline-none"
                    transform={`translate(${position.x} ${position.y})`}
                  >
                    <circle r={NODE_RADIUS} fill={player.color} filter="url(#node-shadow)" stroke={stroke} strokeWidth={isDebtor || isCreditor ? 7 : 4} />
                    <text y="7" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{getInitial(player.name)}</text>
                    {(isDebtor || isCreditor) && (
                      <g>
                        <rect x="-29" y="-61" width="58" height="22" rx="11" fill={isDebtor ? '#FFF1F2' : '#EFF6FF'} />
                        <text y="-46" textAnchor="middle" fill={isDebtor ? '#E11D48' : '#2563EB'} fontSize="11" fontWeight="700">{isDebtor ? '债务人' : '债权人'}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {selectedDebtor && selectedCreditor && (
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <span>{getPartyName(selectedDebtor)}</span><ArrowRight size={16} /><span>{getPartyName(selectedCreditor)}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="relative min-w-0">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">¥</span>
                  <input
                    type="number"
                    value={debtAmount}
                    onChange={(event) => setDebtAmount(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddDebt()}
                    min="0.01"
                    step="0.01"
                    autoFocus
                    placeholder="输入欠款金额"
                    className="h-11 w-full rounded-xl border border-violet-200 bg-white pl-8 pr-3 font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button key={amount} type="button" onClick={() => setDebtAmount(String(amount))} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-violet-600">¥{amount / 1000}K</button>
                  ))}
                </div>
                <button type="button" onClick={handleAddDebt} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700">
                  <Plus size={17} />确认添加
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-white bg-white/90 p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">债务操作</h2>
              <p className="mt-1 text-sm text-slate-500">偿还或管理图中的债务记录</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{debts.length} 条</span>
          </div>

          {debts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">暂无债务，请在上方关系图中添加</div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {debts.map((debt) => {
                const debtorName = getPartyName(debt.debtorId);
                const creditorName = getPartyName(debt.creditorId);
                const repaidProgress = debt.originalAmount > 0
                  ? Math.max(0, Math.min(100, (1 - debt.remainingAmount / debt.originalAmount) * 100))
                  : 0;
                return (
                  <article key={debt.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="truncate">{debtorName}</span><ArrowRight size={15} className="shrink-0 text-slate-400" /><span className="truncate">{creditorName}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">原始 ¥{debt.originalAmount.toLocaleString()} · 已还 {repaidProgress.toFixed(0)}%</p>
                      </div>
                      <p className="shrink-0 text-lg font-bold text-red-600">¥{debt.remainingAmount.toLocaleString()}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-label={`${debtorName}的还款进度`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(repaidProgress)}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-300"
                        style={{ width: `${repaidProgress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                        <input
                          type="number"
                          value={repayAmounts[debt.id] || ''}
                          onChange={(event) => setRepayAmounts((current) => ({ ...current, [debt.id]: event.target.value }))}
                          onKeyDown={(event) => event.key === 'Enter' && handlePartialRepay(debt.id)}
                          min="0.01"
                          max={debt.remainingAmount}
                          step="0.01"
                          placeholder="偿还金额"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                      <button type="button" onClick={() => handlePartialRepay(debt.id)} className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">偿还</button>
                      <button type="button" onClick={() => handleFullRepay(debt.id)} className="flex h-10 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><CheckCircle2 size={15} />还清</button>
                      <button type="button" onClick={() => handleRemoveDebt(debt.id)} aria-label="删除债务" className="flex h-10 items-center justify-center rounded-xl px-3 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
