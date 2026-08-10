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
import { cn } from '../lib/utils';

const QUICK_AMOUNTS = [1000, 3000, 5000];

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
  const getPartyColor = (partyId: string) => partyId === 'bank' ? '#3B82F6' : getPlayer(partyId)?.color || '#94A3B8';
  const getInitial = (name: string) => Array.from(name.trim())[0] || '玩';

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
    ? '选择债务人'
    : !selectedCreditor
      ? '选择债权人'
      : '选择完成，可填写金额';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/40 to-blue-50/60">
      <header className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
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
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-pink-600 p-2.5 shadow-lg shadow-red-500/20">
                <CreditCard className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">欠债管理</h1>
                <p className="text-xs text-slate-500">记录、查看与偿还债务</p>
              </div>
            </div>
          </div>

          <div className="hidden rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 sm:block">
            {debts.length} 条债务
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <WalletCards size={17} className="text-red-500" />
              待偿还总额
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">¥{totalRemaining.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Users size={17} className="text-blue-500" />
              债务关系
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{debts.length}<span className="ml-1 text-sm font-medium text-slate-400">条</span></p>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <section className="rounded-3xl border border-white/90 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">新建欠款</h2>
                <p className="mt-1 text-sm text-slate-500">{selectionLabel}</p>
              </div>
              {(selectedDebtor || selectedCreditor) && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
                >
                  重置
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDebtor(null);
                  setSelectedCreditor(null);
                  setDebtAmount('');
                }}
                className="min-w-0 rounded-xl p-2 text-center transition-colors hover:bg-white"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-600">
                  {selectedDebtor ? getInitial(getPartyName(selectedDebtor)) : '1'}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-slate-800">
                  {selectedDebtor ? getPartyName(selectedDebtor) : '债务人'}
                </span>
              </button>

              <div className="flex flex-col items-center gap-1 text-slate-400">
                <span className="text-[10px] font-medium">欠款给</span>
                <ArrowRight size={22} />
              </div>

              <button
                type="button"
                disabled={!selectedDebtor}
                onClick={() => {
                  setSelectedCreditor(null);
                  setDebtAmount('');
                }}
                className="min-w-0 rounded-xl p-2 text-center transition-colors hover:bg-white disabled:cursor-default"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                  {selectedCreditor ? getInitial(getPartyName(selectedCreditor)) : '2'}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-slate-800">
                  {selectedCreditor ? getPartyName(selectedCreditor) : '债权人'}
                </span>
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">玩家</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
                {players.map((player) => {
                  const isDebtor = selectedDebtor === player.id;
                  const isCreditor = selectedCreditor === player.id;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handlePlayerClick(player.id)}
                      className={cn(
                        'flex min-w-0 flex-col items-center rounded-xl border px-2 py-3 transition-all',
                        isDebtor && 'border-red-300 bg-red-50 ring-2 ring-red-100',
                        isCreditor && 'border-blue-300 bg-blue-50 ring-2 ring-blue-100',
                        !isDebtor && !isCreditor && 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: player.color }}
                      >
                        {getInitial(player.name)}
                      </span>
                      <span className="mt-2 w-full truncate text-xs font-medium text-slate-700">{player.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDebtor && (
              <button
                type="button"
                onClick={handleBankClick}
                className={cn(
                  'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                  selectedCreditor === 'bank'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50',
                )}
              >
                <Building2 size={17} />
                选择银行为债权人
              </button>
            )}

            {selectedDebtor && selectedCreditor && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <label htmlFor="debt-amount" className="text-sm font-semibold text-slate-700">欠款金额</label>
                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">¥</span>
                  <input
                    id="debt-amount"
                    type="number"
                    value={debtAmount}
                    onChange={(event) => setDebtAmount(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddDebt()}
                    min="0.01"
                    step="0.01"
                    autoFocus
                    placeholder="输入金额"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDebtAmount(String(amount))}
                      className="rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      ¥{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddDebt}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-600 hover:to-pink-700"
                >
                  <Plus size={18} />
                  添加欠款
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/90 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">债务关系</h2>
                <p className="mt-1 text-sm text-slate-500">清晰显示资金流向与剩余金额</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{debts.length} 条</span>
            </div>

            {debts.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <CreditCard size={30} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-700">暂无债务关系</h3>
                <p className="mt-1 text-sm text-slate-400">从左侧选择双方并添加欠款</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {debts.map((debt) => {
                  const debtorName = getPartyName(debt.debtorId);
                  const creditorName = getPartyName(debt.creditorId);
                  const repaidProgress = debt.originalAmount > 0
                    ? Math.max(0, Math.min(100, (1 - debt.remainingAmount / debt.originalAmount) * 100))
                    : 0;

                  return (
                    <article key={debt.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="min-w-0 text-center">
                          <span
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
                            style={{ backgroundColor: getPartyColor(debt.debtorId) }}
                          >
                            {getInitial(debtorName)}
                          </span>
                          <p className="mt-2 truncate text-sm font-semibold text-slate-800">{debtorName}</p>
                          <p className="text-[11px] text-slate-400">债务人</p>
                        </div>

                        <div className="min-w-24 text-center">
                          <p className="text-lg font-bold tracking-tight text-red-600">¥{debt.remainingAmount.toLocaleString()}</p>
                          <div className="mt-1 flex items-center gap-1 text-red-300">
                            <span className="h-px flex-1 bg-red-200" />
                            <ArrowRight size={18} />
                            <span className="h-px flex-1 bg-red-200" />
                          </div>
                          <p className="mt-1 text-[10px] font-medium text-slate-400">剩余未还</p>
                        </div>

                        <div className="min-w-0 text-center">
                          <span
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
                            style={{ backgroundColor: getPartyColor(debt.creditorId) }}
                          >
                            {debt.creditorId === 'bank' ? <Building2 size={21} /> : getInitial(creditorName)}
                          </span>
                          <p className="mt-2 truncate text-sm font-semibold text-slate-800">{creditorName}</p>
                          <p className="text-[11px] text-slate-400">债权人</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                          <span>已还款进度</span>
                          <span>原始 ¥{debt.originalAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${repaidProgress}%` }} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">¥</span>
                          <input
                            type="number"
                            value={repayAmounts[debt.id] || ''}
                            onChange={(event) => setRepayAmounts((current) => ({ ...current, [debt.id]: event.target.value }))}
                            onKeyDown={(event) => event.key === 'Enter' && handlePartialRepay(debt.id)}
                            min="0.01"
                            max={debt.remainingAmount}
                            step="0.01"
                            placeholder="偿还金额"
                            aria-label={`${debtorName}偿还金额`}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePartialRepay(debt.id)}
                          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          偿还
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFullRepay(debt.id)}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <CheckCircle2 size={16} />
                          全部还清
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDebt(debt.id)}
                          aria-label="删除债务"
                          className="flex h-10 w-full items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:w-10"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
